"""
Site Context Builder - Layer 1 of the prompt generation pipeline.

Extracts structured site intelligence from crawled pages to understand:
- Brand identity
- Products/services
- Industries
- Audiences
- Use cases
- Pain points
- Features/claims
- Competitors
- Core and supporting topics
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.services.crawler import CrawledDocument


@dataclass
class SiteContext:
    """Structured site intelligence profile derived from crawled content."""
    
    brand_name: str
    domain: str
    canonical_brand_name: str | None = None
    discovered_brand_name: str | None = None
    brand_aliases: list[str] = field(default_factory=list)
    industries: list[str] = field(default_factory=list)
    subindustries: list[str] = field(default_factory=list)
    products: list[str] = field(default_factory=list)
    services: list[str] = field(default_factory=list)
    categories: list[str] = field(default_factory=list)
    subcategories: list[str] = field(default_factory=list)
    features: list[str] = field(default_factory=list)
    benefits: list[str] = field(default_factory=list)
    pain_points: list[str] = field(default_factory=list)
    customer_types: list[str] = field(default_factory=list)
    use_cases: list[str] = field(default_factory=list)
    locations: list[str] = field(default_factory=list)
    competitors: list[str] = field(default_factory=list)
    entities: list[str] = field(default_factory=list)
    faq_questions: list[str] = field(default_factory=list)
    claims: list[str] = field(default_factory=list)
    core_topics: list[str] = field(default_factory=list)
    supporting_topics: list[str] = field(default_factory=list)
    keywords: list[str] = field(default_factory=list)
    schema_entities: list[str] = field(default_factory=list)
    content_types: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "brand_name": self.brand_name,
            "domain": self.domain,
            "canonical_brand_name": self.canonical_brand_name,
            "discovered_brand_name": self.discovered_brand_name,
            "brand_aliases": self.brand_aliases,
            "industries": self.industries,
            "subindustries": self.subindustries,
            "products": self.products,
            "services": self.services,
            "categories": self.categories,
            "subcategories": self.subcategories,
            "features": self.features,
            "benefits": self.benefits,
            "pain_points": self.pain_points,
            "customer_types": self.customer_types,
            "use_cases": self.use_cases,
            "locations": self.locations,
            "competitors": self.competitors,
            "entities": self.entities,
            "faq_questions": self.faq_questions,
            "claims": self.claims,
            "core_topics": self.core_topics,
            "supporting_topics": self.supporting_topics,
            "keywords": self.keywords,
            "schema_entities": self.schema_entities,
            "content_types": self.content_types,
        }


def _normalize(text: str) -> str:
    """Normalize text for deduplication."""
    return " ".join(text.lower().strip().split())


def _normalize_domain(domain: str) -> str:
    value = domain.strip().lower()
    value = re.sub(r"^https?://", "", value)
    value = value.split("/")[0].strip(".")
    value = re.sub(r"^www\.", "", value)
    return value


def _domain_label(domain: str) -> str:
    host = _normalize_domain(domain)
    return host.split(".")[0] if host else ""


def _looks_noisy_brand(candidate: str, canonical_brand: str, domain: str) -> bool:
    normalized = _normalize(candidate)
    if not normalized:
        return True
    if normalized == _normalize(canonical_brand):
        return False
    if len(normalized) < 3 or len(normalized) > 50:
        return True
    noisy_terms = {
        "reviews",
        "review",
        "best",
        "top",
        "near me",
        "guide",
        "trip",
        "trips",
        "video",
        "videos",
    }
    if any(term in normalized for term in noisy_terms):
        return True
    if "?" in candidate:
        return True
    domain_token = _normalize(_domain_label(domain))
    if domain_token and domain_token in normalized and len(normalized.split()) >= 3:
        return True
    return False


def _resolve_brand_identity(
    canonical_brand: str,
    domain: str,
    discovered_brand: str | None,
) -> tuple[str, str | None, list[str]]:
    canonical = canonical_brand.strip()
    discovered = (discovered_brand or "").strip()
    if _looks_noisy_brand(discovered, canonical, domain):
        discovered = ""
    aliases = [canonical]
    normalized_domain = _normalize_domain(domain)
    domain_token = _domain_label(domain)
    if normalized_domain:
        aliases.append(normalized_domain)
    if domain_token:
        aliases.append(domain_token)
    if discovered and _normalize(discovered) != _normalize(canonical):
        aliases.append(discovered)
    return canonical, (discovered or None), _dedupe_list(aliases)


def _dedupe_list(items: list[str]) -> list[str]:
    """Remove duplicates while preserving order."""
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        key = _normalize(item)
        if key and key not in seen and len(key) > 2:
            seen.add(key)
            result.append(item.strip())
    return result


def _extract_from_headings(headings: list[str]) -> dict[str, list[str]]:
    """Extract structured information from page headings."""
    products: list[str] = []
    services: list[str] = []
    features: list[str] = []
    topics: list[str] = []
    
    product_patterns = [
        r"(?i)\b(product|item|model|edition|version|package)\b",
        r"(?i)\b(buy|purchase|order|shop)\b",
    ]
    service_patterns = [
        r"(?i)\b(service|solution|consulting|support|assistance)\b",
        r"(?i)\b(hire|book|schedule|contact)\b",
    ]
    feature_patterns = [
        r"(?i)\b(feature|benefit|advantage|capability|function)\b",
        r"(?i)\b(why|how it works|what we offer)\b",
    ]
    
    for heading in headings:
        clean = heading.strip()
        if not clean or len(clean) < 3:
            continue
            
        is_product = any(re.search(p, clean) for p in product_patterns)
        is_service = any(re.search(p, clean) for p in service_patterns)
        is_feature = any(re.search(p, clean) for p in feature_patterns)
        
        if is_product:
            products.append(clean)
        elif is_service:
            services.append(clean)
        elif is_feature:
            features.append(clean)
        else:
            topics.append(clean)
    
    return {
        "products": products,
        "services": services,
        "features": features,
        "topics": topics,
    }


def _extract_faq_questions(text: str, headings: list[str]) -> list[str]:
    """Extract FAQ-style questions from content."""
    questions: list[str] = []
    
    question_pattern = r"([A-Z][^.!?]*\?)"
    for match in re.findall(question_pattern, text[:50000]):
        if 10 < len(match) < 200:
            questions.append(match.strip())
    
    for heading in headings:
        if "?" in heading:
            questions.append(heading.strip())
    
    return _dedupe_list(questions)[:50]


def _extract_pain_points(text: str) -> list[str]:
    """Extract pain points from content."""
    pain_points: list[str] = []
    
    pain_patterns = [
        r"(?i)struggling with ([^.!?]+)",
        r"(?i)tired of ([^.!?]+)",
        r"(?i)frustrated by ([^.!?]+)",
        r"(?i)problem(?:s)? (?:with|of) ([^.!?]+)",
        r"(?i)challenge(?:s)? (?:with|of|in) ([^.!?]+)",
        r"(?i)difficulty (?:with|in) ([^.!?]+)",
        r"(?i)pain point(?:s)? ([^.!?]+)",
        r"(?i)(?:we|you) solve ([^.!?]+)",
        r"(?i)eliminate ([^.!?]+)",
        r"(?i)stop ([^.!?]+)",
    ]
    
    for pattern in pain_patterns:
        for match in re.findall(pattern, text[:30000]):
            if 5 < len(match) < 100:
                pain_points.append(match.strip())
    
    return _dedupe_list(pain_points)[:20]


def _extract_use_cases(text: str, headings: list[str]) -> list[str]:
    """Extract use cases from content."""
    use_cases: list[str] = []
    
    use_case_patterns = [
        r"(?i)(?:use case|used for|ideal for|perfect for|great for|best for) ([^.!?]+)",
        r"(?i)(?:when you need|if you need|for those who) ([^.!?]+)",
        r"(?i)(?:designed for|built for|made for) ([^.!?]+)",
    ]
    
    for pattern in use_case_patterns:
        for match in re.findall(pattern, text[:30000]):
            if 5 < len(match) < 100:
                use_cases.append(match.strip())
    
    for heading in headings:
        if re.search(r"(?i)(use case|application|scenario|example)", heading):
            use_cases.append(heading.strip())
    
    return _dedupe_list(use_cases)[:20]


def _extract_customer_types(text: str) -> list[str]:
    """Extract customer/audience types from content."""
    customer_types: list[str] = []
    
    audience_patterns = [
        r"(?i)(?:for|designed for|built for|ideal for) ((?:small |large |enterprise |)?(?:business(?:es)?|companies|teams|organizations|agencies|startups|professionals|individuals|experts|beginners))",
        r"(?i)((?:small |large |enterprise |)?(?:business(?:es)?|companies|teams|organizations|agencies|startups|professionals|individuals|experts|beginners)) (?:can|will|should|love|trust|use|rely)",
    ]
    
    for pattern in audience_patterns:
        for match in re.findall(pattern, text[:30000]):
            if isinstance(match, tuple):
                match = match[0]
            if 3 < len(match) < 50:
                customer_types.append(match.strip())
    
    generic_audiences = [
        "small business", "enterprise", "startups", "agencies",
        "marketers", "developers", "designers", "managers",
        "teams", "professionals", "beginners", "experts",
    ]
    
    text_lower = text.lower()
    for audience in generic_audiences:
        if audience in text_lower:
            customer_types.append(audience)
    
    return _dedupe_list(customer_types)[:15]


def _extract_competitors(text: str, headings: list[str]) -> list[str]:
    """Extract competitor mentions from content."""
    competitors: list[str] = []
    
    competitor_patterns = [
        r"(?i)(?:vs|versus|compared to|alternative to|better than|unlike) ([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)?)",
        r"(?i)(?:competitor|competition|rival)(?:s)? (?:like|such as|including) ([^.!?]+)",
    ]
    
    for pattern in competitor_patterns:
        for match in re.findall(pattern, text[:30000]):
            if isinstance(match, str) and 2 < len(match) < 50:
                competitors.append(match.strip())
    
    for heading in headings:
        if re.search(r"(?i)(vs|versus|alternative|comparison|compare)", heading):
            parts = re.split(r"(?i)\s+(?:vs|versus|or)\s+", heading)
            for part in parts:
                clean = part.strip()
                if 2 < len(clean) < 50:
                    competitors.append(clean)
    
    return _dedupe_list(competitors)[:15]


def _extract_features_claims(text: str, headings: list[str]) -> tuple[list[str], list[str]]:
    """Extract features and claims from content."""
    features: list[str] = []
    claims: list[str] = []
    
    feature_patterns = [
        r"(?i)(?:feature|capability|function|tool)(?:s)?:?\s*([^.!?]+)",
        r"(?i)(?:includes?|offers?|provides?|supports?)\s+([^.!?]+)",
    ]
    
    claim_patterns = [
        r"(?i)(?:#1|number one|best|leading|top|fastest|most|only)\s+([^.!?]+)",
        r"(?i)(?:trusted by|used by|loved by)\s+([^.!?]+)",
        r"(?i)(\d+(?:,\d+)?(?:\+)?\s+(?:customers|users|clients|companies|businesses))",
    ]
    
    for pattern in feature_patterns:
        for match in re.findall(pattern, text[:30000]):
            if 5 < len(match) < 100:
                features.append(match.strip())
    
    for pattern in claim_patterns:
        for match in re.findall(pattern, text[:30000]):
            if 5 < len(match) < 100:
                claims.append(match.strip())
    
    return _dedupe_list(features)[:20], _dedupe_list(claims)[:15]


def _extract_locations(text: str) -> list[str]:
    """Extract location mentions from content."""
    locations: list[str] = []
    
    location_patterns = [
        r"(?i)(?:in|near|serving|located in|based in)\s+([A-Z][a-zA-Z]+(?:,?\s+[A-Z][a-zA-Z]+)?)",
        r"(?i)([A-Z][a-zA-Z]+(?:,?\s+[A-Z]{2}))\s+(?:area|region|location)",
    ]
    
    for pattern in location_patterns:
        for match in re.findall(pattern, text[:20000]):
            if isinstance(match, str) and 2 < len(match) < 50:
                locations.append(match.strip())
    
    return _dedupe_list(locations)[:10]


def _classify_page_type(url: str, title: str | None, headings: list[str]) -> str:
    """Classify page type based on URL and content."""
    url_lower = url.lower()
    title_lower = (title or "").lower()
    heading_text = " ".join(headings).lower()
    
    if url_lower.endswith("/") or url_lower.count("/") <= 3:
        if not any(x in url_lower for x in ["/blog", "/product", "/service", "/about", "/contact"]):
            return "homepage"
    
    if "/blog" in url_lower or "/news" in url_lower or "/article" in url_lower:
        return "blog"
    if "/product" in url_lower or "/shop" in url_lower or "/store" in url_lower:
        return "product"
    if "/service" in url_lower or "/solution" in url_lower:
        return "service"
    if "/pricing" in url_lower or "/plans" in url_lower:
        return "pricing"
    if "/faq" in url_lower or "frequently asked" in title_lower:
        return "faq"
    if "/about" in url_lower or "/team" in url_lower:
        return "about"
    if "/contact" in url_lower:
        return "contact"
    if "/doc" in url_lower or "/help" in url_lower or "/guide" in url_lower:
        return "docs"
    if "vs" in url_lower or "compare" in url_lower or "alternative" in url_lower:
        return "comparison"
    if "/category" in url_lower or "/collection" in url_lower:
        return "category"
    
    return "other"


def _extract_keywords_from_text(text: str, headings: list[str]) -> list[str]:
    """Extract important keywords/phrases from text."""
    keywords: list[str] = []
    
    combined = " ".join(headings) + " " + text[:20000]
    
    phrase_pattern = r"\b([A-Z][a-z]+(?:\s+[A-Za-z]+){0,3})\b"
    for match in re.findall(phrase_pattern, combined):
        if 4 < len(match) < 40:
            keywords.append(match)
    
    word_freq: dict[str, int] = {}
    words = re.findall(r"\b[a-z]{4,}\b", combined.lower())
    stopwords = {
        "that", "this", "with", "from", "have", "been", "were", "will",
        "your", "they", "their", "what", "when", "where", "which", "about",
        "more", "some", "other", "into", "also", "just", "only", "very",
    }
    for word in words:
        if word not in stopwords:
            word_freq[word] = word_freq.get(word, 0) + 1
    
    sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
    for word, _ in sorted_words[:30]:
        keywords.append(word)
    
    return _dedupe_list(keywords)[:40]


def build_site_context(
    brand_name: str,
    domain: str,
    documents: list["CrawledDocument"],
    known_competitors: list[str] | None = None,
) -> SiteContext:
    """
    Build a comprehensive site context from crawled documents.
    
    This is Layer 1 of the prompt generation pipeline.
    """
    all_headings: list[str] = []
    all_text: str = ""
    schema_types: list[str] = []
    content_types: list[str] = []
    
    for doc in documents:
        all_headings.extend(doc.headings)
        all_text += " " + doc.text
        schema_types.extend(doc.schema_types)
        page_type = _classify_page_type(doc.url, doc.title, doc.headings)
        content_types.append(page_type)
    
    heading_extracts = _extract_from_headings(all_headings)
    faq_questions = _extract_faq_questions(all_text, all_headings)
    pain_points = _extract_pain_points(all_text)
    use_cases = _extract_use_cases(all_text, all_headings)
    customer_types = _extract_customer_types(all_text)
    competitors = _extract_competitors(all_text, all_headings)
    features, claims = _extract_features_claims(all_text, all_headings)
    locations = _extract_locations(all_text)
    keywords = _extract_keywords_from_text(all_text, all_headings)
    
    if known_competitors:
        competitors = _dedupe_list(known_competitors + competitors)
    
    core_topics = heading_extracts["topics"][:15]
    supporting_topics = heading_extracts["topics"][15:35]
    
    industries: list[str] = []
    industry_keywords = [
        "software", "technology", "marketing", "finance", "healthcare",
        "education", "retail", "manufacturing", "consulting", "legal",
        "real estate", "hospitality", "automotive", "construction",
    ]
    text_lower = all_text.lower()
    for industry in industry_keywords:
        if industry in text_lower:
            industries.append(industry)
    
    canonical_brand, discovered_brand, brand_aliases = _resolve_brand_identity(
        canonical_brand=brand_name,
        domain=domain,
        discovered_brand=None,
    )

    return SiteContext(
        brand_name=canonical_brand,
        domain=domain,
        canonical_brand_name=canonical_brand,
        discovered_brand_name=discovered_brand,
        brand_aliases=brand_aliases,
        industries=_dedupe_list(industries)[:5],
        subindustries=[],
        products=_dedupe_list(heading_extracts["products"])[:20],
        services=_dedupe_list(heading_extracts["services"])[:20],
        categories=[],
        subcategories=[],
        features=_dedupe_list(features + heading_extracts["features"])[:25],
        benefits=[],
        pain_points=pain_points,
        customer_types=customer_types,
        use_cases=use_cases,
        locations=locations,
        competitors=competitors,
        entities=[],
        faq_questions=faq_questions,
        claims=claims,
        core_topics=_dedupe_list(core_topics),
        supporting_topics=_dedupe_list(supporting_topics),
        keywords=keywords,
        schema_entities=_dedupe_list(schema_types)[:20],
        content_types=_dedupe_list(content_types),
    )


async def build_site_context_with_claude(
    brand_name: str,
    domain: str,
    documents: list["CrawledDocument"],
    known_competitors: list[str] | None = None,
) -> SiteContext:
    """
    Build site context using Claude AI to analyze all crawled content.
    
    Claude parses the entire website and recognizes:
    - Industry (fishing, software, retail, etc.)
    - Products and services offered
    - Target audiences
    - Pain points solved
    - Use cases
    - Features and benefits
    - Competitors
    - Core and supporting topics
    
    Falls back to regex-based extraction if Claude fails.
    
    Args:
        brand_name: The brand name from the project
        domain: The website domain
        documents: List of crawled documents
        known_competitors: Optional list of known competitors
        
    Returns:
        SiteContext populated with Claude's analysis
    """
    import logging
    from .claude_site_analyzer import analyze_site_with_claude
    
    logger = logging.getLogger(__name__)
    
    try:
        # Let Claude analyze the entire website
        claude_analysis = await analyze_site_with_claude(
            documents=documents,
            brand_name=brand_name,
            domain=domain,
        )
        
        # Extract product/service names from Claude's structured response
        product_names = [p.get("name", "") for p in claude_analysis.products if p.get("name")]
        service_names = [s.get("name", "") for s in claude_analysis.services if s.get("name")]
        
        # Merge known competitors with Claude's discovered competitors
        all_competitors = _dedupe_list(
            (known_competitors or []) + claude_analysis.competitors
        )
        
        # Build industries list from Claude's analysis
        industries = [claude_analysis.primary_industry] if claude_analysis.primary_industry else []
        industries.extend(claude_analysis.subindustries)
        canonical_brand, discovered_brand, brand_aliases = _resolve_brand_identity(
            canonical_brand=brand_name,
            domain=domain,
            discovered_brand=claude_analysis.brand_name,
        )
        
        logger.info(
            f"Claude site analysis complete for {domain}: "
            f"{len(claude_analysis.core_topics)} core topics, "
            f"{len(product_names)} products, "
            f"{len(service_names)} services"
        )
        
        # Map Claude's analysis to SiteContext
        return SiteContext(
            brand_name=canonical_brand,
            domain=domain,
            canonical_brand_name=canonical_brand,
            discovered_brand_name=discovered_brand,
            brand_aliases=brand_aliases,
            industries=_dedupe_list(industries)[:10],
            subindustries=claude_analysis.subindustries[:10],
            products=_dedupe_list(product_names)[:25],
            services=_dedupe_list(service_names)[:25],
            categories=[],
            subcategories=[],
            features=_dedupe_list(claude_analysis.features)[:30],
            benefits=[],
            pain_points=_dedupe_list(claude_analysis.pain_points)[:20],
            customer_types=_dedupe_list(claude_analysis.audiences)[:15],
            use_cases=_dedupe_list(claude_analysis.use_cases)[:20],
            locations=_dedupe_list(claude_analysis.locations)[:15],
            competitors=all_competitors[:20],
            entities=_dedupe_list([discovered_brand] if discovered_brand else []),
            faq_questions=_dedupe_list(claude_analysis.faq_questions)[:30],
            claims=_dedupe_list(claude_analysis.claims)[:20],
            core_topics=_dedupe_list(claude_analysis.core_topics)[:25],
            supporting_topics=_dedupe_list(claude_analysis.supporting_topics)[:30],
            keywords=[],  # Claude doesn't extract raw keywords
            schema_entities=[],
            content_types=[],
        )
        
    except Exception as e:
        # Fall back to regex-based extraction if Claude fails
        logger.warning(f"Claude analysis failed for {domain}, falling back to regex: {e}")
        return build_site_context(brand_name, domain, documents, known_competitors)
