"""
Topic Graph Builder - Layer 2 of the prompt generation pipeline.

Builds a structured topic graph from the site context that maps:
- Core topics (main business focus)
- Supporting topics (related content)
- Adjacent topics (neighboring concepts)
- Transactional topics (buying/action oriented)
- Informational topics (educational content)
- Comparison topics (vs/alternative content)
- Problem topics (pain points and challenges)
- Feature topics (product/service features)
- Audience topics (customer segments)
- Location topics (geographic relevance)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .site_context_builder import SiteContext


@dataclass
class TopicGraph:
    """Structured topic graph derived from site context."""
    
    core_topics: list[str] = field(default_factory=list)
    supporting_topics: list[str] = field(default_factory=list)
    adjacent_topics: list[str] = field(default_factory=list)
    transactional_topics: list[str] = field(default_factory=list)
    informational_topics: list[str] = field(default_factory=list)
    comparison_topics: list[str] = field(default_factory=list)
    problem_topics: list[str] = field(default_factory=list)
    feature_topics: list[str] = field(default_factory=list)
    audience_topics: list[str] = field(default_factory=list)
    location_topics: list[str] = field(default_factory=list)
    competitor_topics: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "core_topics": self.core_topics,
            "supporting_topics": self.supporting_topics,
            "adjacent_topics": self.adjacent_topics,
            "transactional_topics": self.transactional_topics,
            "informational_topics": self.informational_topics,
            "comparison_topics": self.comparison_topics,
            "problem_topics": self.problem_topics,
            "feature_topics": self.feature_topics,
            "audience_topics": self.audience_topics,
            "location_topics": self.location_topics,
            "competitor_topics": self.competitor_topics,
        }

    def all_topics(self) -> list[str]:
        """Return all topics flattened."""
        all_topics: list[str] = []
        seen: set[str] = set()
        
        for topic_list in [
            self.core_topics,
            self.supporting_topics,
            self.adjacent_topics,
            self.transactional_topics,
            self.informational_topics,
            self.comparison_topics,
            self.problem_topics,
            self.feature_topics,
            self.audience_topics,
            self.location_topics,
            self.competitor_topics,
        ]:
            for topic in topic_list:
                key = topic.lower().strip()
                if key not in seen:
                    seen.add(key)
                    all_topics.append(topic)
        
        return all_topics

    def topic_count(self) -> int:
        """Return total unique topic count."""
        return len(self.all_topics())


def _normalize(text: str) -> str:
    """Normalize text for comparison."""
    return " ".join(text.lower().strip().split())


def _dedupe_list(items: list[str]) -> list[str]:
    """Remove duplicates preserving order."""
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        key = _normalize(item)
        if key and key not in seen:
            seen.add(key)
            result.append(item.strip())
    return result


def _generate_transactional_topics(
    brand_name: str,
    products: list[str],
    services: list[str],
    industries: list[str],
) -> list[str]:
    """Generate transactional/buying-intent topics."""
    topics: list[str] = []
    
    templates = [
        "buy {item}",
        "purchase {item}",
        "get {item}",
        "hire {item}",
        "book {item}",
        "{item} pricing",
        "{item} cost",
        "{item} quote",
        "best {item} to buy",
        "where to get {item}",
    ]
    
    items = products[:5] + services[:5]
    if not items:
        items = industries[:3]
    
    for item in items:
        for template in templates[:4]:
            topics.append(template.format(item=item))
    
    topics.append(f"hire {brand_name}")
    topics.append(f"{brand_name} pricing")
    
    return _dedupe_list(topics)[:20]


def _generate_informational_topics(
    core_topics: list[str],
    features: list[str],
    industries: list[str],
) -> list[str]:
    """Generate informational/educational topics."""
    topics: list[str] = []
    
    templates = [
        "what is {topic}",
        "how does {topic} work",
        "{topic} explained",
        "{topic} guide",
        "{topic} tutorial",
        "learn about {topic}",
        "{topic} basics",
        "{topic} best practices",
    ]
    
    items = core_topics[:8] + features[:5] + industries[:3]
    
    for item in items:
        for template in templates[:3]:
            topics.append(template.format(topic=item))
    
    return _dedupe_list(topics)[:25]


def _generate_comparison_topics(
    brand_name: str,
    competitors: list[str],
    products: list[str],
    services: list[str],
) -> list[str]:
    """Generate comparison/alternative topics."""
    topics: list[str] = []
    
    for competitor in competitors[:8]:
        topics.append(f"{brand_name} vs {competitor}")
        topics.append(f"{competitor} vs {brand_name}")
        topics.append(f"{brand_name} or {competitor}")
        topics.append(f"compare {brand_name} and {competitor}")
        topics.append(f"best alternative to {competitor}")
    
    topics.append(f"alternative to {brand_name}")
    topics.append(f"best alternative to {brand_name}")
    topics.append(f"{brand_name} competitors")
    topics.append(f"companies like {brand_name}")
    
    items = products[:3] + services[:3]
    for item in items:
        topics.append(f"best {item} comparison")
        topics.append(f"compare {item} options")
    
    return _dedupe_list(topics)[:40]


def _generate_problem_topics(
    pain_points: list[str],
    use_cases: list[str],
    industries: list[str],
) -> list[str]:
    """Generate problem/pain-point topics."""
    topics: list[str] = []
    
    for pain_point in pain_points[:10]:
        topics.append(f"how to solve {pain_point}")
        topics.append(f"fix {pain_point}")
        topics.append(f"best solution for {pain_point}")
    
    for use_case in use_cases[:8]:
        topics.append(f"best tool for {use_case}")
        topics.append(f"how to {use_case}")
    
    for industry in industries[:3]:
        topics.append(f"common {industry} problems")
        topics.append(f"{industry} challenges")
    
    return _dedupe_list(topics)[:25]


def _generate_feature_topics(
    features: list[str],
    products: list[str],
    services: list[str],
) -> list[str]:
    """Generate feature-focused topics."""
    topics: list[str] = []
    
    items = products[:5] + services[:5]
    
    for feature in features[:10]:
        topics.append(f"best {feature}")
        topics.append(f"{feature} software")
        topics.append(f"{feature} tool")
    
    for item in items:
        for feature in features[:5]:
            topics.append(f"{item} with {feature}")
    
    return _dedupe_list(topics)[:25]


def _generate_audience_topics(
    customer_types: list[str],
    products: list[str],
    services: list[str],
    industries: list[str],
) -> list[str]:
    """Generate audience-specific topics."""
    topics: list[str] = []
    
    items = products[:4] + services[:4]
    if not items:
        items = industries[:3]
    
    for audience in customer_types[:10]:
        topics.append(f"best for {audience}")
        topics.append(f"{audience} solutions")
        for item in items[:3]:
            topics.append(f"best {item} for {audience}")
    
    return _dedupe_list(topics)[:25]


def _generate_location_topics(
    locations: list[str],
    products: list[str],
    services: list[str],
    industries: list[str],
) -> list[str]:
    """Generate location-specific topics."""
    topics: list[str] = []
    
    items = services[:4] + products[:2]
    if not items:
        items = industries[:3]
    
    for location in locations[:8]:
        for item in items[:3]:
            topics.append(f"best {item} in {location}")
            topics.append(f"{item} near {location}")
            topics.append(f"{item} {location}")
    
    return _dedupe_list(topics)[:20]


def _generate_adjacent_topics(
    core_topics: list[str],
    industries: list[str],
    keywords: list[str],
) -> list[str]:
    """Generate adjacent/related topics."""
    topics: list[str] = []
    
    adjacent_patterns = [
        "{topic} trends",
        "{topic} statistics",
        "{topic} industry",
        "{topic} market",
        "future of {topic}",
        "{topic} news",
        "{topic} updates",
    ]
    
    items = core_topics[:5] + industries[:3]
    
    for item in items:
        for pattern in adjacent_patterns[:3]:
            topics.append(pattern.format(topic=item))
    
    for keyword in keywords[:15]:
        if len(keyword) > 4:
            topics.append(keyword)
    
    return _dedupe_list(topics)[:20]


def _generate_competitor_topics(
    brand_name: str,
    competitors: list[str],
    industries: list[str],
) -> list[str]:
    """Generate competitor-focused topics."""
    topics: list[str] = []
    
    for competitor in competitors[:10]:
        topics.append(f"{competitor} review")
        topics.append(f"{competitor} pricing")
        topics.append(f"{competitor} features")
        topics.append(f"is {competitor} good")
        topics.append(f"{competitor} alternatives")
        topics.append(f"who competes with {competitor}")
    
    topics.append(f"top {brand_name} competitors")
    topics.append(f"companies competing with {brand_name}")
    
    for industry in industries[:2]:
        topics.append(f"top {industry} companies")
        topics.append(f"best {industry} providers")
    
    return _dedupe_list(topics)[:30]


def build_topic_graph(site_context: "SiteContext") -> TopicGraph:
    """
    Build a comprehensive topic graph from site context.
    
    This is Layer 2 of the prompt generation pipeline.
    """
    core_topics = _dedupe_list(
        [site_context.brand_name]
        + site_context.brand_aliases[:3]
        + site_context.core_topics
        + site_context.products[:5]
        + site_context.services[:5]
    )[:25]
    
    supporting_topics = _dedupe_list(
        site_context.supporting_topics
        + site_context.features[:10]
        + site_context.keywords[:10]
    )[:40]
    
    transactional_topics = _generate_transactional_topics(
        site_context.brand_name,
        site_context.products,
        site_context.services,
        site_context.industries,
    )
    
    informational_topics = _generate_informational_topics(
        site_context.core_topics,
        site_context.features,
        site_context.industries,
    )
    
    comparison_topics = _generate_comparison_topics(
        site_context.brand_name,
        site_context.competitors,
        site_context.products,
        site_context.services,
    )
    
    problem_topics = _generate_problem_topics(
        site_context.pain_points,
        site_context.use_cases,
        site_context.industries,
    )
    
    feature_topics = _generate_feature_topics(
        site_context.features,
        site_context.products,
        site_context.services,
    )
    
    audience_topics = _generate_audience_topics(
        site_context.customer_types,
        site_context.products,
        site_context.services,
        site_context.industries,
    )
    
    location_topics = _generate_location_topics(
        site_context.locations,
        site_context.products,
        site_context.services,
        site_context.industries,
    )
    
    adjacent_topics = _generate_adjacent_topics(
        site_context.core_topics,
        site_context.industries,
        site_context.keywords,
    )
    
    competitor_topics = _generate_competitor_topics(
        site_context.brand_name,
        site_context.competitors,
        site_context.industries,
    )
    
    return TopicGraph(
        core_topics=core_topics,
        supporting_topics=supporting_topics,
        adjacent_topics=adjacent_topics,
        transactional_topics=transactional_topics,
        informational_topics=informational_topics,
        comparison_topics=comparison_topics,
        problem_topics=problem_topics,
        feature_topics=feature_topics,
        audience_topics=audience_topics,
        location_topics=location_topics,
        competitor_topics=competitor_topics,
    )
