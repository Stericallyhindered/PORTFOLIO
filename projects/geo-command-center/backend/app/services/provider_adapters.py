from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
import hashlib
import logging
import re
from typing import Protocol

import httpx

from app.core.config import settings


@dataclass
class EngineResult:
    engine_name: str
    raw_text: str
    citations: list[dict]
    mentions: list[dict]
    metadata: dict


@dataclass
class EngineHealthResult:
    engine_name: str
    configured: bool
    provider: str
    live_verified: bool
    error_code: str | None = None
    error_message: str | None = None
    checked_at: str | None = None


class ProviderIntegrationError(Exception):
    def __init__(
        self,
        *,
        provider: str,
        code: str,
        message: str,
        status_code: int | None = None,
        model: str | None = None,
    ):
        self.provider = provider
        self.code = code
        self.message = message
        self.status_code = status_code
        self.model = model
        super().__init__(message)

    def to_dict(self) -> dict:
        return {
            "provider": self.provider,
            "code": self.code,
            "message": self.message,
            "statusCode": self.status_code,
            "model": self.model,
        }


class LLMEngineAdapter(Protocol):
    async def run_prompt(self, prompt: str, context: dict) -> EngineResult: ...
    async def healthcheck(self) -> EngineHealthResult: ...


SUPPORTED_ENGINES = ["chatgpt", "google-ai-overviews", "perplexity", "gemini", "claude"]
PERPLEXITY_MODEL = "sonar-pro"
PERPLEXITY_SYSTEM_PROMPT = (
    "You are a GEO research assistant. Provide factual, concise answers with verifiable source URLs."
)
PERPLEXITY_REQUEST_PARAMS = {
    "temperature": 0.2,
    "top_p": 0.9,
    "max_tokens": 900,
}
OPENAI_MODELS_TO_TRY = [
    "gpt-5.4",
    "gpt-5.4-mini",
    "gpt-4.1-mini",
]
ANTHROPIC_MODELS_TO_TRY = [
    "claude-sonnet-4-6",
    "claude-sonnet-4-6-latest",
    "claude-sonnet-4-20250514",
    "claude-3-7-sonnet-latest",
    "claude-3-5-sonnet-latest",
    "claude-3-5-haiku-latest",
]
GEMINI_MODELS_TO_TRY = [
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview",
    "gemini-flash-latest",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
]


def _sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


logger = logging.getLogger(__name__)


def _raise_http_error(provider: str, response: httpx.Response, model: str | None = None) -> None:
    payload_text = response.text or ""
    lowered = payload_text.lower()
    status_code = response.status_code
    if status_code in {401, 403}:
        raise ProviderIntegrationError(
            provider=provider,
            code="unauthorized",
            message=f"{provider} unauthorized (HTTP {status_code}).",
            status_code=status_code,
            model=model,
        )
    if status_code == 404:
        code = "model_not_found" if "model" in lowered else "endpoint_not_found"
        raise ProviderIntegrationError(
            provider=provider,
            code=code,
            message=f"{provider} returned HTTP 404.",
            status_code=status_code,
            model=model,
        )
    if status_code == 429:
        code = "quota_exhausted" if "quota" in lowered or "insufficient" in lowered else "rate_limited"
        raise ProviderIntegrationError(
            provider=provider,
            code=code,
            message=f"{provider} rate limited/quota exhausted (HTTP 429).",
            status_code=status_code,
            model=model,
        )
    raise ProviderIntegrationError(
        provider=provider,
        code="provider_request_failed",
        message=f"{provider} request failed (HTTP {status_code}).",
        status_code=status_code,
        model=model,
    )


def _wrap_request_exception(provider: str, exc: Exception) -> ProviderIntegrationError:
    text = str(exc).lower()
    if "timed out" in text or "timeout" in text:
        return ProviderIntegrationError(
            provider=provider,
            code="timeout",
            message=f"{provider} request timed out.",
        )
    if "connect" in text or "dns" in text or "name resolution" in text:
        return ProviderIntegrationError(
            provider=provider,
            code="network_error",
            message=f"{provider} network/connectivity error.",
        )
    return ProviderIntegrationError(
        provider=provider,
        code="provider_request_failed",
        message=f"{provider} request failed: {exc}",
    )


def _normalize_domain(value: str | None) -> str:
    domain = (value or "").strip().lower()
    domain = re.sub(r"^https?://", "", domain)
    domain = domain.split("/")[0]
    domain = re.sub(r"^www\.", "", domain)
    return domain


def _domain_to_label(value: str | None) -> str:
    domain = _normalize_domain(value)
    return domain.split(".")[0] if domain else ""


def _build_openai_web_search_tools() -> list[dict]:
    return [{"type": "web_search"}]


def _build_anthropic_web_search_tools(context: dict) -> list[dict]:
    primary_domain = _normalize_domain(str(context.get("primary_domain", "")).strip())
    tool: dict = {"type": "web_search_20250305", "name": "web_search"}
    if primary_domain:
        tool["allowed_domains"] = [primary_domain]
    return [tool]


def _build_gemini_web_search_tools() -> list[dict]:
    return [{"google_search": {}}]


def _build_strict_grounding_envelope(prompt: str, context: dict) -> tuple[str, dict]:
    brand_name = str(context.get("brand_name", "")).strip()
    primary_domain = _normalize_domain(str(context.get("primary_domain", "")).strip())
    brand_aliases = [str(alias).strip() for alias in (context.get("brand_aliases") or []) if str(alias).strip()]
    services = [str(s).strip() for s in (context.get("services") or []) if str(s).strip()]
    locations = [str(l).strip() for l in (context.get("locations") or []) if str(l).strip()]
    industry = str(context.get("industry", "")).strip()
    core_topics = [str(t).strip() for t in (context.get("core_topics") or []) if str(t).strip()]
    claims = [str(c).strip() for c in (context.get("claims") or []) if str(c).strip()]
    required_identity = [brand_name, primary_domain, _domain_to_label(primary_domain), *brand_aliases]
    required_identity = [v for v in required_identity if v]
    # Keep deterministic ordering while deduping.
    seen: set[str] = set()
    required_identity = [v for v in required_identity if not (v.lower() in seen or seen.add(v.lower()))]

    context_block = "\n".join(
        [
            "STRICT DOMAIN GROUNDING CONTEXT:",
            f"- Canonical brand: {brand_name or 'unknown'}",
            f"- Primary domain: {primary_domain or 'unknown'}",
            f"- Brand aliases: {', '.join(required_identity) if required_identity else 'none'}",
            f"- Services: {', '.join(services[:8]) if services else 'unknown'}",
            f"- Locations: {', '.join(locations[:6]) if locations else 'unknown'}",
            f"- Industry: {industry or 'unknown'}",
            f"- Core topics: {', '.join(core_topics[:8]) if core_topics else 'unknown'}",
            f"- Notable claims/schema hints: {', '.join(claims[:6]) if claims else 'unknown'}",
            "",
            "HARD RULES:",
            "1) Answer directly and concisely; do not ask clarifying follow-up questions.",
            "2) Prioritize evidence tied to the primary domain and known brand aliases.",
            "3) Search and reason using domain-specific pages/content patterns for the primary domain first.",
            "4) Use site facts/schema hints when available before broad web assumptions.",
            "5) If evidence is weak, give best-effort grounded answer plus explicit uncertainty in one short line.",
            "6) Include source URLs when available.",
            "",
            f"USER QUERY: {prompt}",
        ]
    )
    meta = {
        "brandName": brand_name,
        "primaryDomain": primary_domain,
        "brandAliases": required_identity,
        "services": services[:8],
        "locations": locations[:6],
        "industry": industry or None,
        "coreTopics": core_topics[:8],
        "claims": claims[:6],
    }
    return context_block, meta


def _extract_json_object(text: str) -> dict | None:
    if not text:
        return None
    start = text.find("{")
    end = text.rfind("}")
    if start < 0 or end < start:
        return None
    try:
        import json

        parsed = json.loads(text[start : end + 1])
        return parsed if isinstance(parsed, dict) else None
    except Exception:
        return None


def _looks_weak_response(text: str) -> tuple[bool, str]:
    lower = (text or "").lower()
    if not lower.strip():
        return True, "empty_response"
    weak_markers = [
        "i don't have specific information",
        "i don't have access to real-time",
        "could you give me more context",
        "could you clarify",
        "this could be",
        "if you can provide more context",
    ]
    for marker in weak_markers:
        if marker in lower:
            return True, "weak_disclaimer"
    if "?" in text and any(x in lower for x in ["could you", "are you", "if you can"]):
        return True, "asks_followup_questions"
    return False, "ok"


def _deterministic_fallback_response(context: dict) -> str:
    brand_name = str(context.get("brand_name", "")).strip() or "the target brand"
    primary_domain = _normalize_domain(str(context.get("primary_domain", "")).strip()) or "the provided domain"
    return (
        f"{brand_name} is grounded to {primary_domain}. Available evidence is limited in this run, "
        "so this result is a best-effort concise summary without clarifying questions."
    )


async def _claude_transform_json(task: str, content: str, max_tokens: int = 500) -> dict | None:
    if not settings.ANTHROPIC_API_KEY:
        return None
    instruction = (
        f"You are a strict JSON transformer for task: {task}.\n"
        "Return ONLY JSON object with no markdown or extra text."
    )
    async with httpx.AsyncClient(timeout=40.0) as client:
        for model_name in ANTHROPIC_MODELS_TO_TRY:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                },
                json={
                    "model": model_name,
                    "max_tokens": max_tokens,
                    "tools": [{"type": "web_search_20250305", "name": "web_search"}],
                    "messages": [{"role": "user", "content": f"{instruction}\n\n{content}"}],
                },
            )
            if response.status_code == 404 or (
                response.status_code == 400 and "model" in (response.text or "").lower()
            ):
                continue
            if response.status_code >= 400:
                continue
            payload = response.json()
            items = payload.get("content", [])
            text = items[0].get("text", "") if items and isinstance(items, list) else ""
            parsed = _extract_json_object(text)
            if parsed is not None:
                return parsed
    return None


async def _claude_preprocess_prompt(prompt: str, context: dict) -> tuple[str, dict]:
    grounded_prompt, grounding_meta = _build_strict_grounding_envelope(prompt, context)
    transform_payload = (
        "Create a strict domain-grounded prompt package.\n"
        "Required JSON keys: optimized_prompt (string), intent (string), required_facts (string[]).\n"
        "optimized_prompt must preserve user intent and include primary domain explicitly.\n\n"
        f"{grounded_prompt}"
    )
    transformed = await _claude_transform_json("preprocess_prompt", transform_payload, max_tokens=600)
    if transformed and isinstance(transformed.get("optimized_prompt"), str):
        optimized = transformed["optimized_prompt"].strip()
        preprocess_meta = {
            "source": "claude",
            "optimizedPrompt": optimized,
            "intent": transformed.get("intent"),
            "requiredFacts": transformed.get("required_facts") if isinstance(transformed.get("required_facts"), list) else [],
            "grounding": grounding_meta,
            "preprocessPromptHash": _sha256_hex(optimized),
        }
        return optimized, preprocess_meta
    # Deterministic fallback when Claude preprocessing unavailable.
    fallback = grounded_prompt
    return fallback, {
        "source": "deterministic_fallback",
        "optimizedPrompt": fallback,
        "intent": "unknown",
        "requiredFacts": [],
        "grounding": grounding_meta,
        "preprocessPromptHash": _sha256_hex(fallback),
    }


async def _claude_repair_response(
    engine_name: str,
    original_text: str,
    prompt: str,
    context: dict,
) -> tuple[str, dict]:
    is_weak, reason = _looks_weak_response(original_text)
    if not is_weak:
        return original_text, {"repaired": False, "reason": "ok"}

    grounded_prompt, grounding_meta = _build_strict_grounding_envelope(prompt, context)
    repair_payload = (
        "Repair the assistant response.\n"
        "Required JSON keys: repaired_text (string), confidence_note (string).\n"
        "Rules: concise, direct answer, no clarifying questions, domain-grounded.\n"
        "When the original says there is not enough info, synthesize using provided domain context and site/schema hints.\n"
        "Answer the ORIGINAL user intent directly.\n\n"
        f"Engine: {engine_name}\n"
        f"Original response:\n{original_text}\n\n"
        f"Grounding context:\n{grounded_prompt}"
    )
    transformed = await _claude_transform_json("repair_response", repair_payload, max_tokens=700)
    if transformed and isinstance(transformed.get("repaired_text"), str):
        repaired_text = transformed["repaired_text"].strip()
        if repaired_text:
            return repaired_text, {
                "repaired": True,
                "reason": reason,
                "confidenceNote": transformed.get("confidence_note"),
                "repairPromptHash": _sha256_hex(repair_payload),
                "grounding": grounding_meta,
            }
    return _deterministic_fallback_response(context), {
        "repaired": True,
        "reason": f"{reason}_fallback",
        "confidenceNote": "limited_evidence",
        "grounding": grounding_meta,
    }


def _extract_citations(
    text: str,
    brand_name: str | None,
    primary_domain: str | None,
    brand_aliases: list[str] | None = None,
) -> list[dict]:
    urls = re.findall(r"https?://[^\s)>\"]+", text or "")
    citations: list[dict] = []
    brand_lower = (brand_name or "").lower()
    alias_lowers = [str(alias).strip().lower() for alias in (brand_aliases or []) if str(alias).strip()]
    primary_domain = (primary_domain or "").lower()
    for idx, url in enumerate(urls, start=1):
        domain_match = re.search(r"https?://([^/\s]+)", url)
        domain = domain_match.group(1).lower() if domain_match else None
        mention_type = "neutral"
        if domain and primary_domain and primary_domain in domain:
            mention_type = "brand"
        elif brand_lower and brand_lower in (text or "").lower():
            mention_type = "brand"
        elif any(alias in (text or "").lower() for alias in alias_lowers):
            mention_type = "brand"
        citations.append(
            {
                "cited_domain": domain,
                "cited_url": url,
                "confidence": 0.9,
                "mention_type": mention_type,
                "citation_order": idx,
            }
        )
    return citations


def _extract_mentions(text: str, context: dict) -> list[dict]:
    """
    Extract brand and competitor mentions from AI response text.
    
    Checks for:
    - Brand name (from project)
    - Primary domain (e.g., azchristmaslights.com)
    - Common brand name patterns extracted from the domain
    - Competitors
    """
    mentions: list[dict] = []
    brand_name = str(context.get("brand_name", "")).strip()
    primary_domain = str(context.get("primary_domain", "")).strip().lower()
    lower_text = (text or "").lower()
    brand_aliases = [str(alias).strip() for alias in (context.get("brand_aliases") or []) if str(alias).strip()]
    
    # Build list of brand name variations to check
    brand_variations = []
    if brand_name and len(brand_name) > 2:
        brand_variations.append(brand_name.lower())
    for alias in brand_aliases:
        alias_lower = alias.lower()
        if alias_lower and alias_lower not in brand_variations:
            brand_variations.append(alias_lower)
    
    # Extract potential brand name from domain (e.g., azchristmaslights -> "az christmas lights")
    if primary_domain:
        # Remove common TLDs and www
        domain_name = primary_domain.replace("www.", "").split(".")[0]
        brand_variations.append(domain_name)
        
        # Try to extract readable name (e.g., "azchristmaslights" -> "christmas lights")
        # Common patterns: remove location prefixes, split camelCase
        # Split on common word boundaries
        words = re.findall(r'[a-z]+', domain_name)
        if words:
            # Join words that might be a brand name
            readable = " ".join(words)
            if len(readable) > 3:
                brand_variations.append(readable)
    
    # Check for brand mentions
    brand_found = False
    for variation in brand_variations:
        if variation and variation in lower_text:
            brand_found = True
            # Find position in text (earlier = better)
            position = lower_text.find(variation)
            total_len = len(lower_text)
            position_score = 1.0 - (position / total_len) if total_len > 0 else 0.5
            
            # Extract context snippet around the mention
            start = max(0, position - 50)
            end = min(len(text), position + len(variation) + 200)
            snippet = text[start:end]
            
            mentions.append(
                {
                    "entity_name": variation.title() if len(variation) > 10 else brand_name or variation,
                    "entity_type": "brand",
                    "sentiment": "positive",
                    "position_score": round(position_score, 2),
                    "context_snippet": snippet,
                }
            )
            break  # Only add one brand mention per response
    
    # Also check for "We Hang Christmas Lights" pattern specifically (common brand format)
    if not brand_found:
        # Look for patterns like "Company Name LLC", "Brand Name Inc", etc.
        company_patterns = [
            r"we hang [a-z]+ lights",
            r"[a-z]+ christmas lights? llc",
            r"[a-z]+ lighting (company|service|installation)",
        ]
        for pattern in company_patterns:
            match = re.search(pattern, lower_text)
            if match:
                matched_text = match.group(0)
                position = match.start()
                total_len = len(lower_text)
                position_score = 1.0 - (position / total_len) if total_len > 0 else 0.5
                
                mentions.append(
                    {
                        "entity_name": matched_text.title(),
                        "entity_type": "brand",
                        "sentiment": "positive",
                        "position_score": round(position_score, 2),
                        "context_snippet": text[max(0, position-20):position+len(matched_text)+150],
                    }
                )
                break
    
    # Check for competitor mentions
    for competitor in context.get("competitors", []) or []:
        name = str(competitor).strip()
        if not name or len(name) < 3:
            continue
        if name.lower() in lower_text:
            position = lower_text.find(name.lower())
            total_len = len(lower_text)
            position_score = 1.0 - (position / total_len) if total_len > 0 else 0.5
            
            mentions.append(
                {
                    "entity_name": name,
                    "entity_type": "competitor",
                    "sentiment": "neutral",
                    "position_score": round(position_score, 2),
                    "context_snippet": text[max(0, position-20):position+len(name)+150] if text else "",
                }
            )
    
    # Check for service/product mentions
    for service in context.get("services", []) or []:
        service_name = str(service).strip().lower()
        if not service_name or len(service_name) < 4:
            continue
        if service_name in lower_text:
            position = lower_text.find(service_name)
            mentions.append(
                {
                    "entity_name": service.strip(),
                    "entity_type": "service",
                    "sentiment": "neutral",
                    "position_score": 0.7,
                    "context_snippet": text[max(0, position-20):position+len(service_name)+100] if text else "",
                }
            )
    
    # Check for location mentions
    for location in context.get("locations", []) or []:
        loc_name = str(location).strip().lower()
        if not loc_name or len(loc_name) < 3:
            continue
        if loc_name in lower_text:
            position = lower_text.find(loc_name)
            mentions.append(
                {
                    "entity_name": location.strip(),
                    "entity_type": "location",
                    "sentiment": "neutral",
                    "position_score": 0.6,
                    "context_snippet": text[max(0, position-20):position+len(loc_name)+100] if text else "",
                }
            )
    
    return mentions


class OpenAIEngineAdapter:
    engine_name = "chatgpt"

    async def run_prompt(self, prompt: str, context: dict) -> EngineResult:
        if not settings.OPENAI_API_KEY:
            raise ProviderIntegrationError(
                provider="openai",
                code="missing_key",
                message="OPENAI_API_KEY is not configured.",
            )
        preprocessed_prompt, preprocess_meta = await _claude_preprocess_prompt(prompt, context)
        last_error: ProviderIntegrationError | None = None
        try:
            async with httpx.AsyncClient(timeout=40.0) as client:
                for model_name in OPENAI_MODELS_TO_TRY:
                    response = await client.post(
                        "https://api.openai.com/v1/responses",
                        headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                        json={
                            "model": model_name,
                            "tools": _build_openai_web_search_tools(),
                            "input": [
                                {"role": "user", "content": [{"type": "input_text", "text": preprocessed_prompt}]}
                            ],
                        },
                    )
                    # OpenAI may return 400 or 404 for unknown model IDs.
                    if response.status_code == 404 or (
                        response.status_code == 400 and "model" in (response.text or "").lower()
                    ):
                        last_error = ProviderIntegrationError(
                            provider="openai",
                            code="model_not_found",
                            message=f"OpenAI model not found: {model_name}",
                            status_code=response.status_code,
                            model=model_name,
                        )
                        continue
                    if response.status_code >= 400:
                        _raise_http_error("openai", response, model_name)
                    payload = response.json()
                    original_text = str(payload.get("output_text", "")) or str(payload)
                    repaired_text, repair_meta = await _claude_repair_response(
                        engine_name=self.engine_name,
                        original_text=original_text,
                        prompt=prompt,
                        context=context,
                    )
                    return EngineResult(
                        engine_name=self.engine_name,
                        raw_text=repaired_text,
                        citations=_extract_citations(
                            repaired_text,
                            context.get("brand_name"),
                            context.get("primary_domain"),
                            context.get("brand_aliases"),
                        ),
                        mentions=_extract_mentions(repaired_text, context),
                        metadata={
                            "provider": "openai",
                            "status_code": response.status_code,
                            "model": model_name,
                            "preprocess": preprocess_meta,
                            "responseRepair": repair_meta,
                            "originalResponseText": original_text,
                        },
                    )
        except ProviderIntegrationError:
            raise
        except Exception as exc:  # noqa: BLE001
            raise _wrap_request_exception("openai", exc) from exc
        raise (
            last_error
            or ProviderIntegrationError(
                provider="openai",
                code="provider_request_failed",
                message="OpenAI request failed.",
            )
        )

    async def healthcheck(self) -> EngineHealthResult:
        checked_at = datetime.utcnow().isoformat()
        if not settings.OPENAI_API_KEY:
            return EngineHealthResult(
                engine_name=self.engine_name,
                configured=False,
                provider="openai",
                live_verified=False,
                error_code="missing_key",
                error_message="OPENAI_API_KEY is not configured.",
                checked_at=checked_at,
            )
        try:
            await self.run_prompt("Return one short sentence with one source URL.", {})
            return EngineHealthResult(
                engine_name=self.engine_name,
                configured=True,
                provider="openai",
                live_verified=True,
                checked_at=checked_at,
            )
        except ProviderIntegrationError as exc:
            return EngineHealthResult(
                engine_name=self.engine_name,
                configured=True,
                provider="openai",
                live_verified=False,
                error_code=exc.code,
                error_message=exc.message,
                checked_at=checked_at,
            )


class AnthropicEngineAdapter:
    engine_name = "claude"

    async def run_prompt(self, prompt: str, context: dict) -> EngineResult:
        if not settings.ANTHROPIC_API_KEY:
            raise ProviderIntegrationError(
                provider="anthropic",
                code="missing_key",
                message="ANTHROPIC_API_KEY is not configured.",
            )
        preprocessed_prompt, preprocess_meta = await _claude_preprocess_prompt(prompt, context)
        models_to_try = ANTHROPIC_MODELS_TO_TRY
        last_error: ProviderIntegrationError | None = None
        try:
            async with httpx.AsyncClient(timeout=40.0) as client:
                for model_name in models_to_try:
                    response = await client.post(
                        "https://api.anthropic.com/v1/messages",
                        headers={
                            "x-api-key": settings.ANTHROPIC_API_KEY,
                            "anthropic-version": "2023-06-01",
                        },
                        json={
                            "model": model_name,
                            "max_tokens": 800,
                            "tools": _build_anthropic_web_search_tools(context),
                            "messages": [{"role": "user", "content": preprocessed_prompt}],
                        },
                    )
                    if response.status_code == 404 or (
                        response.status_code == 400 and "model" in (response.text or "").lower()
                    ):
                        last_error = ProviderIntegrationError(
                            provider="anthropic",
                            code="model_not_found",
                            message=f"Anthropic model not found: {model_name}",
                            status_code=response.status_code,
                            model=model_name,
                        )
                        continue
                    if response.status_code >= 400:
                        _raise_http_error("anthropic", response, model_name)
                    payload = response.json()
                    content = payload.get("content", [])
                    original_text = content[0].get("text", "") if content and isinstance(content, list) else ""
                    repaired_text, repair_meta = await _claude_repair_response(
                        engine_name=self.engine_name,
                        original_text=original_text,
                        prompt=prompt,
                        context=context,
                    )
                    return EngineResult(
                        engine_name=self.engine_name,
                        raw_text=repaired_text,
                        citations=_extract_citations(
                            repaired_text,
                            context.get("brand_name"),
                            context.get("primary_domain"),
                            context.get("brand_aliases"),
                        ),
                        mentions=_extract_mentions(repaired_text, context),
                        metadata={
                            "provider": "anthropic",
                            "status_code": response.status_code,
                            "model": model_name,
                            "preprocess": preprocess_meta,
                            "responseRepair": repair_meta,
                            "originalResponseText": original_text,
                        },
                    )
        except ProviderIntegrationError:
            raise
        except Exception as exc:  # noqa: BLE001
            raise _wrap_request_exception("anthropic", exc) from exc
        raise (last_error or ProviderIntegrationError(provider="anthropic", code="provider_request_failed", message="Anthropic request failed."))

    async def healthcheck(self) -> EngineHealthResult:
        checked_at = datetime.utcnow().isoformat()
        if not settings.ANTHROPIC_API_KEY:
            return EngineHealthResult(
                engine_name=self.engine_name,
                configured=False,
                provider="anthropic",
                live_verified=False,
                error_code="missing_key",
                error_message="ANTHROPIC_API_KEY is not configured.",
                checked_at=checked_at,
            )
        try:
            await self.run_prompt("Return one short sentence with one source URL.", {})
            return EngineHealthResult(
                engine_name=self.engine_name,
                configured=True,
                provider="anthropic",
                live_verified=True,
                checked_at=checked_at,
            )
        except ProviderIntegrationError as exc:
            return EngineHealthResult(
                engine_name=self.engine_name,
                configured=True,
                provider="anthropic",
                live_verified=False,
                error_code=exc.code,
                error_message=exc.message,
                checked_at=checked_at,
            )


class PerplexityEngineAdapter:
    engine_name = "perplexity"

    async def run_prompt(self, prompt: str, context: dict) -> EngineResult:
        if not settings.PERPLEXITY_API_KEY:
            raise ProviderIntegrationError(
                provider="perplexity",
                code="missing_key",
                message="PERPLEXITY_API_KEY is not configured.",
            )
        preprocessed_prompt, preprocess_meta = await _claude_preprocess_prompt(prompt, context)
        model_name = PERPLEXITY_MODEL
        user_prompt_parts = [
            f"Query: {preprocessed_prompt}",
            f"Brand: {str(context.get('brand_name') or '').strip()}",
            f"Primary domain: {str(context.get('primary_domain') or '').strip()}",
            "Return references as explicit URLs.",
            "If listing providers or brands, keep ordering evidence-based and avoid prioritizing any single brand without support.",
        ]
        user_prompt = "\n".join([part for part in user_prompt_parts if part and not part.endswith(": ")])
        prompt_hash = _sha256_hex(f"{PERPLEXITY_SYSTEM_PROMPT}\n{user_prompt}")
        request_payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": PERPLEXITY_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            **PERPLEXITY_REQUEST_PARAMS,
        }
        logger.info(
            "[perplexity][run_prompt] model=%s prompt_hash=%s params=%s",
            model_name,
            prompt_hash,
            PERPLEXITY_REQUEST_PARAMS,
        )
        try:
            async with httpx.AsyncClient(timeout=40.0) as client:
                response = await client.post(
                    "https://api.perplexity.ai/chat/completions",
                    headers={"Authorization": f"Bearer {settings.PERPLEXITY_API_KEY}"},
                    json=request_payload,
                )
            if response.status_code >= 400:
                _raise_http_error("perplexity", response, model_name)
            payload = response.json()
            choices = payload.get("choices", [])
            original_text = choices[0]["message"]["content"] if choices else ""
            repaired_text, repair_meta = await _claude_repair_response(
                engine_name=self.engine_name,
                original_text=original_text,
                prompt=prompt,
                context=context,
            )
            citations = _extract_citations(
                repaired_text,
                context.get("brand_name"),
                context.get("primary_domain"),
                context.get("brand_aliases"),
            )
            raw_citations = payload.get("citations") or []
            for raw in raw_citations:
                if isinstance(raw, str):
                    citations.append(
                        {
                            "cited_domain": re.sub(r"^https?://", "", raw).split("/")[0],
                            "cited_url": raw,
                            "confidence": 1.0,
                            "mention_type": "neutral",
                        }
                    )
            return EngineResult(
                engine_name=self.engine_name,
                raw_text=repaired_text,
                citations=citations,
                mentions=_extract_mentions(repaired_text, context),
                metadata={
                    "provider": "perplexity",
                    "status_code": response.status_code,
                    "model": model_name,
                    "preprocess": preprocess_meta,
                    "responseRepair": repair_meta,
                    "originalResponseText": original_text,
                    "request": {
                        "systemPrompt": PERPLEXITY_SYSTEM_PROMPT,
                        "userPrompt": user_prompt,
                        "promptHash": prompt_hash,
                        "params": PERPLEXITY_REQUEST_PARAMS,
                    },
                },
            )
        except ProviderIntegrationError:
            raise
        except Exception as exc:  # noqa: BLE001
            raise _wrap_request_exception("perplexity", exc) from exc

    async def healthcheck(self) -> EngineHealthResult:
        checked_at = datetime.utcnow().isoformat()
        if not settings.PERPLEXITY_API_KEY:
            return EngineHealthResult(
                engine_name=self.engine_name,
                configured=False,
                provider="perplexity",
                live_verified=False,
                error_code="missing_key",
                error_message="PERPLEXITY_API_KEY is not configured.",
                checked_at=checked_at,
            )
        try:
            await self.run_prompt("Return one short sentence with one source URL.", {})
            return EngineHealthResult(
                engine_name=self.engine_name,
                configured=True,
                provider="perplexity",
                live_verified=True,
                checked_at=checked_at,
            )
        except ProviderIntegrationError as exc:
            return EngineHealthResult(
                engine_name=self.engine_name,
                configured=True,
                provider="perplexity",
                live_verified=False,
                error_code=exc.code,
                error_message=exc.message,
                checked_at=checked_at,
            )


class GeminiEngineAdapter:
    engine_name = "gemini"

    async def run_prompt(self, prompt: str, context: dict) -> EngineResult:
        if not settings.GEMINI_API_KEY:
            raise ProviderIntegrationError(
                provider="google",
                code="missing_key",
                message="GEMINI_API_KEY is not configured.",
            )
        preprocessed_prompt, preprocess_meta = await _claude_preprocess_prompt(prompt, context)
        model_candidates = GEMINI_MODELS_TO_TRY
        api_versions = ["v1beta", "v1"]
        last_error: ProviderIntegrationError | None = None
        try:
            async with httpx.AsyncClient(timeout=40.0) as client:
                for api_version in api_versions:
                    for model_name in model_candidates:
                        response = await client.post(
                            f"https://generativelanguage.googleapis.com/{api_version}/models/{model_name}:generateContent",
                            params={"key": settings.GEMINI_API_KEY},
                            json={
                                "contents": [{"parts": [{"text": preprocessed_prompt}]}],
                                "tools": _build_gemini_web_search_tools(),
                            },
                        )
                        if response.status_code == 404:
                            last_error = ProviderIntegrationError(
                                provider="google",
                                code="model_not_found",
                                message=f"Google model not found: {model_name} ({api_version})",
                                status_code=response.status_code,
                                model=model_name,
                            )
                            continue
                        if response.status_code >= 400:
                            _raise_http_error("google", response, model_name)
                        payload = response.json()
                        candidates = payload.get("candidates", [])
                        text = ""
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                text = str(parts[0].get("text", ""))
                        original_text = text
                        repaired_text, repair_meta = await _claude_repair_response(
                            engine_name=self.engine_name,
                            original_text=original_text,
                            prompt=prompt,
                            context=context,
                        )
                        return EngineResult(
                            engine_name=self.engine_name,
                            raw_text=repaired_text,
                            citations=_extract_citations(
                                repaired_text,
                                context.get("brand_name"),
                                context.get("primary_domain"),
                                context.get("brand_aliases"),
                            ),
                            mentions=_extract_mentions(repaired_text, context),
                            metadata={
                                "provider": "gemini",
                                "status_code": response.status_code,
                                "model": model_name,
                                "apiVersion": api_version,
                                "preprocess": preprocess_meta,
                                "responseRepair": repair_meta,
                                "originalResponseText": original_text,
                            },
                        )
        except ProviderIntegrationError:
            raise
        except Exception as exc:  # noqa: BLE001
            raise _wrap_request_exception("google", exc) from exc
        raise (last_error or ProviderIntegrationError(provider="google", code="provider_request_failed", message="Google Gemini request failed."))

    async def healthcheck(self) -> EngineHealthResult:
        checked_at = datetime.utcnow().isoformat()
        if not settings.GEMINI_API_KEY:
            return EngineHealthResult(
                engine_name=self.engine_name,
                configured=False,
                provider="google",
                live_verified=False,
                error_code="missing_key",
                error_message="GEMINI_API_KEY is not configured.",
                checked_at=checked_at,
            )
        try:
            await self.run_prompt("Return one short sentence with one source URL.", {})
            return EngineHealthResult(
                engine_name=self.engine_name,
                configured=True,
                provider="google",
                live_verified=True,
                checked_at=checked_at,
            )
        except ProviderIntegrationError as exc:
            return EngineHealthResult(
                engine_name=self.engine_name,
                configured=True,
                provider="google",
                live_verified=False,
                error_code=exc.code,
                error_message=exc.message,
                checked_at=checked_at,
            )


class GoogleAiOverviewsEngineAdapter:
    engine_name = "google-ai-overviews"

    async def run_prompt(self, prompt: str, context: dict) -> EngineResult:
        google_key = settings.GOOGLE_AI_OVERVIEWS_API_KEY or settings.GEMINI_API_KEY
        if not google_key:
            raise ProviderIntegrationError(
                provider="google",
                code="missing_key",
                message="GOOGLE_AI_OVERVIEWS_API_KEY (or GEMINI_API_KEY) is not configured.",
            )
        # Google AI Overviews does not expose a public first-party API endpoint.
        # We execute through Gemini as the closest Google-native proxy for GEO testing.
        overview_prompt = (
            "Answer in Google AI Overview style with concise synthesis and source URLs.\n\n"
            f"{prompt}"
        )
        preprocessed_prompt, preprocess_meta = await _claude_preprocess_prompt(overview_prompt, context)
        model_candidates = GEMINI_MODELS_TO_TRY
        api_versions = ["v1beta", "v1"]
        last_error: ProviderIntegrationError | None = None
        try:
            async with httpx.AsyncClient(timeout=40.0) as client:
                for api_version in api_versions:
                    for model_name in model_candidates:
                        response = await client.post(
                            f"https://generativelanguage.googleapis.com/{api_version}/models/{model_name}:generateContent",
                            params={"key": google_key},
                            json={
                                "contents": [{"parts": [{"text": preprocessed_prompt}]}],
                                "tools": _build_gemini_web_search_tools(),
                            },
                        )
                        if response.status_code == 404:
                            last_error = ProviderIntegrationError(
                                provider="google",
                                code="model_not_found",
                                message=f"Google model not found: {model_name} ({api_version})",
                                status_code=response.status_code,
                                model=model_name,
                            )
                            continue
                        if response.status_code >= 400:
                            _raise_http_error("google", response, model_name)
                        payload = response.json()
                        candidates = payload.get("candidates", [])
                        text = ""
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                text = str(parts[0].get("text", ""))
                        original_text = text
                        repaired_text, repair_meta = await _claude_repair_response(
                            engine_name=self.engine_name,
                            original_text=original_text,
                            prompt=prompt,
                            context=context,
                        )
                        return EngineResult(
                            engine_name=self.engine_name,
                            raw_text=repaired_text,
                            citations=_extract_citations(
                                repaired_text,
                                context.get("brand_name"),
                                context.get("primary_domain"),
                                context.get("brand_aliases"),
                            ),
                            mentions=_extract_mentions(repaired_text, context),
                            metadata={
                                "provider": "google-ai-overviews-proxy",
                                "status_code": response.status_code,
                                "model": model_name,
                                "apiVersion": api_version,
                                "preprocess": preprocess_meta,
                                "responseRepair": repair_meta,
                                "originalResponseText": original_text,
                            },
                        )
        except ProviderIntegrationError:
            raise
        except Exception as exc:  # noqa: BLE001
            raise _wrap_request_exception("google", exc) from exc
        raise (last_error or ProviderIntegrationError(provider="google", code="provider_request_failed", message="Google AI Overviews proxy request failed."))

    async def healthcheck(self) -> EngineHealthResult:
        checked_at = datetime.utcnow().isoformat()
        configured = bool(settings.GOOGLE_AI_OVERVIEWS_API_KEY or settings.GEMINI_API_KEY)
        if not configured:
            return EngineHealthResult(
                engine_name=self.engine_name,
                configured=False,
                provider="google",
                live_verified=False,
                error_code="missing_key",
                error_message="GOOGLE_AI_OVERVIEWS_API_KEY (or GEMINI_API_KEY) is not configured.",
                checked_at=checked_at,
            )
        try:
            await self.run_prompt("Return one short sentence with one source URL.", {})
            return EngineHealthResult(
                engine_name=self.engine_name,
                configured=True,
                provider="google",
                live_verified=True,
                checked_at=checked_at,
            )
        except ProviderIntegrationError as exc:
            return EngineHealthResult(
                engine_name=self.engine_name,
                configured=True,
                provider="google",
                live_verified=False,
                error_code=exc.code,
                error_message=exc.message,
                checked_at=checked_at,
            )


def resolve_engine_adapter(engine_name: str) -> LLMEngineAdapter:
    engine = engine_name.lower().strip()
    if engine in {"chatgpt", "openai"}:
        return OpenAIEngineAdapter()
    if engine in {"claude", "anthropic"}:
        return AnthropicEngineAdapter()
    if engine in {"perplexity"}:
        return PerplexityEngineAdapter()
    if engine in {"google-ai-overviews"}:
        return GoogleAiOverviewsEngineAdapter()
    if engine in {"gemini"}:
        return GeminiEngineAdapter()
    raise ValueError(f"Unsupported engine adapter: {engine_name}")


def provider_configuration_status() -> dict[str, dict]:
    google_configured = bool(settings.GOOGLE_AI_OVERVIEWS_API_KEY or settings.GEMINI_API_KEY)
    return {
        "chatgpt": {"configured": bool(settings.OPENAI_API_KEY), "provider": "openai"},
        "google-ai-overviews": {"configured": google_configured, "provider": "google"},
        "perplexity": {"configured": bool(settings.PERPLEXITY_API_KEY), "provider": "perplexity"},
        "gemini": {"configured": bool(settings.GEMINI_API_KEY), "provider": "google"},
        "claude": {"configured": bool(settings.ANTHROPIC_API_KEY), "provider": "anthropic"},
    }


async def run_healthchecks(engines: list[str] | None = None) -> list[EngineHealthResult]:
    selected = engines or SUPPORTED_ENGINES
    results: list[EngineHealthResult] = []
    for engine in selected:
        adapter = resolve_engine_adapter(engine)
        results.append(await adapter.healthcheck())
    return results
