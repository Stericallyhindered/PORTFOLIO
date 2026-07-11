"""
Seed Prompt Generator - Layer 4 of the prompt generation pipeline.

Generates high-quality base prompts from site dimensions:
- Topic
- Audience
- Use case
- Pain point
- Product/service
- Feature
- Competitor
- Claim
- Page type

These seeds are the foundation for expansion into thousands of prompts.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING
from uuid import uuid4

if TYPE_CHECKING:
    from .site_context_builder import SiteContext
    from .topic_graph_builder import TopicGraph
    from .intent_graph_builder import IntentGraph, PromptIntent, FunnelStage


@dataclass
class SeedPrompt:
    """A seed prompt with full metadata for explainability."""
    
    id: str = field(default_factory=lambda: str(uuid4()))
    text: str = ""
    topic: str | None = None
    subtopic: str | None = None
    intent: str = "informational"
    funnel_stage: str = "awareness"
    audience: str | None = None
    use_case: str | None = None
    pain_point: str | None = None
    feature: str | None = None
    competitor: str | None = None
    source_layer: str = "seed"
    source_reason: str | None = None
    semantic_cluster_id: str | None = None
    quality_score: float | None = None
    priority_tier: int = 2

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "text": self.text,
            "topic": self.topic,
            "subtopic": self.subtopic,
            "intent": self.intent,
            "funnel_stage": self.funnel_stage,
            "audience": self.audience,
            "use_case": self.use_case,
            "pain_point": self.pain_point,
            "feature": self.feature,
            "competitor": self.competitor,
            "source_layer": self.source_layer,
            "source_reason": self.source_reason,
            "semantic_cluster_id": self.semantic_cluster_id,
            "quality_score": self.quality_score,
            "priority_tier": self.priority_tier,
        }


SEED_TEMPLATES = {
    "definition": [
        "what is {topic}",
        "how does {topic} work",
        "why use {topic}",
        "when should I use {topic}",
    ],
    "best_of": [
        "best {topic}",
        "top {topic}",
        "most trusted {topic}",
        "recommended {topic}",
    ],
    "audience": [
        "best {topic} for {audience}",
        "recommended {topic} for {audience}",
        "{topic} for {audience}",
    ],
    "use_case": [
        "best {topic} for {use_case}",
        "recommended {topic} for {use_case}",
        "how to use {topic} for {use_case}",
    ],
    "pain_point": [
        "best {topic} for {pain_point}",
        "how to solve {pain_point}",
        "fix {pain_point} with {topic}",
    ],
    "comparison": [
        "{brand} vs {competitor}",
        "compare {brand} and {competitor}",
        "{brand} or {competitor}",
    ],
    "alternative": [
        "alternative to {brand}",
        "best alternative to {competitor}",
        "alternatives to {topic}",
    ],
    "feature": [
        "best {topic} with {feature}",
        "recommended {topic} that supports {feature}",
        "{topic} with {feature}",
    ],
    "pricing": [
        "best affordable {topic}",
        "is {brand} worth it",
        "best value {topic}",
        "{topic} pricing",
    ],
    "trust": [
        "most reliable {topic}",
        "which {topic} is most trusted",
        "is {brand} trustworthy",
    ],
    "strategic": [
        "how should I choose a {topic}",
        "what should I look for in a {topic}",
        "{topic} buying guide",
    ],
    "migration": [
        "how to move from {competitor} to {brand}",
        "best replacement for {competitor}",
        "switch from {competitor}",
    ],
    "local": [
        "best {topic} for {industry}",
        "best {topic} in {location}",
        "{topic} near me",
    ],
    "scenario": [
        "I need {topic} for {scenario}",
        "what should I use if {scenario}",
        "best {topic} when {scenario}",
    ],
    "expert": [
        "best {topic} for advanced users",
        "best {topic} with {technical_requirement}",
        "professional {topic}",
    ],
    "beginner": [
        "easy {topic} for beginners",
        "best beginner-friendly {topic}",
        "simple {topic}",
    ],
}


def _normalize(text: str) -> str:
    """Normalize text for deduplication."""
    return " ".join(text.lower().strip().split())


def _dedupe_seeds(seeds: list[SeedPrompt]) -> list[SeedPrompt]:
    """Remove duplicate seeds by normalized text."""
    seen: set[str] = set()
    result: list[SeedPrompt] = []
    for seed in seeds:
        key = _normalize(seed.text)
        if key and key not in seen and len(key) > 5:
            seen.add(key)
            result.append(seed)
    return result


def _generate_definition_seeds(
    topics: list[str],
    brand_name: str,
) -> list[SeedPrompt]:
    """Generate definition/educational seed prompts."""
    seeds: list[SeedPrompt] = []
    
    for topic in topics[:25]:
        for template in SEED_TEMPLATES["definition"]:
            seeds.append(SeedPrompt(
                text=template.format(topic=topic),
                topic=topic,
                intent="informational",
                funnel_stage="awareness",
                source_layer="seed",
                source_reason=f"definition seed from topic: {topic}",
            ))
    
    return seeds


def _generate_best_of_seeds(
    topics: list[str],
    brand_name: str,
) -> list[SeedPrompt]:
    """Generate best-of/ranking seed prompts."""
    seeds: list[SeedPrompt] = []
    
    for topic in topics[:20]:
        for template in SEED_TEMPLATES["best_of"]:
            seeds.append(SeedPrompt(
                text=template.format(topic=topic),
                topic=topic,
                intent="commercial",
                funnel_stage="consideration",
                source_layer="seed",
                source_reason=f"best-of seed from topic: {topic}",
                priority_tier=1,
            ))
    
    return seeds


def _generate_audience_seeds(
    topics: list[str],
    audiences: list[str],
) -> list[SeedPrompt]:
    """Generate audience-specific seed prompts."""
    seeds: list[SeedPrompt] = []
    
    for topic in topics[:15]:
        for audience in audiences[:10]:
            for template in SEED_TEMPLATES["audience"]:
                seeds.append(SeedPrompt(
                    text=template.format(topic=topic, audience=audience),
                    topic=topic,
                    audience=audience,
                    intent="commercial",
                    funnel_stage="consideration",
                    source_layer="seed",
                    source_reason=f"audience seed: {audience} for {topic}",
                ))
    
    return seeds


def _generate_use_case_seeds(
    topics: list[str],
    use_cases: list[str],
) -> list[SeedPrompt]:
    """Generate use-case seed prompts."""
    seeds: list[SeedPrompt] = []
    
    for topic in topics[:15]:
        for use_case in use_cases[:10]:
            for template in SEED_TEMPLATES["use_case"]:
                seeds.append(SeedPrompt(
                    text=template.format(topic=topic, use_case=use_case),
                    topic=topic,
                    use_case=use_case,
                    intent="commercial",
                    funnel_stage="consideration",
                    source_layer="seed",
                    source_reason=f"use-case seed: {use_case} for {topic}",
                ))
    
    return seeds


def _generate_pain_point_seeds(
    topics: list[str],
    pain_points: list[str],
) -> list[SeedPrompt]:
    """Generate pain-point seed prompts."""
    seeds: list[SeedPrompt] = []
    
    for topic in topics[:10]:
        for pain_point in pain_points[:10]:
            for template in SEED_TEMPLATES["pain_point"]:
                seeds.append(SeedPrompt(
                    text=template.format(topic=topic, pain_point=pain_point),
                    topic=topic,
                    pain_point=pain_point,
                    intent="problem_solving",
                    funnel_stage="consideration",
                    source_layer="seed",
                    source_reason=f"pain-point seed: {pain_point}",
                    priority_tier=1,
                ))
    
    return seeds


def _generate_comparison_seeds(
    brand_name: str,
    competitors: list[str],
    topics: list[str],
) -> list[SeedPrompt]:
    """Generate comparison seed prompts."""
    seeds: list[SeedPrompt] = []
    
    for competitor in competitors[:10]:
        for template in SEED_TEMPLATES["comparison"]:
            seeds.append(SeedPrompt(
                text=template.format(brand=brand_name, competitor=competitor),
                topic=brand_name,
                competitor=competitor,
                intent="comparison",
                funnel_stage="evaluation",
                source_layer="seed",
                source_reason=f"comparison seed: {brand_name} vs {competitor}",
                priority_tier=1,
            ))
        
        seeds.append(SeedPrompt(
            text=f"{competitor} vs {brand_name}",
            topic=brand_name,
            competitor=competitor,
            intent="comparison",
            funnel_stage="evaluation",
            source_layer="seed",
            source_reason=f"reverse comparison: {competitor} vs {brand_name}",
            priority_tier=1,
        ))
    
    for topic in topics[:8]:
        for competitor in competitors[:5]:
            seeds.append(SeedPrompt(
                text=f"{brand_name} vs {competitor} for {topic}",
                topic=topic,
                competitor=competitor,
                intent="comparison",
                funnel_stage="evaluation",
                source_layer="seed",
                source_reason=f"topic comparison: {topic}",
            ))
    
    return seeds


def _generate_alternative_seeds(
    brand_name: str,
    competitors: list[str],
    topics: list[str],
) -> list[SeedPrompt]:
    """Generate alternative seed prompts."""
    seeds: list[SeedPrompt] = []
    
    seeds.append(SeedPrompt(
        text=f"alternative to {brand_name}",
        topic=brand_name,
        intent="alternatives",
        funnel_stage="evaluation",
        source_layer="seed",
        source_reason="brand alternative seed",
        priority_tier=1,
    ))
    seeds.append(SeedPrompt(
        text=f"best alternative to {brand_name}",
        topic=brand_name,
        intent="alternatives",
        funnel_stage="evaluation",
        source_layer="seed",
        source_reason="brand alternative seed",
        priority_tier=1,
    ))
    
    for competitor in competitors[:8]:
        for template in SEED_TEMPLATES["alternative"]:
            seeds.append(SeedPrompt(
                text=template.format(brand=brand_name, competitor=competitor, topic=competitor),
                topic=competitor,
                competitor=competitor,
                intent="alternatives",
                funnel_stage="evaluation",
                source_layer="seed",
                source_reason=f"competitor alternative: {competitor}",
            ))
    
    for topic in topics[:10]:
        seeds.append(SeedPrompt(
            text=f"alternatives to {topic}",
            topic=topic,
            intent="alternatives",
            funnel_stage="evaluation",
            source_layer="seed",
            source_reason=f"topic alternative: {topic}",
        ))
    
    return seeds


def _generate_feature_seeds(
    topics: list[str],
    features: list[str],
) -> list[SeedPrompt]:
    """Generate feature-specific seed prompts."""
    seeds: list[SeedPrompt] = []
    
    for topic in topics[:12]:
        for feature in features[:8]:
            for template in SEED_TEMPLATES["feature"]:
                seeds.append(SeedPrompt(
                    text=template.format(topic=topic, feature=feature),
                    topic=topic,
                    feature=feature,
                    intent="feature_specific",
                    funnel_stage="evaluation",
                    source_layer="seed",
                    source_reason=f"feature seed: {feature} for {topic}",
                ))
    
    return seeds


def _generate_pricing_seeds(
    brand_name: str,
    topics: list[str],
) -> list[SeedPrompt]:
    """Generate pricing/value seed prompts."""
    seeds: list[SeedPrompt] = []
    
    for topic in topics[:15]:
        for template in SEED_TEMPLATES["pricing"]:
            seeds.append(SeedPrompt(
                text=template.format(topic=topic, brand=brand_name),
                topic=topic,
                intent="pricing",
                funnel_stage="evaluation",
                source_layer="seed",
                source_reason=f"pricing seed: {topic}",
            ))
    
    return seeds


def _generate_trust_seeds(
    brand_name: str,
    brand_aliases: list[str],
    topics: list[str],
) -> list[SeedPrompt]:
    """Generate trust/credibility seed prompts."""
    seeds: list[SeedPrompt] = []
    
    for template in SEED_TEMPLATES["trust"]:
        seeds.append(SeedPrompt(
            text=template.format(topic=brand_name, brand=brand_name),
            topic=brand_name,
            intent="trust",
            funnel_stage="evaluation",
            source_layer="seed",
            source_reason="brand trust seed",
            priority_tier=1,
        ))

    for alias in brand_aliases[:5]:
        if alias.lower() == brand_name.lower():
            continue
        seeds.append(
            SeedPrompt(
                text=f"{alias} reviews",
                topic=brand_name,
                intent="trust",
                funnel_stage="evaluation",
                source_layer="seed",
                source_reason=f"brand-alias trust seed: {alias}",
                priority_tier=1,
            )
        )
        seeds.append(
            SeedPrompt(
                text=f"is {alias} legit",
                topic=brand_name,
                intent="trust",
                funnel_stage="evaluation",
                source_layer="seed",
                source_reason=f"brand-alias trust seed: {alias}",
                priority_tier=1,
            )
        )
    
    for topic in topics[:10]:
        seeds.append(SeedPrompt(
            text=f"most reliable {topic}",
            topic=topic,
            intent="trust",
            funnel_stage="evaluation",
            source_layer="seed",
            source_reason=f"trust seed: {topic}",
        ))
    
    return seeds


def _generate_strategic_seeds(
    topics: list[str],
) -> list[SeedPrompt]:
    """Generate strategic/consultative seed prompts."""
    seeds: list[SeedPrompt] = []
    
    for topic in topics[:15]:
        for template in SEED_TEMPLATES["strategic"]:
            seeds.append(SeedPrompt(
                text=template.format(topic=topic),
                topic=topic,
                intent="strategic",
                funnel_stage="awareness",
                source_layer="seed",
                source_reason=f"strategic seed: {topic}",
            ))
    
    return seeds


def _generate_migration_seeds(
    brand_name: str,
    competitors: list[str],
) -> list[SeedPrompt]:
    """Generate migration/switching seed prompts."""
    seeds: list[SeedPrompt] = []
    
    for competitor in competitors[:8]:
        for template in SEED_TEMPLATES["migration"]:
            seeds.append(SeedPrompt(
                text=template.format(brand=brand_name, competitor=competitor),
                topic=brand_name,
                competitor=competitor,
                intent="migration",
                funnel_stage="implementation",
                source_layer="seed",
                source_reason=f"migration seed: from {competitor}",
            ))
    
    return seeds


def _generate_local_seeds(
    topics: list[str],
    industries: list[str],
    locations: list[str],
) -> list[SeedPrompt]:
    """Generate local/industry-specific seed prompts."""
    seeds: list[SeedPrompt] = []
    
    for topic in topics[:10]:
        for industry in industries[:5]:
            seeds.append(SeedPrompt(
                text=f"best {topic} for {industry}",
                topic=topic,
                intent="local",
                funnel_stage="consideration",
                source_layer="seed",
                source_reason=f"industry seed: {industry}",
            ))
        
        for location in locations[:5]:
            seeds.append(SeedPrompt(
                text=f"best {topic} in {location}",
                topic=topic,
                intent="local",
                funnel_stage="consideration",
                source_layer="seed",
                source_reason=f"location seed: {location}",
            ))
    
    return seeds


def generate_seed_prompts(
    site_context: "SiteContext",
    topic_graph: "TopicGraph",
    intent_graph: "IntentGraph",
) -> list[SeedPrompt]:
    """
    Generate high-quality seed prompts from site dimensions.
    
    This is Layer 4 of the prompt generation pipeline.
    Target: 200-500 strong seed prompts.
    """
    all_seeds: list[SeedPrompt] = []
    
    core_topics = topic_graph.core_topics[:20]
    
    all_seeds.extend(_generate_definition_seeds(core_topics, site_context.brand_name))
    all_seeds.extend(_generate_best_of_seeds(core_topics, site_context.brand_name))
    all_seeds.extend(_generate_audience_seeds(core_topics, site_context.customer_types))
    all_seeds.extend(_generate_use_case_seeds(core_topics, site_context.use_cases))
    all_seeds.extend(_generate_pain_point_seeds(core_topics, site_context.pain_points))
    all_seeds.extend(_generate_comparison_seeds(
        site_context.brand_name,
        site_context.competitors,
        core_topics,
    ))
    all_seeds.extend(_generate_alternative_seeds(
        site_context.brand_name,
        site_context.competitors,
        core_topics,
    ))
    all_seeds.extend(_generate_feature_seeds(core_topics, site_context.features))
    all_seeds.extend(_generate_pricing_seeds(site_context.brand_name, core_topics))
    all_seeds.extend(
        _generate_trust_seeds(
            site_context.brand_name,
            site_context.brand_aliases,
            core_topics,
        )
    )
    all_seeds.extend(_generate_strategic_seeds(core_topics))
    all_seeds.extend(_generate_migration_seeds(
        site_context.brand_name,
        site_context.competitors,
    ))
    all_seeds.extend(_generate_local_seeds(
        core_topics,
        site_context.industries,
        site_context.locations,
    ))
    
    deduped = _dedupe_seeds(all_seeds)
    
    return deduped
