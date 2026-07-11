"""
Prompt Dedupe Engine - Layer 6 of the prompt generation pipeline.

Implements three levels of deduplication:
1. Exact dedupe - normalized text matching
2. Near-text dedupe - fuzzy string similarity
3. Semantic dedupe - intent/topic/audience overlap scoring

Uses the formula:
duplicate_score = 0.45 * embedding_similarity + 0.25 * text_similarity + 0.15 * same_topic + 0.15 * same_intent

Drop prompts above threshold (0.90 for exact, 0.80-0.90 for near duplicates).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .prompt_expansion_engine import ExpandedPrompt


@dataclass
class DedupeResult:
    """Result of deduplication process."""
    
    kept_prompts: list["ExpandedPrompt"]
    dropped_count: int
    exact_dupes_removed: int
    near_dupes_removed: int
    semantic_dupes_removed: int

    def to_dict(self) -> dict:
        return {
            "kept_count": len(self.kept_prompts),
            "dropped_count": self.dropped_count,
            "exact_dupes_removed": self.exact_dupes_removed,
            "near_dupes_removed": self.near_dupes_removed,
            "semantic_dupes_removed": self.semantic_dupes_removed,
        }


def _normalize_text(text: str) -> str:
    """
    Normalize text for exact deduplication.
    - lowercase
    - trim spaces
    - collapse whitespace
    - strip punctuation
    - standardize quotes
    """
    normalized = text.lower().strip()
    normalized = re.sub(r"\s+", " ", normalized)
    normalized = re.sub(r"[\"'`]", "", normalized)
    normalized = re.sub(r"[^\w\s]", "", normalized)
    return normalized.strip()


def _compute_text_similarity(text1: str, text2: str) -> float:
    """
    Compute text similarity using token overlap (Jaccard-like).
    Returns 0.0 to 1.0.
    """
    tokens1 = set(text1.lower().split())
    tokens2 = set(text2.lower().split())
    
    if not tokens1 or not tokens2:
        return 0.0
    
    intersection = len(tokens1 & tokens2)
    union = len(tokens1 | tokens2)
    
    return intersection / union if union > 0 else 0.0


def _compute_ngram_similarity(text1: str, text2: str, n: int = 3) -> float:
    """
    Compute n-gram similarity for near-text matching.
    """
    def get_ngrams(text: str, n: int) -> set[str]:
        text = text.lower()
        return {text[i:i+n] for i in range(len(text) - n + 1)}
    
    ngrams1 = get_ngrams(text1, n)
    ngrams2 = get_ngrams(text2, n)
    
    if not ngrams1 or not ngrams2:
        return 0.0
    
    intersection = len(ngrams1 & ngrams2)
    union = len(ngrams1 | ngrams2)
    
    return intersection / union if union > 0 else 0.0


def _compute_semantic_similarity(prompt1: "ExpandedPrompt", prompt2: "ExpandedPrompt") -> float:
    """
    Compute semantic similarity based on metadata overlap.
    
    Formula:
    duplicate_score = 0.45 * text_similarity + 0.25 * ngram_similarity + 0.15 * same_topic + 0.15 * same_intent
    """
    text_sim = _compute_text_similarity(prompt1.text, prompt2.text)
    ngram_sim = _compute_ngram_similarity(prompt1.text, prompt2.text)
    
    same_topic = 1.0 if (
        prompt1.topic and prompt2.topic and 
        prompt1.topic.lower() == prompt2.topic.lower()
    ) else 0.0
    
    same_intent = 1.0 if (
        prompt1.intent and prompt2.intent and 
        prompt1.intent.lower() == prompt2.intent.lower()
    ) else 0.0
    
    score = (
        0.45 * text_sim +
        0.25 * ngram_sim +
        0.15 * same_topic +
        0.15 * same_intent
    )
    
    return score


def _exact_dedupe(prompts: list["ExpandedPrompt"]) -> tuple[list["ExpandedPrompt"], int]:
    """
    Remove exact duplicates by normalized text.
    """
    seen: set[str] = set()
    kept: list["ExpandedPrompt"] = []
    removed = 0
    
    for prompt in prompts:
        key = _normalize_text(prompt.text)
        if not key or len(key) < 5:
            removed += 1
            continue
        if key in seen:
            removed += 1
            continue
        seen.add(key)
        kept.append(prompt)
    
    return kept, removed


def _near_text_dedupe(
    prompts: list["ExpandedPrompt"],
    threshold: float = 0.85,
) -> tuple[list["ExpandedPrompt"], int]:
    """
    Remove near-text duplicates using n-gram similarity.
    Only compare prompts that start similarly to avoid O(n²) explosion.
    """
    kept: list["ExpandedPrompt"] = []
    removed = 0
    
    prefix_buckets: dict[str, list["ExpandedPrompt"]] = {}
    for prompt in prompts:
        prefix = _normalize_text(prompt.text)[:20]
        if prefix not in prefix_buckets:
            prefix_buckets[prefix] = []
        prefix_buckets[prefix].append(prompt)
    
    seen_texts: set[str] = set()
    
    for prefix, bucket in prefix_buckets.items():
        for prompt in bucket:
            norm_text = _normalize_text(prompt.text)
            
            is_dupe = False
            for seen in seen_texts:
                if len(seen) > 0 and len(norm_text) > 0:
                    sim = _compute_ngram_similarity(norm_text, seen)
                    if sim >= threshold:
                        is_dupe = True
                        break
            
            if is_dupe:
                removed += 1
            else:
                kept.append(prompt)
                seen_texts.add(norm_text)
    
    return kept, removed


def _semantic_dedupe(
    prompts: list["ExpandedPrompt"],
    threshold: float = 0.90,
    max_comparisons: int = 50000,
) -> tuple[list["ExpandedPrompt"], int]:
    """
    Remove semantic duplicates based on metadata + text similarity.
    Uses bucketing by intent to reduce comparisons.
    """
    kept: list["ExpandedPrompt"] = []
    removed = 0
    
    intent_buckets: dict[str, list["ExpandedPrompt"]] = {}
    for prompt in prompts:
        intent = prompt.intent or "unknown"
        if intent not in intent_buckets:
            intent_buckets[intent] = []
        intent_buckets[intent].append(prompt)
    
    comparisons = 0
    
    for intent, bucket in intent_buckets.items():
        bucket_kept: list["ExpandedPrompt"] = []
        
        for prompt in bucket:
            is_dupe = False
            
            for existing in bucket_kept[-100:]:
                if comparisons >= max_comparisons:
                    break
                
                comparisons += 1
                sim = _compute_semantic_similarity(prompt, existing)
                
                if sim >= threshold:
                    is_dupe = True
                    break
            
            if is_dupe:
                removed += 1
            else:
                bucket_kept.append(prompt)
        
        kept.extend(bucket_kept)
    
    return kept, removed


def _prefer_higher_quality(prompts: list["ExpandedPrompt"]) -> list["ExpandedPrompt"]:
    """
    When duplicates exist, prefer higher quality/priority prompts.
    Sort by priority_tier (ascending) and quality_score (descending).
    """
    return sorted(
        prompts,
        key=lambda p: (p.priority_tier, -(p.quality_score or 0.5)),
    )


def dedupe_prompts(
    prompts: list["ExpandedPrompt"],
    exact_threshold: float = 1.0,
    near_threshold: float = 0.85,
    semantic_threshold: float = 0.90,
) -> DedupeResult:
    """
    Deduplicate prompts using three-level strategy.
    
    This is Layer 6 of the prompt generation pipeline.
    
    1. Exact dedupe - remove identical normalized text
    2. Near-text dedupe - remove highly similar text (n-gram)
    3. Semantic dedupe - remove prompts with same topic+intent+high text similarity
    """
    sorted_prompts = _prefer_higher_quality(prompts)
    
    after_exact, exact_removed = _exact_dedupe(sorted_prompts)
    
    after_near, near_removed = _near_text_dedupe(after_exact, near_threshold)
    
    after_semantic, semantic_removed = _semantic_dedupe(after_near, semantic_threshold)
    
    total_dropped = exact_removed + near_removed + semantic_removed
    
    return DedupeResult(
        kept_prompts=after_semantic,
        dropped_count=total_dropped,
        exact_dupes_removed=exact_removed,
        near_dupes_removed=near_removed,
        semantic_dupes_removed=semantic_removed,
    )
