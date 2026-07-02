"""
Prompt Expansion Engine - Layer 5 of the prompt generation pipeline.

Expands seed prompts into thousands of prompts through:
- Combinatorial expansion (audience, use-case, pain-point, feature, competitor)
- Semantic expansion (adjacent concepts, neighboring phrases)
- Style/phrasing variants (short query, natural question, consultative)
- Geographic/vertical modifiers
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING
from uuid import uuid4

if TYPE_CHECKING:
    from .seed_prompt_generator import SeedPrompt
    from .site_context_builder import SiteContext


@dataclass
class ExpandedPrompt:
    """An expanded prompt with full metadata."""
    
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
    source_layer: str = "expansion"
    source_reason: str | None = None
    semantic_cluster_id: str | None = None
    quality_score: float | None = None
    priority_tier: int = 2
    parent_seed_id: str | None = None

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
            "parent_seed_id": self.parent_seed_id,
        }


AUDIENCE_MODIFIERS = [
    "for small business",
    "for enterprise",
    "for startups",
    "for agencies",
    "for beginners",
    "for professionals",
    "for teams",
    "for individuals",
    "for developers",
    "for marketers",
    "for ecommerce",
    "for SaaS",
]

USE_CASE_MODIFIERS = [
    "for lead generation",
    "for brand monitoring",
    "for content marketing",
    "for SEO",
    "for analytics",
    "for automation",
    "for reporting",
    "for collaboration",
    "for project management",
    "for customer support",
]

PRICE_MODIFIERS = [
    "affordable",
    "cheap",
    "free",
    "budget",
    "premium",
    "enterprise-grade",
    "best value",
]

STYLE_VARIANTS = {
    "short_query": [
        "{base}",
        "best {base}",
        "top {base}",
    ],
    "natural_question": [
        "what is the best {base}",
        "which {base} should I choose",
        "what {base} do you recommend",
        "can you recommend a {base}",
    ],
    "consultative": [
        "I need {base}",
        "help me find {base}",
        "looking for {base}",
        "searching for {base}",
    ],
    "comparison": [
        "{base} comparison",
        "compare {base}",
        "{base} vs alternatives",
    ],
    "scenario": [
        "best {base} for my needs",
        "{base} for a small team",
        "{base} with limited budget",
    ],
}

SEMANTIC_NEIGHBORS = {
    "software": ["tool", "platform", "solution", "app", "application", "system"],
    "service": ["provider", "agency", "company", "firm", "consultant"],
    "best": ["top", "leading", "recommended", "popular", "trusted"],
    "alternative": ["replacement", "substitute", "option", "competitor"],
    "comparison": ["vs", "versus", "compared to", "or"],
    "review": ["rating", "feedback", "testimonial", "opinion"],
    "pricing": ["cost", "price", "fee", "rate", "subscription"],
    "feature": ["capability", "function", "tool", "option"],
}


def _normalize(text: str) -> str:
    """Normalize text for deduplication."""
    return " ".join(text.lower().strip().split())


def _expand_by_audience(
    seed: "SeedPrompt",
    audiences: list[str],
) -> list[ExpandedPrompt]:
    """Expand seed by audience modifiers."""
    expanded: list[ExpandedPrompt] = []
    
    all_audiences = list(set(audiences[:8] + AUDIENCE_MODIFIERS[:6]))
    
    for audience in all_audiences[:12]:
        if seed.audience and _normalize(seed.audience) == _normalize(audience):
            continue
        
        new_text = f"{seed.text} {audience}"
        expanded.append(ExpandedPrompt(
            text=new_text,
            topic=seed.topic,
            subtopic=seed.subtopic,
            intent=seed.intent,
            funnel_stage=seed.funnel_stage,
            audience=audience,
            use_case=seed.use_case,
            pain_point=seed.pain_point,
            feature=seed.feature,
            competitor=seed.competitor,
            source_layer="audience_expansion",
            source_reason=f"audience expansion: {audience}",
            parent_seed_id=seed.id,
        ))
    
    return expanded


def _expand_by_use_case(
    seed: "SeedPrompt",
    use_cases: list[str],
) -> list[ExpandedPrompt]:
    """Expand seed by use-case modifiers."""
    expanded: list[ExpandedPrompt] = []
    
    all_use_cases = list(set(use_cases[:8] + USE_CASE_MODIFIERS[:6]))
    
    for use_case in all_use_cases[:12]:
        if seed.use_case and _normalize(seed.use_case) == _normalize(use_case):
            continue
        
        new_text = f"{seed.text} {use_case}"
        expanded.append(ExpandedPrompt(
            text=new_text,
            topic=seed.topic,
            subtopic=seed.subtopic,
            intent=seed.intent,
            funnel_stage=seed.funnel_stage,
            audience=seed.audience,
            use_case=use_case,
            pain_point=seed.pain_point,
            feature=seed.feature,
            competitor=seed.competitor,
            source_layer="use_case_expansion",
            source_reason=f"use-case expansion: {use_case}",
            parent_seed_id=seed.id,
        ))
    
    return expanded


def _expand_by_feature(
    seed: "SeedPrompt",
    features: list[str],
) -> list[ExpandedPrompt]:
    """Expand seed by feature modifiers."""
    expanded: list[ExpandedPrompt] = []
    
    for feature in features[:10]:
        if seed.feature and _normalize(seed.feature) == _normalize(feature):
            continue
        
        new_text = f"{seed.text} with {feature}"
        expanded.append(ExpandedPrompt(
            text=new_text,
            topic=seed.topic,
            subtopic=seed.subtopic,
            intent=seed.intent,
            funnel_stage=seed.funnel_stage,
            audience=seed.audience,
            use_case=seed.use_case,
            pain_point=seed.pain_point,
            feature=feature,
            competitor=seed.competitor,
            source_layer="feature_expansion",
            source_reason=f"feature expansion: {feature}",
            parent_seed_id=seed.id,
        ))
    
    return expanded


def _expand_by_competitor(
    seed: "SeedPrompt",
    brand_name: str,
    competitors: list[str],
) -> list[ExpandedPrompt]:
    """Expand seed by competitor comparisons."""
    expanded: list[ExpandedPrompt] = []
    
    for competitor in competitors[:10]:
        if seed.competitor and _normalize(seed.competitor) == _normalize(competitor):
            continue
        
        expanded.append(ExpandedPrompt(
            text=f"{brand_name} vs {competitor}",
            topic=brand_name,
            intent="comparison",
            funnel_stage="evaluation",
            competitor=competitor,
            source_layer="competitor_expansion",
            source_reason=f"competitor comparison: {competitor}",
            parent_seed_id=seed.id,
            priority_tier=1,
        ))
        
        expanded.append(ExpandedPrompt(
            text=f"best alternative to {competitor}",
            topic=competitor,
            intent="alternatives",
            funnel_stage="evaluation",
            competitor=competitor,
            source_layer="competitor_expansion",
            source_reason=f"competitor alternative: {competitor}",
            parent_seed_id=seed.id,
        ))
        
        if seed.audience:
            expanded.append(ExpandedPrompt(
                text=f"{brand_name} vs {competitor} for {seed.audience}",
                topic=brand_name,
                intent="comparison",
                funnel_stage="evaluation",
                audience=seed.audience,
                competitor=competitor,
                source_layer="competitor_expansion",
                source_reason=f"competitor + audience: {competitor} for {seed.audience}",
                parent_seed_id=seed.id,
            ))
    
    return expanded


def _expand_by_style(
    seed: "SeedPrompt",
) -> list[ExpandedPrompt]:
    """Expand seed by phrasing style variants."""
    expanded: list[ExpandedPrompt] = []
    
    base = seed.text
    if base.startswith("best "):
        base = base[5:]
    elif base.startswith("top "):
        base = base[4:]
    
    for style_name, templates in STYLE_VARIANTS.items():
        for template in templates[:2]:
            new_text = template.format(base=base)
            if _normalize(new_text) == _normalize(seed.text):
                continue
            
            expanded.append(ExpandedPrompt(
                text=new_text,
                topic=seed.topic,
                subtopic=seed.subtopic,
                intent=seed.intent,
                funnel_stage=seed.funnel_stage,
                audience=seed.audience,
                use_case=seed.use_case,
                pain_point=seed.pain_point,
                feature=seed.feature,
                competitor=seed.competitor,
                source_layer=f"style_expansion_{style_name}",
                source_reason=f"style variant: {style_name}",
                parent_seed_id=seed.id,
            ))
    
    return expanded


def _expand_semantically(
    seed: "SeedPrompt",
) -> list[ExpandedPrompt]:
    """Expand seed using semantic neighbors."""
    expanded: list[ExpandedPrompt] = []
    
    text_lower = seed.text.lower()
    
    for word, neighbors in SEMANTIC_NEIGHBORS.items():
        if word in text_lower:
            for neighbor in neighbors[:2]:
                new_text = seed.text.lower().replace(word, neighbor)
                if new_text != seed.text.lower():
                    expanded.append(ExpandedPrompt(
                        text=new_text,
                        topic=seed.topic,
                        subtopic=seed.subtopic,
                        intent=seed.intent,
                        funnel_stage=seed.funnel_stage,
                        audience=seed.audience,
                        use_case=seed.use_case,
                        pain_point=seed.pain_point,
                        feature=seed.feature,
                        competitor=seed.competitor,
                        source_layer="semantic_expansion",
                        source_reason=f"semantic neighbor: {word} -> {neighbor}",
                        parent_seed_id=seed.id,
                    ))
    
    return expanded


def _expand_by_price(
    seed: "SeedPrompt",
) -> list[ExpandedPrompt]:
    """Expand seed by price/value modifiers."""
    expanded: list[ExpandedPrompt] = []
    
    for modifier in PRICE_MODIFIERS[:5]:
        if modifier in seed.text.lower():
            continue
        
        if seed.text.lower().startswith("best "):
            new_text = f"best {modifier} {seed.text[5:]}"
        else:
            new_text = f"{modifier} {seed.text}"
        
        expanded.append(ExpandedPrompt(
            text=new_text,
            topic=seed.topic,
            subtopic=seed.subtopic,
            intent="pricing",
            funnel_stage="evaluation",
            audience=seed.audience,
            use_case=seed.use_case,
            pain_point=seed.pain_point,
            feature=seed.feature,
            competitor=seed.competitor,
            source_layer="price_expansion",
            source_reason=f"price modifier: {modifier}",
            parent_seed_id=seed.id,
        ))
    
    return expanded


def _expand_by_location(
    seed: "SeedPrompt",
    locations: list[str],
) -> list[ExpandedPrompt]:
    """Expand seed by geographic modifiers."""
    expanded: list[ExpandedPrompt] = []
    
    for location in locations[:6]:
        new_text = f"{seed.text} in {location}"
        expanded.append(ExpandedPrompt(
            text=new_text,
            topic=seed.topic,
            subtopic=seed.subtopic,
            intent="local",
            funnel_stage=seed.funnel_stage,
            audience=seed.audience,
            use_case=seed.use_case,
            pain_point=seed.pain_point,
            feature=seed.feature,
            competitor=seed.competitor,
            source_layer="location_expansion",
            source_reason=f"location: {location}",
            parent_seed_id=seed.id,
        ))
    
    return expanded


def expand_prompts(
    seeds: list["SeedPrompt"],
    site_context: "SiteContext",
    target_tier: str = "core",
) -> list[ExpandedPrompt]:
    """
    Expand seed prompts into thousands of prompts.
    
    This is Layer 5 of the prompt generation pipeline.
    
    Target counts by tier:
    - core: ~500-1000 prompts
    - expanded: ~2000-3000 prompts
    - deep: ~10000+ prompts
    """
    all_expanded: list[ExpandedPrompt] = []
    
    seed_prompts_as_expanded = [
        ExpandedPrompt(
            id=seed.id,
            text=seed.text,
            topic=seed.topic,
            subtopic=seed.subtopic,
            intent=seed.intent,
            funnel_stage=seed.funnel_stage,
            audience=seed.audience,
            use_case=seed.use_case,
            pain_point=seed.pain_point,
            feature=seed.feature,
            competitor=seed.competitor,
            source_layer=seed.source_layer,
            source_reason=seed.source_reason,
            quality_score=seed.quality_score,
            priority_tier=seed.priority_tier,
        )
        for seed in seeds
    ]
    all_expanded.extend(seed_prompts_as_expanded)
    
    expansion_limits = {
        "core": {"audience": 4, "use_case": 3, "feature": 3, "competitor": 5, "style": 2, "semantic": 2, "price": 2, "location": 2},
        "expanded": {"audience": 8, "use_case": 6, "feature": 5, "competitor": 8, "style": 3, "semantic": 3, "price": 3, "location": 4},
        "deep": {"audience": 12, "use_case": 10, "feature": 8, "competitor": 10, "style": 4, "semantic": 4, "price": 4, "location": 6},
    }
    limits = expansion_limits.get(target_tier, expansion_limits["core"])
    
    high_value_seeds = [s for s in seeds if s.priority_tier == 1][:100]
    medium_seeds = [s for s in seeds if s.priority_tier == 2][:200]
    
    for seed in high_value_seeds:
        all_expanded.extend(_expand_by_audience(seed, site_context.customer_types)[:limits["audience"]])
        all_expanded.extend(_expand_by_use_case(seed, site_context.use_cases)[:limits["use_case"]])
        all_expanded.extend(_expand_by_feature(seed, site_context.features)[:limits["feature"]])
        all_expanded.extend(_expand_by_competitor(seed, site_context.brand_name, site_context.competitors)[:limits["competitor"]])
        all_expanded.extend(_expand_by_style(seed)[:limits["style"]])
        all_expanded.extend(_expand_semantically(seed)[:limits["semantic"]])
        all_expanded.extend(_expand_by_price(seed)[:limits["price"]])
        all_expanded.extend(_expand_by_location(seed, site_context.locations)[:limits["location"]])
    
    for seed in medium_seeds:
        all_expanded.extend(_expand_by_audience(seed, site_context.customer_types)[:limits["audience"] // 2])
        all_expanded.extend(_expand_by_use_case(seed, site_context.use_cases)[:limits["use_case"] // 2])
        all_expanded.extend(_expand_by_competitor(seed, site_context.brand_name, site_context.competitors)[:limits["competitor"] // 2])
        all_expanded.extend(_expand_by_style(seed)[:limits["style"]])
    
    if target_tier in ("expanded", "deep"):
        remaining_seeds = [s for s in seeds if s not in high_value_seeds and s not in medium_seeds]
        for seed in remaining_seeds[:150]:
            all_expanded.extend(_expand_by_audience(seed, site_context.customer_types)[:3])
            all_expanded.extend(_expand_by_style(seed)[:2])
    
    if target_tier == "deep":
        for seed in seeds[:300]:
            all_expanded.extend(_expand_by_location(seed, site_context.locations)[:4])
            all_expanded.extend(_expand_semantically(seed)[:3])
            all_expanded.extend(_expand_by_price(seed)[:2])
    
    return all_expanded
