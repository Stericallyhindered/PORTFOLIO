"""
Feedback Expansion Engine - Post-scout answer-space parsing and adaptive prompt generation.

After the core/scout run completes, this module:
1. Parses engine responses to extract discovered entities, competitors, topics
2. Identifies gaps in coverage (missing use-cases, topics, audiences)
3. Detects "buyer language" patterns not present in original prompts
4. Generates second-pass expansion prompts to fill gaps
5. Merges site-derived and answer-derived competitors for comprehensive coverage
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import TYPE_CHECKING
from uuid import uuid4

if TYPE_CHECKING:
    from .prompt_expansion_engine import ExpandedPrompt
    from .site_context_builder import SiteContext


@dataclass
class AnswerSpaceAnalysis:
    """Analysis of answer space from engine runs."""
    
    discovered_competitors: list[str] = field(default_factory=list)
    discovered_topics: list[str] = field(default_factory=list)
    discovered_use_cases: list[str] = field(default_factory=list)
    discovered_audiences: list[str] = field(default_factory=list)
    buyer_language_patterns: list[str] = field(default_factory=list)
    missing_coverage_gaps: list[str] = field(default_factory=list)
    high_frequency_entities: list[tuple[str, int]] = field(default_factory=list)
    competitor_share_of_voice: dict[str, float] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "discovered_competitors": self.discovered_competitors,
            "discovered_topics": self.discovered_topics,
            "discovered_use_cases": self.discovered_use_cases,
            "discovered_audiences": self.discovered_audiences,
            "buyer_language_patterns": self.buyer_language_patterns,
            "missing_coverage_gaps": self.missing_coverage_gaps,
            "high_frequency_entities": self.high_frequency_entities,
            "competitor_share_of_voice": self.competitor_share_of_voice,
        }


@dataclass
class FeedbackExpansionResult:
    """Result of feedback-driven expansion."""
    
    analysis: AnswerSpaceAnalysis
    new_prompts: list["ExpandedPrompt"] = field(default_factory=list)
    merged_competitors: list[str] = field(default_factory=list)
    coverage_improvement_score: float = 0.0

    def to_dict(self) -> dict:
        return {
            "analysis": self.analysis.to_dict(),
            "new_prompt_count": len(self.new_prompts),
            "merged_competitor_count": len(self.merged_competitors),
            "coverage_improvement_score": self.coverage_improvement_score,
        }


BUYER_LANGUAGE_PATTERNS = [
    r"(?i)\b(best|top|recommended|leading|trusted)\b",
    r"(?i)\b(buy|purchase|hire|book|get|subscribe)\b",
    r"(?i)\b(pricing|cost|price|fee|rate|quote)\b",
    r"(?i)\b(vs|versus|compared to|alternative|instead of)\b",
    r"(?i)\b(review|rating|testimonial|feedback)\b",
    r"(?i)\b(for small business|for enterprise|for startup|for agency)\b",
    r"(?i)\b(free trial|demo|consultation)\b",
    r"(?i)\b(integration|api|connect|sync)\b",
]

COMPETITOR_EXTRACTION_PATTERNS = [
    r"(?i)(?:competitors?|alternatives?|rivals?)\s+(?:include|like|such as|are)\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)?)",
    r"(?i)([A-Z][a-zA-Z0-9]+)\s+(?:is|are)\s+(?:a|an|the)\s+(?:competitor|alternative|rival)",
    r"(?i)(?:vs|versus|compared to)\s+([A-Z][a-zA-Z0-9]+)",
    r"(?i)([A-Z][a-zA-Z0-9]+)\s+(?:vs|versus|compared to)",
]

TOPIC_EXTRACTION_PATTERNS = [
    r"(?i)(?:topics?|areas?|categories?)\s+(?:include|like|such as|are)\s+([^.!?]+)",
    r"(?i)(?:related to|about|regarding|concerning)\s+([^.!?]+)",
]

USE_CASE_EXTRACTION_PATTERNS = [
    r"(?i)(?:use cases?|applications?|scenarios?)\s+(?:include|like|such as|are)\s+([^.!?]+)",
    r"(?i)(?:used for|ideal for|perfect for|great for)\s+([^.!?]+)",
]

AUDIENCE_EXTRACTION_PATTERNS = [
    r"(?i)(?:designed for|built for|made for|ideal for)\s+((?:small |large |enterprise |)?(?:business(?:es)?|companies|teams|organizations|agencies|startups|professionals|individuals))",
    r"(?i)((?:small |large |enterprise |)?(?:business(?:es)?|companies|teams|organizations|agencies|startups|professionals|individuals))\s+(?:can|will|should|love|trust|use)",
]


def _normalize(text: str) -> str:
    """Normalize text for deduplication."""
    return " ".join(text.lower().strip().split())


def _dedupe_list(items: list[str]) -> list[str]:
    """Remove duplicates preserving order."""
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        key = _normalize(item)
        if key and key not in seen and len(key) > 2:
            seen.add(key)
            result.append(item.strip())
    return result


def _extract_competitors_from_responses(responses: list[str], known_brand: str) -> list[str]:
    """Extract competitor mentions from engine responses."""
    competitors: list[str] = []
    
    for response in responses:
        for pattern in COMPETITOR_EXTRACTION_PATTERNS:
            for match in re.findall(pattern, response):
                if isinstance(match, tuple):
                    match = match[0]
                clean = match.strip()
                if clean and clean.lower() != known_brand.lower() and 2 < len(clean) < 50:
                    competitors.append(clean)
    
    return _dedupe_list(competitors)


def _extract_topics_from_responses(responses: list[str]) -> list[str]:
    """Extract topic mentions from engine responses."""
    topics: list[str] = []
    
    for response in responses:
        for pattern in TOPIC_EXTRACTION_PATTERNS:
            for match in re.findall(pattern, response):
                if isinstance(match, tuple):
                    match = match[0]
                clean = match.strip()
                if clean and 3 < len(clean) < 100:
                    topics.append(clean)
    
    return _dedupe_list(topics)[:30]


def _extract_use_cases_from_responses(responses: list[str]) -> list[str]:
    """Extract use case mentions from engine responses."""
    use_cases: list[str] = []
    
    for response in responses:
        for pattern in USE_CASE_EXTRACTION_PATTERNS:
            for match in re.findall(pattern, response):
                if isinstance(match, tuple):
                    match = match[0]
                clean = match.strip()
                if clean and 3 < len(clean) < 100:
                    use_cases.append(clean)
    
    return _dedupe_list(use_cases)[:20]


def _extract_audiences_from_responses(responses: list[str]) -> list[str]:
    """Extract audience mentions from engine responses."""
    audiences: list[str] = []
    
    for response in responses:
        for pattern in AUDIENCE_EXTRACTION_PATTERNS:
            for match in re.findall(pattern, response):
                if isinstance(match, tuple):
                    match = match[0]
                clean = match.strip()
                if clean and 3 < len(clean) < 50:
                    audiences.append(clean)
    
    return _dedupe_list(audiences)[:15]


def _extract_buyer_language(responses: list[str]) -> list[str]:
    """Extract buyer language patterns from responses."""
    patterns_found: list[str] = []
    
    for response in responses:
        for pattern in BUYER_LANGUAGE_PATTERNS:
            matches = re.findall(pattern, response)
            for match in matches:
                if isinstance(match, tuple):
                    match = match[0]
                patterns_found.append(match.lower())
    
    return _dedupe_list(patterns_found)[:20]


def _compute_entity_frequency(responses: list[str]) -> list[tuple[str, int]]:
    """Compute entity frequency across responses."""
    entity_counts: dict[str, int] = {}
    
    for response in responses:
        entities = re.findall(r"\b([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)?)\b", response)
        for entity in entities:
            if len(entity) > 2:
                key = entity.lower()
                entity_counts[key] = entity_counts.get(key, 0) + 1
    
    sorted_entities = sorted(entity_counts.items(), key=lambda x: x[1], reverse=True)
    return sorted_entities[:30]


def _compute_competitor_share_of_voice(
    responses: list[str],
    competitors: list[str],
    brand_name: str,
) -> dict[str, float]:
    """Compute share of voice for brand and competitors."""
    mention_counts: dict[str, int] = {}
    
    all_entities = [brand_name] + competitors
    total_mentions = 0
    
    for entity in all_entities:
        count = 0
        for response in responses:
            count += response.lower().count(entity.lower())
        mention_counts[entity] = count
        total_mentions += count
    
    share_of_voice: dict[str, float] = {}
    for entity, count in mention_counts.items():
        share_of_voice[entity] = (count / max(1, total_mentions)) * 100
    
    return share_of_voice


def _identify_coverage_gaps(
    site_context: "SiteContext",
    discovered_topics: list[str],
    discovered_use_cases: list[str],
    discovered_audiences: list[str],
) -> list[str]:
    """Identify coverage gaps between site content and answer space."""
    gaps: list[str] = []
    
    site_topics = set(_normalize(t) for t in site_context.core_topics)
    for topic in discovered_topics:
        if _normalize(topic) not in site_topics:
            gaps.append(f"Missing topic: {topic}")
    
    site_use_cases = set(_normalize(u) for u in site_context.use_cases)
    for use_case in discovered_use_cases:
        if _normalize(use_case) not in site_use_cases:
            gaps.append(f"Missing use case: {use_case}")
    
    site_audiences = set(_normalize(a) for a in site_context.customer_types)
    for audience in discovered_audiences:
        if _normalize(audience) not in site_audiences:
            gaps.append(f"Missing audience: {audience}")
    
    return gaps[:25]


def _generate_competitor_expansion_prompts(
    brand_name: str,
    merged_competitors: list[str],
    topics: list[str],
    audiences: list[str],
) -> list["ExpandedPrompt"]:
    """Generate competitor-focused expansion prompts."""
    from .prompt_expansion_engine import ExpandedPrompt
    
    prompts: list[ExpandedPrompt] = []
    
    for competitor in merged_competitors[:10]:
        prompts.append(ExpandedPrompt(
            id=str(uuid4()),
            text=f"{brand_name} vs {competitor}",
            topic=brand_name,
            intent="comparison",
            funnel_stage="evaluation",
            competitor=competitor,
            source_layer="feedback_competitor",
            source_reason=f"Competitor discovered in answer space: {competitor}",
            priority_tier=1,
        ))
        
        prompts.append(ExpandedPrompt(
            id=str(uuid4()),
            text=f"best alternative to {competitor}",
            topic=competitor,
            intent="alternatives",
            funnel_stage="evaluation",
            competitor=competitor,
            source_layer="feedback_competitor",
            source_reason=f"Alternative prompt for discovered competitor: {competitor}",
            priority_tier=1,
        ))
        
        for topic in topics[:3]:
            prompts.append(ExpandedPrompt(
                id=str(uuid4()),
                text=f"{brand_name} vs {competitor} for {topic}",
                topic=topic,
                intent="comparison",
                funnel_stage="evaluation",
                competitor=competitor,
                source_layer="feedback_competitor_topic",
                source_reason=f"Topic-specific competitor comparison: {topic}",
            ))
        
        for audience in audiences[:3]:
            prompts.append(ExpandedPrompt(
                id=str(uuid4()),
                text=f"{brand_name} vs {competitor} for {audience}",
                topic=brand_name,
                intent="comparison",
                funnel_stage="evaluation",
                audience=audience,
                competitor=competitor,
                source_layer="feedback_competitor_audience",
                source_reason=f"Audience-specific competitor comparison: {audience}",
            ))
    
    return prompts


def _generate_gap_filling_prompts(
    brand_name: str,
    coverage_gaps: list[str],
    discovered_topics: list[str],
    discovered_use_cases: list[str],
    discovered_audiences: list[str],
) -> list["ExpandedPrompt"]:
    """Generate prompts to fill coverage gaps."""
    from .prompt_expansion_engine import ExpandedPrompt
    
    prompts: list[ExpandedPrompt] = []
    
    for topic in discovered_topics[:10]:
        prompts.append(ExpandedPrompt(
            id=str(uuid4()),
            text=f"best {topic}",
            topic=topic,
            intent="commercial",
            funnel_stage="consideration",
            source_layer="feedback_topic_gap",
            source_reason=f"Topic discovered in answer space: {topic}",
        ))
        
        prompts.append(ExpandedPrompt(
            id=str(uuid4()),
            text=f"{brand_name} for {topic}",
            topic=topic,
            intent="brand_specific",
            funnel_stage="evaluation",
            source_layer="feedback_topic_gap",
            source_reason=f"Brand + discovered topic: {topic}",
        ))
    
    for use_case in discovered_use_cases[:8]:
        prompts.append(ExpandedPrompt(
            id=str(uuid4()),
            text=f"best tool for {use_case}",
            topic=use_case,
            use_case=use_case,
            intent="commercial",
            funnel_stage="consideration",
            source_layer="feedback_use_case_gap",
            source_reason=f"Use case discovered in answer space: {use_case}",
        ))
    
    for audience in discovered_audiences[:6]:
        prompts.append(ExpandedPrompt(
            id=str(uuid4()),
            text=f"best {brand_name} for {audience}",
            topic=brand_name,
            audience=audience,
            intent="audience_specific",
            funnel_stage="consideration",
            source_layer="feedback_audience_gap",
            source_reason=f"Audience discovered in answer space: {audience}",
        ))
    
    return prompts


def _generate_buyer_language_prompts(
    brand_name: str,
    buyer_patterns: list[str],
    topics: list[str],
) -> list["ExpandedPrompt"]:
    """Generate prompts using discovered buyer language patterns."""
    from .prompt_expansion_engine import ExpandedPrompt
    
    prompts: list[ExpandedPrompt] = []
    
    for pattern in buyer_patterns[:10]:
        for topic in topics[:5]:
            if pattern in ["best", "top", "recommended", "leading", "trusted"]:
                prompts.append(ExpandedPrompt(
                    id=str(uuid4()),
                    text=f"{pattern} {topic}",
                    topic=topic,
                    intent="commercial",
                    funnel_stage="consideration",
                    source_layer="feedback_buyer_language",
                    source_reason=f"Buyer language pattern: {pattern}",
                ))
            elif pattern in ["pricing", "cost", "price"]:
                prompts.append(ExpandedPrompt(
                    id=str(uuid4()),
                    text=f"{topic} {pattern}",
                    topic=topic,
                    intent="pricing",
                    funnel_stage="evaluation",
                    source_layer="feedback_buyer_language",
                    source_reason=f"Pricing language pattern: {pattern}",
                ))
    
    return prompts


def analyze_answer_space(
    responses: list[str],
    site_context: "SiteContext",
) -> AnswerSpaceAnalysis:
    """
    Analyze answer space from engine responses.
    
    This is the first step of the feedback loop - understanding what
    the AI engines are saying about the market.
    """
    discovered_competitors = _extract_competitors_from_responses(
        responses, site_context.brand_name
    )
    discovered_topics = _extract_topics_from_responses(responses)
    discovered_use_cases = _extract_use_cases_from_responses(responses)
    discovered_audiences = _extract_audiences_from_responses(responses)
    buyer_language = _extract_buyer_language(responses)
    high_frequency_entities = _compute_entity_frequency(responses)
    
    all_competitors = _dedupe_list(
        site_context.competitors + discovered_competitors
    )
    
    competitor_sov = _compute_competitor_share_of_voice(
        responses, all_competitors, site_context.brand_name
    )
    
    coverage_gaps = _identify_coverage_gaps(
        site_context,
        discovered_topics,
        discovered_use_cases,
        discovered_audiences,
    )
    
    return AnswerSpaceAnalysis(
        discovered_competitors=discovered_competitors,
        discovered_topics=discovered_topics,
        discovered_use_cases=discovered_use_cases,
        discovered_audiences=discovered_audiences,
        buyer_language_patterns=buyer_language,
        missing_coverage_gaps=coverage_gaps,
        high_frequency_entities=high_frequency_entities,
        competitor_share_of_voice=competitor_sov,
    )


def generate_feedback_expansion(
    responses: list[str],
    site_context: "SiteContext",
    existing_prompts: list["ExpandedPrompt"],
) -> FeedbackExpansionResult:
    """
    Generate feedback-driven expansion prompts.
    
    This is the main entry point for the feedback loop that runs after
    the scout/core tier execution completes.
    """
    analysis = analyze_answer_space(responses, site_context)
    
    merged_competitors = _dedupe_list(
        site_context.competitors + analysis.discovered_competitors
    )
    
    existing_texts = {_normalize(p.text) for p in existing_prompts}
    
    new_prompts: list["ExpandedPrompt"] = []
    
    competitor_prompts = _generate_competitor_expansion_prompts(
        site_context.brand_name,
        merged_competitors,
        analysis.discovered_topics,
        analysis.discovered_audiences,
    )
    for p in competitor_prompts:
        if _normalize(p.text) not in existing_texts:
            new_prompts.append(p)
            existing_texts.add(_normalize(p.text))
    
    gap_prompts = _generate_gap_filling_prompts(
        site_context.brand_name,
        analysis.missing_coverage_gaps,
        analysis.discovered_topics,
        analysis.discovered_use_cases,
        analysis.discovered_audiences,
    )
    for p in gap_prompts:
        if _normalize(p.text) not in existing_texts:
            new_prompts.append(p)
            existing_texts.add(_normalize(p.text))
    
    buyer_prompts = _generate_buyer_language_prompts(
        site_context.brand_name,
        analysis.buyer_language_patterns,
        site_context.core_topics,
    )
    for p in buyer_prompts:
        if _normalize(p.text) not in existing_texts:
            new_prompts.append(p)
            existing_texts.add(_normalize(p.text))
    
    coverage_improvement = min(1.0, len(new_prompts) / 100.0)
    
    return FeedbackExpansionResult(
        analysis=analysis,
        new_prompts=new_prompts,
        merged_competitors=merged_competitors,
        coverage_improvement_score=coverage_improvement,
    )
