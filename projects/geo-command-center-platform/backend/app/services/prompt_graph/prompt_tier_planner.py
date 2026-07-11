"""
Prompt Tier Planner - Layer 8 of the prompt generation pipeline.

Organizes prompts into execution tiers:
- Core: 500-1000 prompts (highest signal, highest business value)
- Expanded: 2000-3000 prompts (broader coverage)
- Deep: 10000+ prompts (full semantic and long-tail map)

Ensures balanced coverage across:
- Intent types
- Topics
- Audiences
- Competitors
- Funnel stages
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .prompt_expansion_engine import ExpandedPrompt


class PromptTier(str, Enum):
    """Prompt execution tier."""
    
    CORE = "core"
    EXPANDED = "expanded"
    DEEP = "deep"


@dataclass
class TierPlan:
    """Plan for a specific tier."""
    
    tier: PromptTier
    prompts: list["ExpandedPrompt"] = field(default_factory=list)
    target_count: int = 0
    actual_count: int = 0
    
    intent_distribution: dict[str, int] = field(default_factory=dict)
    topic_distribution: dict[str, int] = field(default_factory=dict)
    audience_distribution: dict[str, int] = field(default_factory=dict)
    competitor_distribution: dict[str, int] = field(default_factory=dict)
    funnel_distribution: dict[str, int] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "tier": self.tier.value,
            "target_count": self.target_count,
            "actual_count": self.actual_count,
            "intent_distribution": self.intent_distribution,
            "topic_distribution": dict(list(self.topic_distribution.items())[:10]),
            "audience_distribution": self.audience_distribution,
            "competitor_distribution": self.competitor_distribution,
            "funnel_distribution": self.funnel_distribution,
        }


@dataclass
class TierPlanResult:
    """Result of tier planning."""
    
    core: TierPlan
    expanded: TierPlan
    deep: TierPlan
    total_prompts: int = 0

    def to_dict(self) -> dict:
        return {
            "core": self.core.to_dict(),
            "expanded": self.expanded.to_dict(),
            "deep": self.deep.to_dict(),
            "total_prompts": self.total_prompts,
        }

    def get_tier(self, tier: PromptTier) -> TierPlan:
        if tier == PromptTier.CORE:
            return self.core
        elif tier == PromptTier.EXPANDED:
            return self.expanded
        else:
            return self.deep


TIER_TARGETS = {
    PromptTier.CORE: {"min": 500, "target": 800, "max": 1000},
    PromptTier.EXPANDED: {"min": 2000, "target": 2500, "max": 3000},
    PromptTier.DEEP: {"min": 8000, "target": 10000, "max": 15000},
}

HIGH_VALUE_INTENTS = {
    "commercial", "comparison", "alternatives", "pricing",
    "best_of", "recommendation", "trust", "brand_specific",
}

REQUIRED_INTENT_COVERAGE = [
    "informational",
    "commercial",
    "comparison",
    "alternatives",
    "problem_solving",
    "best_of",
    "recommendation",
    "pricing",
    "trust",
]


def _compute_distribution(
    prompts: list["ExpandedPrompt"],
) -> dict[str, dict[str, int]]:
    """Compute distribution across all dimensions."""
    distributions: dict[str, dict[str, int]] = {
        "intent": {},
        "topic": {},
        "audience": {},
        "competitor": {},
        "funnel": {},
    }
    
    for prompt in prompts:
        intent = prompt.intent or "unknown"
        distributions["intent"][intent] = distributions["intent"].get(intent, 0) + 1
        
        topic = prompt.topic or "unknown"
        distributions["topic"][topic] = distributions["topic"].get(topic, 0) + 1
        
        if prompt.audience:
            distributions["audience"][prompt.audience] = distributions["audience"].get(prompt.audience, 0) + 1
        
        if prompt.competitor:
            distributions["competitor"][prompt.competitor] = distributions["competitor"].get(prompt.competitor, 0) + 1
        
        funnel = prompt.funnel_stage or "unknown"
        distributions["funnel"][funnel] = distributions["funnel"].get(funnel, 0) + 1
    
    return distributions


def _ensure_intent_coverage(
    prompts: list["ExpandedPrompt"],
    required_intents: list[str],
    min_per_intent: int = 5,
) -> list["ExpandedPrompt"]:
    """
    Ensure minimum coverage for required intents.
    Reorder prompts to prioritize underrepresented intents.
    """
    intent_buckets: dict[str, list["ExpandedPrompt"]] = {}
    for prompt in prompts:
        intent = prompt.intent or "unknown"
        if intent not in intent_buckets:
            intent_buckets[intent] = []
        intent_buckets[intent].append(prompt)
    
    result: list["ExpandedPrompt"] = []
    used_ids: set[str] = set()
    
    for intent in required_intents:
        bucket = intent_buckets.get(intent, [])
        for prompt in bucket[:min_per_intent]:
            if prompt.id not in used_ids:
                result.append(prompt)
                used_ids.add(prompt.id)
    
    for prompt in prompts:
        if prompt.id not in used_ids:
            result.append(prompt)
            used_ids.add(prompt.id)
    
    return result


def _ensure_competitor_coverage(
    prompts: list["ExpandedPrompt"],
    min_per_competitor: int = 10,
) -> list["ExpandedPrompt"]:
    """
    Ensure competitor prompts are well-distributed.
    """
    competitor_buckets: dict[str, list["ExpandedPrompt"]] = {}
    non_competitor: list["ExpandedPrompt"] = []
    
    for prompt in prompts:
        if prompt.competitor:
            if prompt.competitor not in competitor_buckets:
                competitor_buckets[prompt.competitor] = []
            competitor_buckets[prompt.competitor].append(prompt)
        else:
            non_competitor.append(prompt)
    
    result: list["ExpandedPrompt"] = []
    used_ids: set[str] = set()
    
    for competitor, bucket in competitor_buckets.items():
        for prompt in bucket[:min_per_competitor]:
            if prompt.id not in used_ids:
                result.append(prompt)
                used_ids.add(prompt.id)
    
    for prompt in non_competitor:
        if prompt.id not in used_ids:
            result.append(prompt)
            used_ids.add(prompt.id)
    
    for competitor, bucket in competitor_buckets.items():
        for prompt in bucket[min_per_competitor:]:
            if prompt.id not in used_ids:
                result.append(prompt)
                used_ids.add(prompt.id)
    
    return result


def _select_core_prompts(
    prompts: list["ExpandedPrompt"],
    target: int,
) -> list["ExpandedPrompt"]:
    """
    Select prompts for core tier.
    Prioritize:
    1. Tier 1 quality prompts
    2. High-value intents
    3. Competitor coverage
    4. Intent diversity
    """
    tier1 = [p for p in prompts if p.priority_tier == 1]
    tier2 = [p for p in prompts if p.priority_tier == 2]
    
    tier1_sorted = sorted(tier1, key=lambda p: -(p.quality_score or 0.5))
    tier2_sorted = sorted(tier2, key=lambda p: -(p.quality_score or 0.5))
    
    candidates = tier1_sorted + tier2_sorted
    
    candidates = _ensure_intent_coverage(candidates, REQUIRED_INTENT_COVERAGE, min_per_intent=10)
    candidates = _ensure_competitor_coverage(candidates, min_per_competitor=15)
    
    return candidates[:target]


def _select_expanded_prompts(
    prompts: list["ExpandedPrompt"],
    core_ids: set[str],
    target: int,
) -> list["ExpandedPrompt"]:
    """
    Select prompts for expanded tier.
    Includes core + additional coverage.
    """
    remaining = [p for p in prompts if p.id not in core_ids]
    
    tier1_2 = [p for p in remaining if p.priority_tier in (1, 2)]
    tier3 = [p for p in remaining if p.priority_tier == 3]
    
    tier1_2_sorted = sorted(tier1_2, key=lambda p: -(p.quality_score or 0.5))
    tier3_sorted = sorted(tier3, key=lambda p: -(p.quality_score or 0.5))
    
    candidates = tier1_2_sorted + tier3_sorted
    
    candidates = _ensure_intent_coverage(candidates, REQUIRED_INTENT_COVERAGE, min_per_intent=20)
    candidates = _ensure_competitor_coverage(candidates, min_per_competitor=25)
    
    return candidates[:target]


def _select_deep_prompts(
    prompts: list["ExpandedPrompt"],
    used_ids: set[str],
    target: int,
) -> list["ExpandedPrompt"]:
    """
    Select prompts for deep tier.
    Includes all remaining prompts up to target.
    """
    remaining = [p for p in prompts if p.id not in used_ids]
    
    sorted_remaining = sorted(remaining, key=lambda p: -(p.quality_score or 0.5))
    
    return sorted_remaining[:target]


def assign_tiers(
    prompts: list["ExpandedPrompt"],
    target_tier: PromptTier = PromptTier.CORE,
) -> TierPlanResult:
    """
    Assign prompts to execution tiers.
    
    This is Layer 8 of the prompt generation pipeline.
    """
    core_target = TIER_TARGETS[PromptTier.CORE]["target"]
    expanded_target = TIER_TARGETS[PromptTier.EXPANDED]["target"]
    deep_target = TIER_TARGETS[PromptTier.DEEP]["target"]
    
    core_prompts = _select_core_prompts(prompts, core_target)
    core_ids = {p.id for p in core_prompts}
    
    expanded_additional = _select_expanded_prompts(
        prompts, core_ids, expanded_target - len(core_prompts)
    )
    expanded_prompts = core_prompts + expanded_additional
    expanded_ids = {p.id for p in expanded_prompts}
    
    deep_additional = _select_deep_prompts(
        prompts, expanded_ids, deep_target - len(expanded_prompts)
    )
    deep_prompts = expanded_prompts + deep_additional
    
    core_dist = _compute_distribution(core_prompts)
    expanded_dist = _compute_distribution(expanded_prompts)
    deep_dist = _compute_distribution(deep_prompts)
    
    core_plan = TierPlan(
        tier=PromptTier.CORE,
        prompts=core_prompts,
        target_count=core_target,
        actual_count=len(core_prompts),
        intent_distribution=core_dist["intent"],
        topic_distribution=core_dist["topic"],
        audience_distribution=core_dist["audience"],
        competitor_distribution=core_dist["competitor"],
        funnel_distribution=core_dist["funnel"],
    )
    
    expanded_plan = TierPlan(
        tier=PromptTier.EXPANDED,
        prompts=expanded_prompts,
        target_count=expanded_target,
        actual_count=len(expanded_prompts),
        intent_distribution=expanded_dist["intent"],
        topic_distribution=expanded_dist["topic"],
        audience_distribution=expanded_dist["audience"],
        competitor_distribution=expanded_dist["competitor"],
        funnel_distribution=expanded_dist["funnel"],
    )
    
    deep_plan = TierPlan(
        tier=PromptTier.DEEP,
        prompts=deep_prompts,
        target_count=deep_target,
        actual_count=len(deep_prompts),
        intent_distribution=deep_dist["intent"],
        topic_distribution=deep_dist["topic"],
        audience_distribution=deep_dist["audience"],
        competitor_distribution=deep_dist["competitor"],
        funnel_distribution=deep_dist["funnel"],
    )
    
    return TierPlanResult(
        core=core_plan,
        expanded=expanded_plan,
        deep=deep_plan,
        total_prompts=len(prompts),
    )
