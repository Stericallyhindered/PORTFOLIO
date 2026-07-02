"""
Intent Graph Builder - Layer 3 of the prompt generation pipeline.

Maps user intent patterns across topics to model how users ask AI questions.
Each topic is expanded across multiple intent families:
- Informational
- Commercial investigation
- Transactional
- Comparison
- Alternatives
- Problem-solving
- Best-of / ranking
- Recommendation
- Troubleshooting
- Local / industry-specific
- Audience-specific
- Feature-specific
- Price / value
- Trust / credibility
- Integration / compatibility
- Migration / switching
- Brand-specific
- Competitor-specific
- Education / definitions
- Strategic / consultative
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .topic_graph_builder import TopicGraph
    from .site_context_builder import SiteContext


class PromptIntent(str, Enum):
    """Prompt intent classification."""
    
    INFORMATIONAL = "informational"
    COMMERCIAL = "commercial"
    TRANSACTIONAL = "transactional"
    COMPARISON = "comparison"
    ALTERNATIVES = "alternatives"
    PROBLEM_SOLVING = "problem_solving"
    BEST_OF = "best_of"
    RECOMMENDATION = "recommendation"
    TROUBLESHOOTING = "troubleshooting"
    LOCAL = "local"
    AUDIENCE_SPECIFIC = "audience_specific"
    FEATURE_SPECIFIC = "feature_specific"
    PRICING = "pricing"
    TRUST = "trust"
    INTEGRATION = "integration"
    MIGRATION = "migration"
    BRAND_SPECIFIC = "brand_specific"
    COMPETITOR_SPECIFIC = "competitor_specific"
    DEFINITION = "definition"
    STRATEGIC = "strategic"


class FunnelStage(str, Enum):
    """Buyer funnel stage classification."""
    
    AWARENESS = "awareness"
    CONSIDERATION = "consideration"
    EVALUATION = "evaluation"
    DECISION = "decision"
    IMPLEMENTATION = "implementation"
    POST_PURCHASE = "post_purchase"


@dataclass
class IntentPrompt:
    """A prompt with intent and funnel stage classification."""
    
    text: str
    intent: PromptIntent
    funnel_stage: FunnelStage
    topic: str
    audience: str | None = None
    use_case: str | None = None
    competitor: str | None = None


@dataclass
class TopicIntentMap:
    """Intent map for a single topic."""
    
    topic: str
    intents: dict[PromptIntent, list[str]] = field(default_factory=dict)

    def all_prompts(self) -> list[IntentPrompt]:
        """Get all prompts with intent classification."""
        result: list[IntentPrompt] = []
        for intent, prompts in self.intents.items():
            funnel = _intent_to_funnel(intent)
            for prompt in prompts:
                result.append(IntentPrompt(
                    text=prompt,
                    intent=intent,
                    funnel_stage=funnel,
                    topic=self.topic,
                ))
        return result


@dataclass
class IntentGraph:
    """Complete intent graph across all topics."""
    
    topic_maps: list[TopicIntentMap] = field(default_factory=list)
    brand_name: str = ""
    competitors: list[str] = field(default_factory=list)
    audiences: list[str] = field(default_factory=list)
    use_cases: list[str] = field(default_factory=list)

    def all_prompts(self) -> list[IntentPrompt]:
        """Get all prompts from all topic maps."""
        result: list[IntentPrompt] = []
        for topic_map in self.topic_maps:
            result.extend(topic_map.all_prompts())
        return result

    def prompts_by_intent(self, intent: PromptIntent) -> list[IntentPrompt]:
        """Get prompts filtered by intent."""
        return [p for p in self.all_prompts() if p.intent == intent]

    def prompts_by_funnel(self, stage: FunnelStage) -> list[IntentPrompt]:
        """Get prompts filtered by funnel stage."""
        return [p for p in self.all_prompts() if p.funnel_stage == stage]

    def to_dict(self) -> dict:
        return {
            "brand_name": self.brand_name,
            "competitors": self.competitors,
            "audiences": self.audiences,
            "use_cases": self.use_cases,
            "topic_count": len(self.topic_maps),
            "total_prompts": len(self.all_prompts()),
        }


def _intent_to_funnel(intent: PromptIntent) -> FunnelStage:
    """Map intent to funnel stage."""
    mapping = {
        PromptIntent.INFORMATIONAL: FunnelStage.AWARENESS,
        PromptIntent.DEFINITION: FunnelStage.AWARENESS,
        PromptIntent.COMMERCIAL: FunnelStage.CONSIDERATION,
        PromptIntent.BEST_OF: FunnelStage.CONSIDERATION,
        PromptIntent.RECOMMENDATION: FunnelStage.CONSIDERATION,
        PromptIntent.COMPARISON: FunnelStage.EVALUATION,
        PromptIntent.ALTERNATIVES: FunnelStage.EVALUATION,
        PromptIntent.COMPETITOR_SPECIFIC: FunnelStage.EVALUATION,
        PromptIntent.PRICING: FunnelStage.EVALUATION,
        PromptIntent.TRUST: FunnelStage.EVALUATION,
        PromptIntent.TRANSACTIONAL: FunnelStage.DECISION,
        PromptIntent.BRAND_SPECIFIC: FunnelStage.DECISION,
        PromptIntent.INTEGRATION: FunnelStage.IMPLEMENTATION,
        PromptIntent.MIGRATION: FunnelStage.IMPLEMENTATION,
        PromptIntent.TROUBLESHOOTING: FunnelStage.POST_PURCHASE,
        PromptIntent.PROBLEM_SOLVING: FunnelStage.CONSIDERATION,
        PromptIntent.LOCAL: FunnelStage.CONSIDERATION,
        PromptIntent.AUDIENCE_SPECIFIC: FunnelStage.CONSIDERATION,
        PromptIntent.FEATURE_SPECIFIC: FunnelStage.EVALUATION,
        PromptIntent.STRATEGIC: FunnelStage.AWARENESS,
    }
    return mapping.get(intent, FunnelStage.AWARENESS)


def _generate_informational_prompts(topic: str) -> list[str]:
    """Generate informational intent prompts."""
    return [
        f"what is {topic}",
        f"how does {topic} work",
        f"explain {topic}",
        f"{topic} overview",
        f"introduction to {topic}",
        f"learn about {topic}",
        f"{topic} basics",
        f"understanding {topic}",
    ]


def _generate_definition_prompts(topic: str) -> list[str]:
    """Generate definition/educational prompts."""
    return [
        f"define {topic}",
        f"what does {topic} mean",
        f"{topic} definition",
        f"meaning of {topic}",
        f"what is {topic} in simple terms",
    ]


def _generate_commercial_prompts(topic: str) -> list[str]:
    """Generate commercial investigation prompts."""
    return [
        f"best {topic}",
        f"top {topic}",
        f"recommended {topic}",
        f"most popular {topic}",
        f"leading {topic}",
        f"{topic} reviews",
        f"best {topic} software",
        f"best {topic} tools",
        f"best {topic} platforms",
        f"best {topic} services",
    ]


def _generate_comparison_prompts(topic: str, brand: str, competitors: list[str]) -> list[str]:
    """Generate comparison prompts."""
    prompts = [
        f"{topic} comparison",
        f"compare {topic} options",
        f"best {topic} vs alternatives",
    ]
    
    for competitor in competitors[:5]:
        prompts.append(f"{brand} vs {competitor} for {topic}")
        prompts.append(f"{competitor} vs {brand}")
        prompts.append(f"compare {brand} and {competitor}")
    
    return prompts


def _generate_alternatives_prompts(topic: str, brand: str, competitors: list[str]) -> list[str]:
    """Generate alternatives prompts."""
    prompts = [
        f"alternative to {topic}",
        f"best alternative to {topic}",
        f"{topic} alternatives",
        f"alternatives to {brand}",
        f"best alternative to {brand}",
        f"companies like {brand}",
        f"similar to {brand}",
    ]
    
    for competitor in competitors[:3]:
        prompts.append(f"alternative to {competitor}")
        prompts.append(f"best alternative to {competitor}")
    
    return prompts


def _generate_problem_solving_prompts(topic: str) -> list[str]:
    """Generate problem-solving prompts."""
    return [
        f"how to solve {topic}",
        f"fix {topic} issues",
        f"troubleshoot {topic}",
        f"{topic} problems and solutions",
        f"common {topic} issues",
        f"how to improve {topic}",
        f"best way to handle {topic}",
        f"solutions for {topic}",
    ]


def _generate_best_of_prompts(topic: str) -> list[str]:
    """Generate best-of/ranking prompts."""
    return [
        f"best {topic}",
        f"top {topic}",
        f"top 10 {topic}",
        f"best {topic} 2024",
        f"best {topic} 2025",
        f"most trusted {topic}",
        f"highest rated {topic}",
        f"#1 {topic}",
    ]


def _generate_recommendation_prompts(topic: str) -> list[str]:
    """Generate recommendation prompts."""
    return [
        f"recommend a {topic}",
        f"what {topic} should I use",
        f"which {topic} is best",
        f"suggest a {topic}",
        f"what {topic} do you recommend",
        f"help me choose a {topic}",
    ]


def _generate_pricing_prompts(topic: str, brand: str) -> list[str]:
    """Generate pricing/value prompts."""
    return [
        f"{topic} pricing",
        f"{topic} cost",
        f"how much does {topic} cost",
        f"affordable {topic}",
        f"cheap {topic}",
        f"best value {topic}",
        f"{brand} pricing",
        f"is {brand} worth it",
        f"{topic} free vs paid",
    ]


def _generate_trust_prompts(topic: str, brand: str) -> list[str]:
    """Generate trust/credibility prompts."""
    return [
        f"is {brand} legit",
        f"is {brand} trustworthy",
        f"can I trust {brand}",
        f"{brand} reviews",
        f"{brand} reputation",
        f"is {topic} reliable",
        f"most trusted {topic}",
        f"{brand} customer reviews",
    ]


def _generate_audience_prompts(topic: str, audiences: list[str]) -> list[str]:
    """Generate audience-specific prompts."""
    prompts: list[str] = []
    
    for audience in audiences[:8]:
        prompts.append(f"best {topic} for {audience}")
        prompts.append(f"{topic} for {audience}")
        prompts.append(f"recommended {topic} for {audience}")
    
    return prompts


def _generate_feature_prompts(topic: str, features: list[str]) -> list[str]:
    """Generate feature-specific prompts."""
    prompts: list[str] = []
    
    for feature in features[:6]:
        prompts.append(f"best {topic} with {feature}")
        prompts.append(f"{topic} that has {feature}")
        prompts.append(f"{topic} {feature}")
    
    return prompts


def _generate_local_prompts(topic: str, locations: list[str]) -> list[str]:
    """Generate local/geographic prompts."""
    prompts: list[str] = []
    
    for location in locations[:5]:
        prompts.append(f"best {topic} in {location}")
        prompts.append(f"{topic} near {location}")
        prompts.append(f"{topic} {location}")
        prompts.append(f"top {topic} in {location}")
    
    return prompts


def _generate_brand_prompts(brand: str, topic: str) -> list[str]:
    """Generate brand-specific prompts."""
    return [
        f"{brand} {topic}",
        f"is {brand} good for {topic}",
        f"{brand} features",
        f"{brand} benefits",
        f"why choose {brand}",
        f"what makes {brand} different",
        f"{brand} pros and cons",
    ]


def _generate_competitor_prompts(brand: str, competitors: list[str]) -> list[str]:
    """Generate competitor-specific prompts."""
    prompts: list[str] = []
    
    for competitor in competitors[:8]:
        prompts.append(f"is {competitor} better than {brand}")
        prompts.append(f"{competitor} review")
        prompts.append(f"{competitor} pricing")
        prompts.append(f"who competes with {competitor}")
        prompts.append(f"top competitors to {competitor}")
    
    return prompts


def _generate_migration_prompts(brand: str, competitors: list[str]) -> list[str]:
    """Generate migration/switching prompts."""
    prompts = [
        f"how to switch to {brand}",
        f"migrate to {brand}",
        f"moving to {brand}",
    ]
    
    for competitor in competitors[:4]:
        prompts.append(f"how to move from {competitor} to {brand}")
        prompts.append(f"switch from {competitor}")
        prompts.append(f"migrate from {competitor}")
    
    return prompts


def _generate_strategic_prompts(topic: str) -> list[str]:
    """Generate strategic/consultative prompts."""
    return [
        f"how should I choose a {topic}",
        f"what should I look for in a {topic}",
        f"{topic} buying guide",
        f"{topic} selection criteria",
        f"how to evaluate {topic}",
        f"{topic} decision framework",
    ]


def _build_topic_intent_map(
    topic: str,
    brand_name: str,
    competitors: list[str],
    audiences: list[str],
    features: list[str],
    locations: list[str],
) -> TopicIntentMap:
    """Build intent map for a single topic."""
    intent_map = TopicIntentMap(topic=topic)
    
    intent_map.intents[PromptIntent.INFORMATIONAL] = _generate_informational_prompts(topic)
    intent_map.intents[PromptIntent.DEFINITION] = _generate_definition_prompts(topic)
    intent_map.intents[PromptIntent.COMMERCIAL] = _generate_commercial_prompts(topic)
    intent_map.intents[PromptIntent.COMPARISON] = _generate_comparison_prompts(topic, brand_name, competitors)
    intent_map.intents[PromptIntent.ALTERNATIVES] = _generate_alternatives_prompts(topic, brand_name, competitors)
    intent_map.intents[PromptIntent.PROBLEM_SOLVING] = _generate_problem_solving_prompts(topic)
    intent_map.intents[PromptIntent.BEST_OF] = _generate_best_of_prompts(topic)
    intent_map.intents[PromptIntent.RECOMMENDATION] = _generate_recommendation_prompts(topic)
    intent_map.intents[PromptIntent.PRICING] = _generate_pricing_prompts(topic, brand_name)
    intent_map.intents[PromptIntent.TRUST] = _generate_trust_prompts(topic, brand_name)
    intent_map.intents[PromptIntent.AUDIENCE_SPECIFIC] = _generate_audience_prompts(topic, audiences)
    intent_map.intents[PromptIntent.FEATURE_SPECIFIC] = _generate_feature_prompts(topic, features)
    intent_map.intents[PromptIntent.LOCAL] = _generate_local_prompts(topic, locations)
    intent_map.intents[PromptIntent.BRAND_SPECIFIC] = _generate_brand_prompts(brand_name, topic)
    intent_map.intents[PromptIntent.COMPETITOR_SPECIFIC] = _generate_competitor_prompts(brand_name, competitors)
    intent_map.intents[PromptIntent.MIGRATION] = _generate_migration_prompts(brand_name, competitors)
    intent_map.intents[PromptIntent.STRATEGIC] = _generate_strategic_prompts(topic)
    
    return intent_map


def build_intent_graph(
    topic_graph: "TopicGraph",
    site_context: "SiteContext",
) -> IntentGraph:
    """
    Build a comprehensive intent graph from topic graph and site context.
    
    This is Layer 3 of the prompt generation pipeline.
    """
    intent_graph = IntentGraph(
        brand_name=site_context.brand_name,
        competitors=site_context.competitors,
        audiences=site_context.customer_types,
        use_cases=site_context.use_cases,
    )
    
    priority_topics = (
        topic_graph.core_topics[:15]
        + topic_graph.comparison_topics[:10]
        + topic_graph.problem_topics[:8]
        + topic_graph.feature_topics[:8]
    )
    
    seen_topics: set[str] = set()
    unique_topics: list[str] = []
    for topic in priority_topics:
        key = topic.lower().strip()
        if key not in seen_topics:
            seen_topics.add(key)
            unique_topics.append(topic)
    
    for topic in unique_topics[:40]:
        topic_map = _build_topic_intent_map(
            topic=topic,
            brand_name=site_context.brand_name,
            competitors=site_context.competitors,
            audiences=site_context.customer_types,
            features=site_context.features,
            locations=site_context.locations,
        )
        intent_graph.topic_maps.append(topic_map)
    
    return intent_graph
