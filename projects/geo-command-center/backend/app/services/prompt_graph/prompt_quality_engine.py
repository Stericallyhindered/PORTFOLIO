"""
Prompt Quality Engine - Layer 7 of the prompt generation pipeline.

Scores each prompt on multiple dimensions:
- Relevance to audited site
- Naturalness (sounds like real user query)
- Specificity (not too vague)
- Intent clarity
- Likely user realism
- Business value
- Uniqueness
- Coverage contribution

Formula:
final_quality_score = (
    0.30 * relevance +
    0.20 * naturalness +
    0.15 * specificity +
    0.15 * user_realism +
    0.10 * business_value +
    0.10 * uniqueness
)

Thresholds:
- >= 0.85: Tier 1 (core)
- 0.70-0.84: Tier 2 (expanded)
- 0.55-0.69: Tier 3 (deep)
- < 0.55: discard unless needed for coverage
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .prompt_expansion_engine import ExpandedPrompt
    from .site_context_builder import SiteContext


@dataclass
class QualityScore:
    """Quality score breakdown for a prompt."""
    
    relevance: float = 0.0
    naturalness: float = 0.0
    specificity: float = 0.0
    user_realism: float = 0.0
    business_value: float = 0.0
    uniqueness: float = 0.0
    final_score: float = 0.0

    def to_dict(self) -> dict:
        return {
            "relevance": round(self.relevance, 3),
            "naturalness": round(self.naturalness, 3),
            "specificity": round(self.specificity, 3),
            "user_realism": round(self.user_realism, 3),
            "business_value": round(self.business_value, 3),
            "uniqueness": round(self.uniqueness, 3),
            "final_score": round(self.final_score, 3),
        }


@dataclass
class QualityResult:
    """Result of quality scoring process."""
    
    scored_prompts: list["ExpandedPrompt"]
    avg_score: float
    tier1_count: int
    tier2_count: int
    tier3_count: int
    discarded_count: int

    def to_dict(self) -> dict:
        return {
            "total_scored": len(self.scored_prompts),
            "avg_score": round(self.avg_score, 3),
            "tier1_count": self.tier1_count,
            "tier2_count": self.tier2_count,
            "tier3_count": self.tier3_count,
            "discarded_count": self.discarded_count,
        }


HIGH_VALUE_INTENTS = {
    "commercial", "comparison", "alternatives", "pricing",
    "best_of", "recommendation", "trust",
}

NATURAL_PATTERNS = [
    r"^what is",
    r"^how (?:do|does|to|can)",
    r"^best ",
    r"^top ",
    r"^which ",
    r"^recommend",
    r"^compare",
    r"^is .+ good",
    r"^should I",
    r" vs ",
    r" alternative",
    r" for ",
]

UNNATURAL_PATTERNS = [
    r"^\d+",
    r"^[A-Z]{3,}",
    r"\b(?:click|buy now|subscribe)\b",
    r"^(?:the|a|an) ",
]

SPECIFIC_INDICATORS = [
    r" for (?:small business|enterprise|startup|agency)",
    r" with ",
    r" in \w+",
    r" vs ",
    r" alternative",
    r" pricing",
    r" review",
]


def _score_relevance(
    prompt: "ExpandedPrompt",
    site_context: "SiteContext",
) -> float:
    """
    Score relevance to the audited site.
    Higher if prompt contains brand, products, services, or core topics.
    """
    text_lower = prompt.text.lower()
    score = 0.5
    
    if site_context.brand_name.lower() in text_lower:
        score += 0.3
    
    for product in site_context.products[:10]:
        if product.lower() in text_lower:
            score += 0.1
            break
    
    for service in site_context.services[:10]:
        if service.lower() in text_lower:
            score += 0.1
            break
    
    for topic in site_context.core_topics[:15]:
        if topic.lower() in text_lower:
            score += 0.1
            break
    
    for competitor in site_context.competitors[:10]:
        if competitor.lower() in text_lower:
            score += 0.1
            break
    
    return min(1.0, score)


def _score_naturalness(prompt: "ExpandedPrompt") -> float:
    """
    Score how natural the prompt sounds as a real user query.
    """
    text = prompt.text
    score = 0.6
    
    for pattern in NATURAL_PATTERNS:
        if re.search(pattern, text, re.I):
            score += 0.1
            break
    
    for pattern in UNNATURAL_PATTERNS:
        if re.search(pattern, text, re.I):
            score -= 0.2
            break
    
    word_count = len(text.split())
    if 3 <= word_count <= 12:
        score += 0.15
    elif word_count < 3:
        score -= 0.1
    elif word_count > 20:
        score -= 0.15
    
    if text[0].islower():
        score += 0.05
    
    if text.endswith("?"):
        score += 0.05
    
    return max(0.0, min(1.0, score))


def _score_specificity(prompt: "ExpandedPrompt") -> float:
    """
    Score how specific (not vague) the prompt is.
    """
    text = prompt.text
    score = 0.5
    
    for pattern in SPECIFIC_INDICATORS:
        if re.search(pattern, text, re.I):
            score += 0.1
    
    if prompt.audience:
        score += 0.1
    if prompt.use_case:
        score += 0.1
    if prompt.feature:
        score += 0.1
    if prompt.competitor:
        score += 0.1
    if prompt.pain_point:
        score += 0.1
    
    word_count = len(text.split())
    if word_count >= 5:
        score += 0.1
    
    return min(1.0, score)


def _score_user_realism(prompt: "ExpandedPrompt") -> float:
    """
    Score how likely a real user would ask this query.
    """
    text = prompt.text.lower()
    score = 0.6
    
    realistic_starters = [
        "what", "how", "best", "top", "which", "recommend",
        "compare", "is", "should", "can", "where", "why",
    ]
    first_word = text.split()[0] if text.split() else ""
    if first_word in realistic_starters:
        score += 0.15
    
    if " for " in text or " with " in text:
        score += 0.1
    
    if " vs " in text or " versus " in text:
        score += 0.1
    
    if "alternative" in text:
        score += 0.1
    
    word_count = len(text.split())
    if 4 <= word_count <= 10:
        score += 0.1
    
    return min(1.0, score)


def _score_business_value(prompt: "ExpandedPrompt") -> float:
    """
    Score the business value of the prompt.
    Higher for commercial, comparison, and decision-stage prompts.
    """
    score = 0.5
    
    if prompt.intent in HIGH_VALUE_INTENTS:
        score += 0.25
    
    high_value_stages = {"evaluation", "decision", "consideration"}
    if prompt.funnel_stage in high_value_stages:
        score += 0.15
    
    text_lower = prompt.text.lower()
    high_value_keywords = [
        "best", "top", "vs", "alternative", "pricing", "cost",
        "review", "recommend", "compare", "buy", "hire",
    ]
    for keyword in high_value_keywords:
        if keyword in text_lower:
            score += 0.05
            break
    
    if prompt.competitor:
        score += 0.1
    
    return min(1.0, score)


def _score_uniqueness(
    prompt: "ExpandedPrompt",
    all_prompts: list["ExpandedPrompt"],
    prompt_index: int,
) -> float:
    """
    Score how unique this prompt is compared to others.
    Simple heuristic based on source layer diversity.
    """
    score = 0.7
    
    unique_layers = {"seed", "competitor_expansion", "semantic_expansion"}
    if prompt.source_layer in unique_layers:
        score += 0.15
    
    if prompt.competitor and prompt.audience:
        score += 0.1
    
    if prompt.use_case and prompt.feature:
        score += 0.1
    
    return min(1.0, score)


def _compute_final_score(quality: QualityScore) -> float:
    """
    Compute final quality score using weighted formula.
    """
    return (
        0.30 * quality.relevance +
        0.20 * quality.naturalness +
        0.15 * quality.specificity +
        0.15 * quality.user_realism +
        0.10 * quality.business_value +
        0.10 * quality.uniqueness
    )


def _assign_tier(score: float) -> int:
    """
    Assign priority tier based on quality score.
    """
    if score >= 0.85:
        return 1
    elif score >= 0.70:
        return 2
    elif score >= 0.55:
        return 3
    else:
        return 4


def score_prompt_quality(
    prompts: list["ExpandedPrompt"],
    site_context: "SiteContext",
    discard_threshold: float = 0.50,
) -> QualityResult:
    """
    Score all prompts for quality and assign tiers.
    
    This is Layer 7 of the prompt generation pipeline.
    """
    scored: list["ExpandedPrompt"] = []
    total_score = 0.0
    tier_counts = {1: 0, 2: 0, 3: 0, 4: 0}
    discarded = 0
    
    for i, prompt in enumerate(prompts):
        quality = QualityScore(
            relevance=_score_relevance(prompt, site_context),
            naturalness=_score_naturalness(prompt),
            specificity=_score_specificity(prompt),
            user_realism=_score_user_realism(prompt),
            business_value=_score_business_value(prompt),
            uniqueness=_score_uniqueness(prompt, prompts, i),
        )
        quality.final_score = _compute_final_score(quality)
        
        if quality.final_score < discard_threshold:
            discarded += 1
            continue
        
        prompt.quality_score = quality.final_score
        prompt.priority_tier = _assign_tier(quality.final_score)
        
        tier_counts[prompt.priority_tier] += 1
        total_score += quality.final_score
        scored.append(prompt)
    
    avg_score = total_score / len(scored) if scored else 0.0
    
    return QualityResult(
        scored_prompts=scored,
        avg_score=avg_score,
        tier1_count=tier_counts[1],
        tier2_count=tier_counts[2],
        tier3_count=tier_counts[3],
        discarded_count=discarded,
    )
