"""
Prompt Chunking - Intelligent batching for high-volume runs.

Implements:
1. Adaptive chunk sizing based on tier and engine capacity
2. Priority-based ordering within chunks
3. Rate limit awareness
4. Failure isolation per chunk
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Iterator, TypeVar

logger = logging.getLogger(__name__)

T = TypeVar("T")


@dataclass
class ChunkConfig:
    """Configuration for chunking behavior."""
    
    base_chunk_size: int = 50
    max_chunk_size: int = 200
    min_chunk_size: int = 10
    
    rate_limit_buffer_ms: int = 1000
    max_concurrent_engines: int = 5
    
    retry_chunk_on_partial_failure: bool = True
    max_retries_per_chunk: int = 2


TIER_CHUNK_CONFIGS = {
    "core": ChunkConfig(
        base_chunk_size=50,
        max_chunk_size=100,
        min_chunk_size=25,
    ),
    "expanded": ChunkConfig(
        base_chunk_size=75,
        max_chunk_size=150,
        min_chunk_size=30,
    ),
    "deep": ChunkConfig(
        base_chunk_size=100,
        max_chunk_size=200,
        min_chunk_size=50,
    ),
}


def get_chunk_config(tier: str) -> ChunkConfig:
    """Get chunk configuration for a tier."""
    return TIER_CHUNK_CONFIGS.get(tier, TIER_CHUNK_CONFIGS["core"])


def chunk_items(
    items: list[T],
    chunk_size: int,
) -> Iterator[list[T]]:
    """Yield successive chunks of items."""
    for i in range(0, len(items), chunk_size):
        yield items[i : i + chunk_size]


def chunk_prompts_by_priority(
    prompts: list[dict],
    tier: str,
) -> list[list[dict]]:
    """
    Chunk prompts with priority-based ordering.
    
    Higher priority prompts go first, and each chunk maintains
    a mix of intents for balanced coverage.
    """
    config = get_chunk_config(tier)
    
    sorted_prompts = sorted(
        prompts,
        key=lambda p: (
            -p.get("quality_score", 0),
            p.get("priority_tier", "low") == "high",
            p.get("priority_tier", "low") == "medium",
        ),
        reverse=False,
    )
    
    by_intent: dict[str, list[dict]] = {}
    for prompt in sorted_prompts:
        intent = prompt.get("intent", "general")
        if intent not in by_intent:
            by_intent[intent] = []
        by_intent[intent].append(prompt)
    
    chunks: list[list[dict]] = []
    current_chunk: list[dict] = []
    intent_keys = list(by_intent.keys())
    intent_idx = 0
    
    while any(by_intent.values()):
        if len(current_chunk) >= config.base_chunk_size:
            chunks.append(current_chunk)
            current_chunk = []
        
        for _ in range(len(intent_keys)):
            intent = intent_keys[intent_idx % len(intent_keys)]
            intent_idx += 1
            
            if by_intent.get(intent):
                current_chunk.append(by_intent[intent].pop(0))
                break
        else:
            break
    
    if current_chunk:
        chunks.append(current_chunk)
    
    logger.info(
        f"Chunked {len(prompts)} prompts into {len(chunks)} chunks "
        f"(tier={tier}, avg_size={len(prompts) // max(1, len(chunks))})"
    )
    
    return chunks


def estimate_execution_time(
    num_prompts: int,
    num_engines: int,
    avg_latency_ms: float = 500,
    tier: str = "core",
) -> dict:
    """
    Estimate execution time for a prompt batch.
    
    Returns timing estimates and recommendations.
    """
    config = get_chunk_config(tier)
    
    num_chunks = (num_prompts + config.base_chunk_size - 1) // config.base_chunk_size
    
    calls_per_chunk = config.base_chunk_size * num_engines
    
    chunk_time_ms = calls_per_chunk * avg_latency_ms / config.max_concurrent_engines
    
    total_time_ms = num_chunks * chunk_time_ms
    
    total_api_calls = num_prompts * num_engines
    
    return {
        "num_prompts": num_prompts,
        "num_engines": num_engines,
        "num_chunks": num_chunks,
        "chunk_size": config.base_chunk_size,
        "total_api_calls": total_api_calls,
        "estimated_time_ms": total_time_ms,
        "estimated_time_minutes": round(total_time_ms / 60000, 1),
        "recommendation": _get_execution_recommendation(
            num_prompts, num_engines, total_time_ms
        ),
    }


def _get_execution_recommendation(
    num_prompts: int,
    num_engines: int,
    estimated_time_ms: float,
) -> str:
    """Get a recommendation based on execution parameters."""
    if estimated_time_ms < 60000:
        return "Fast execution expected. Proceed normally."
    elif estimated_time_ms < 300000:
        return "Moderate execution time. Consider running in background."
    elif estimated_time_ms < 900000:
        return "Long execution time. Background processing recommended."
    else:
        return "Very long execution. Consider reducing tier or running overnight."


@dataclass
class ChunkResult:
    """Result of processing a single chunk."""
    
    chunk_index: int
    total_chunks: int
    prompts_processed: int
    prompts_succeeded: int
    prompts_failed: int
    engine_results: dict[str, dict]
    errors: list[str]
    duration_ms: float

    def success_rate(self) -> float:
        if self.prompts_processed == 0:
            return 0.0
        return (self.prompts_succeeded / self.prompts_processed) * 100


def aggregate_chunk_results(results: list[ChunkResult]) -> dict:
    """Aggregate results from multiple chunks."""
    total_processed = sum(r.prompts_processed for r in results)
    total_succeeded = sum(r.prompts_succeeded for r in results)
    total_failed = sum(r.prompts_failed for r in results)
    total_duration = sum(r.duration_ms for r in results)
    
    all_errors = []
    for r in results:
        all_errors.extend(r.errors)
    
    engine_aggregates: dict[str, dict] = {}
    for r in results:
        for engine, stats in r.engine_results.items():
            if engine not in engine_aggregates:
                engine_aggregates[engine] = {
                    "calls": 0,
                    "successes": 0,
                    "failures": 0,
                    "total_latency_ms": 0,
                }
            engine_aggregates[engine]["calls"] += stats.get("calls", 0)
            engine_aggregates[engine]["successes"] += stats.get("successes", 0)
            engine_aggregates[engine]["failures"] += stats.get("failures", 0)
            engine_aggregates[engine]["total_latency_ms"] += stats.get("latency_ms", 0)
    
    for engine, stats in engine_aggregates.items():
        if stats["calls"] > 0:
            stats["avg_latency_ms"] = stats["total_latency_ms"] / stats["calls"]
            stats["success_rate"] = (stats["successes"] / stats["calls"]) * 100
    
    return {
        "chunks_processed": len(results),
        "prompts_processed": total_processed,
        "prompts_succeeded": total_succeeded,
        "prompts_failed": total_failed,
        "success_rate": (total_succeeded / total_processed * 100) if total_processed > 0 else 0,
        "total_duration_ms": total_duration,
        "avg_chunk_duration_ms": total_duration / len(results) if results else 0,
        "engines": engine_aggregates,
        "errors": all_errors[:20],
        "error_count": len(all_errors),
    }
