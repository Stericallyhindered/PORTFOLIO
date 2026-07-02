from __future__ import annotations

from dataclasses import dataclass
import hashlib
import json
import re
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup


USER_AGENT = "GEOCommandCenterBot/1.0 (+https://geo-command-center.local)"


@dataclass
class CrawledDocument:
    url: str
    canonical_url: str | None
    status_code: int
    title: str | None
    h1: str | None
    meta_description: str | None
    headings: list[str]
    text: str
    links: list[str]
    images: int
    tables: int
    lists: int
    faq_count: int
    schema_types: list[str]
    content_hash: str


def _normalize_domain(domain: str) -> str:
    d = domain.strip().lower()
    d = re.sub(r"^https?://", "", d)
    return d.split("/")[0]


def _base_url(domain: str) -> str:
    return f"https://{_normalize_domain(domain)}"


def _score_readability(text: str) -> float:
    words = text.split()
    if not words:
        return 0.0
    avg_word_len = sum(len(w) for w in words) / len(words)
    score = 100 - max(0, (avg_word_len - 5.5) * 10)
    return round(max(0.0, min(100.0, score)), 3)


def _score_factual_density(text: str) -> float:
    if not text:
        return 0.0
    factual_markers = len(re.findall(r"\b(is|are|was|were|includes|means|defined as)\b", text, re.I))
    sentences = max(1, len(re.split(r"[.!?]+", text)))
    return round(min(100.0, (factual_markers / sentences) * 100), 3)


def _score_extractability(headings: list[str], text: str, tables: int, lists: int) -> float:
    heading_score = min(35.0, len(headings) * 4.0)
    text_score = 35.0 if len(text.split()) >= 300 else (len(text.split()) / 300) * 35.0
    structure_score = min(30.0, (tables * 8.0) + (lists * 4.0))
    return round(max(0.0, min(100.0, heading_score + text_score + structure_score)), 3)


def _score_quoteability(text: str) -> float:
    if not text:
        return 0.0
    short_sentences = [
        s.strip()
        for s in re.split(r"[.!?]+", text)
        if 8 <= len(s.strip().split()) <= 24 and len(s.strip()) > 25
    ]
    return round(min(100.0, len(short_sentences) * 6.0), 3)


def _score_information_gain(text: str, headings: list[str], tables: int) -> float:
    unique_heading_tokens = len(
        {
            token.lower()
            for heading in headings
            for token in re.findall(r"[a-zA-Z]{4,}", heading)
        }
    )
    novelty = min(60.0, unique_heading_tokens * 2.0)
    table_bonus = min(20.0, tables * 10.0)
    length_bonus = min(20.0, len(text.split()) / 40.0)
    return round(max(0.0, min(100.0, novelty + table_bonus + length_bonus)), 3)


def _score_entity_salience(text: str, brand_name: str, competitors: list[str]) -> float:
    lower = text.lower()
    brand_hits = lower.count(brand_name.lower()) if brand_name else 0
    competitor_hits = sum(lower.count(c.lower()) for c in competitors if c)
    score = min(100.0, (brand_hits * 8.0) + (max(0, 4 - competitor_hits) * 6.0))
    return round(score, 3)


def _score_trust_signal(text: str, meta_description: str | None) -> float:
    lower = text.lower()
    trust_keywords = [
        "about",
        "contact",
        "privacy",
        "terms",
        "methodology",
        "updated",
        "sources",
    ]
    keyword_hits = sum(1 for k in trust_keywords if k in lower)
    meta_bonus = 10.0 if meta_description else 0.0
    return round(min(100.0, keyword_hits * 12.0 + meta_bonus), 3)


def _heading_depth_score(headings: list[str]) -> float:
    if not headings:
        return 0.0
    return round(min(100.0, len(headings) * 5.0), 3)


def compute_feature_scores(
    *,
    text: str,
    headings: list[str],
    tables: int,
    lists: int,
    meta_description: str | None,
    brand_name: str,
    competitors: list[str],
) -> dict[str, float]:
    return {
        "readability_score": _score_readability(text),
        "factual_density_score": _score_factual_density(text),
        "extractability_score": _score_extractability(headings, text, tables, lists),
        "quoteability_score": _score_quoteability(text),
        "information_gain_score": _score_information_gain(text, headings, tables),
        "entity_salience_score": _score_entity_salience(text, brand_name, competitors),
        "trust_signal_score": _score_trust_signal(text, meta_description),
        "heading_depth_score": _heading_depth_score(headings),
    }


def extract_entities(text: str, headings: list[str], brand_name: str, competitors: list[str]) -> list[tuple[str, str]]:
    entities: list[tuple[str, str]] = []
    seen: set[str] = set()
    if brand_name:
        entities.append((brand_name, "brand"))
        seen.add(brand_name.lower())
    for competitor in competitors:
        if competitor and competitor.lower() not in seen:
            entities.append((competitor, "competitor"))
            seen.add(competitor.lower())

    corpus = "\n".join([*headings, text[:4000]])
    for match in re.findall(r"\b([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+){0,2})\b", corpus):
        key = match.lower()
        if key in seen or len(match) < 4:
            continue
        seen.add(key)
        entities.append((match, "topic"))
        if len(entities) >= 60:
            break
    return entities


async def discover_urls(domain: str, limit: int = 25) -> list[str]:
    base = _base_url(domain)
    seen: set[str] = {base}
    urls: list[str] = [base]
    headers = {"User-Agent": USER_AGENT}
    async with httpx.AsyncClient(timeout=12.0, follow_redirects=True, headers=headers) as client:
        for candidate in [f"{base}/sitemap.xml", f"{base}/robots.txt"]:
            try:
                response = await client.get(candidate)
            except Exception:
                continue
            if response.status_code >= 400:
                continue
            text = response.text
            if candidate.endswith("sitemap.xml"):
                for loc in re.findall(r"<loc>(.*?)</loc>", text, re.I):
                    if loc.startswith("http") and loc not in seen:
                        seen.add(loc)
                        urls.append(loc)
            else:
                for site_map in re.findall(r"(?im)^Sitemap:\s*(\S+)", text):
                    if site_map.startswith("http") and site_map not in seen:
                        seen.add(site_map)
                        urls.append(site_map)

        try:
            homepage = await client.get(base)
            if homepage.status_code < 400:
                soup = BeautifulSoup(homepage.text, "lxml")
                for anchor in soup.select("a[href]"):
                    href = anchor.get("href")
                    if not href:
                        continue
                    resolved = urljoin(base, href)
                    parsed = urlparse(resolved)
                    if parsed.netloc and _normalize_domain(domain) in parsed.netloc.lower():
                        normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip("/")
                        if normalized and normalized not in seen:
                            seen.add(normalized)
                            urls.append(normalized)
        except Exception:
            pass
    filtered = [u for u in urls if not u.endswith(".xml") and "/wp-json/" not in u]
    return filtered[:limit]


async def fetch_and_extract(url: str) -> CrawledDocument | None:
    headers = {"User-Agent": USER_AGENT}
    async with httpx.AsyncClient(timeout=18.0, follow_redirects=True, headers=headers) as client:
        try:
            response = await client.get(url)
        except Exception:
            return None
    status_code = response.status_code
    if status_code >= 400:
        return None
    html = response.text or ""
    soup = BeautifulSoup(html, "lxml")
    title = soup.title.get_text(strip=True) if soup.title else None
    h1_tag = soup.find("h1")
    h1 = h1_tag.get_text(strip=True) if h1_tag else None
    meta_desc_tag = soup.find("meta", attrs={"name": re.compile("^description$", re.I)})
    meta_description = meta_desc_tag.get("content", "").strip() if meta_desc_tag else None
    headings = [h.get_text(" ", strip=True) for h in soup.select("h1,h2,h3,h4")]
    links = [a.get("href", "") for a in soup.select("a[href]")]
    images = len(soup.select("img"))
    tables = len(soup.select("table"))
    lists = len(soup.select("ul,ol"))
    faq_count = len(re.findall(r"\?", soup.get_text(" ", strip=True)))
    schema_types: list[str] = []
    for script in soup.select("script[type='application/ld+json']"):
        raw = script.get_text(strip=True)
        if not raw:
            continue
        try:
            payload = json.loads(raw)
        except Exception:
            continue
        nodes = payload if isinstance(payload, list) else [payload]
        for node in nodes:
            if isinstance(node, dict) and "@type" in node:
                node_type = node["@type"]
                if isinstance(node_type, str):
                    schema_types.append(node_type)
                elif isinstance(node_type, list):
                    schema_types.extend([str(x) for x in node_type])

    text = soup.get_text(" ", strip=True)
    content_hash = hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()
    canonical = None
    canonical_tag = soup.find("link", attrs={"rel": re.compile("canonical", re.I)})
    if canonical_tag and canonical_tag.get("href"):
        canonical = canonical_tag.get("href")
    return CrawledDocument(
        url=url,
        canonical_url=canonical,
        status_code=status_code,
        title=title,
        h1=h1,
        meta_description=meta_description,
        headings=headings[:80],
        text=text[:100000],
        links=links[:400],
        images=images,
        tables=tables,
        lists=lists,
        faq_count=faq_count,
        schema_types=list(dict.fromkeys(schema_types))[:40],
        content_hash=content_hash,
    )
