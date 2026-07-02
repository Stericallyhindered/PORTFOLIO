from __future__ import annotations

from collections import defaultdict

from app.schemas.geo import PromptClusterGenerateIn, PromptClusterOut


INTENT_TYPES = [
    "informational",
    "commercial",
    "comparison",
    "alternatives",
    "best-for",
    "how-to",
    "troubleshooting",
    "navigational",
    "long-tail-conversational",
    "follow-up",
]

BENCHMARK_CLUSTER_TEMPLATES = [
    (
        "benchmark-category-discovery",
        "informational",
        "category-discovery",
        [
            "what is generative engine optimization",
            "how does GEO differ from SEO",
            "how do brands improve visibility in ai answers",
        ],
    ),
    (
        "benchmark-commercial-recommendations",
        "commercial",
        "commercial-recommendations",
        [
            "best GEO platforms for {industry}",
            "top alternatives to {brand}",
            "best ai search optimization agency for small business",
        ],
    ),
    (
        "benchmark-comparison-alternatives",
        "comparison",
        "comparison-alternatives",
        [
            "{brand} vs competitors for GEO",
            "best alternative to {brand}",
            "which GEO tool is best for multi-location businesses",
        ],
    ),
    (
        "benchmark-use-case-constraints",
        "best-for",
        "use-case-constraints",
        [
            "best GEO platform for {industry} under limited budget",
            "how to improve ai citations for a {industry} website",
            "best GEO solution for small teams",
        ],
    ),
    (
        "benchmark-local-provider-intent",
        "commercial",
        "local-provider-intent",
        [
            "best {industry} provider in {region}",
            "top {industry} companies near {region}",
            "who is most recommended for {industry} in {region}",
        ],
    ),
    (
        "benchmark-trust-validation",
        "informational",
        "trust-validation",
        [
            "is {brand} trustworthy for {industry}",
            "reviews of {brand} for {industry}",
            "who are credible experts in {industry}",
        ],
    ),
    (
        "benchmark-citation-pressure",
        "informational",
        "citation-pressure",
        [
            "what sources support leading {industry} providers",
            "cite the best references for {industry}",
            "which companies are most cited for {industry}",
        ],
    ),
    (
        "benchmark-transactional-decision",
        "commercial",
        "transactional-decision",
        [
            "who should i hire for {industry}",
            "what is the best option for {industry} buying decisions",
            "compare pricing and value for {industry} providers",
        ],
    ),
]


def _dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for value in values:
        key = " ".join(value.lower().split())
        if key in seen:
            continue
        seen.add(key)
        out.append(value)
    return out


def _priority(intent: str, topic: str) -> float:
    base = 0.55
    if intent in {"commercial", "comparison", "alternatives"}:
        base += 0.25
    if len(topic.split()) >= 3:
        base += 0.1
    return round(min(1.0, base), 3)


def generate_prompt_clusters(payload: PromptClusterGenerateIn) -> list[PromptClusterOut]:
    topics = _dedupe([payload.brand_name, *payload.topics, "generative engine optimization"])
    clusters: list[PromptClusterOut] = []

    intent_templates = defaultdict(
        lambda: [
            "what is {topic}",
            "how does {topic} work",
            "best {topic} tools",
        ]
    )
    intent_templates["commercial"] = [
        "best {topic} platform",
        "{topic} service provider",
        "{topic} software for agencies",
    ]
    intent_templates["comparison"] = [
        "{brand} vs {topic}",
        "best alternative to {brand}",
        "{topic} platforms comparison",
    ]

    for topic in topics:
        for intent in INTENT_TYPES:
            templates = intent_templates[intent]
            prompts = _dedupe(
                [t.format(topic=topic, brand=payload.brand_name) for t in templates]
                + [f"{topic} for chatgpt", f"{topic} for google ai overviews"]
            )
            clusters.append(
                PromptClusterOut(
                    name=f"{topic} - {intent}",
                    intent_type=intent,
                    topic=topic,
                    prompts=prompts,
                    priority_score=_priority(intent, topic),
                )
            )
    return clusters


def generate_benchmark_prompt_clusters(payload: PromptClusterGenerateIn) -> list[PromptClusterOut]:
    industry = payload.topics[0] if payload.topics else "local services"
    region = "my city"
    clusters: list[PromptClusterOut] = []
    for slug, intent, topic, templates in BENCHMARK_CLUSTER_TEMPLATES:
        prompts = _dedupe(
            [
                template.format(
                    brand=payload.brand_name,
                    industry=industry,
                    region=region,
                )
                for template in templates
            ]
        )
        clusters.append(
            PromptClusterOut(
                name=f"[Benchmark] {slug}",
                intent_type=intent,
                topic=f"benchmark::{topic}",
                prompts=prompts,
                priority_score=0.95,
            )
        )
    return clusters
