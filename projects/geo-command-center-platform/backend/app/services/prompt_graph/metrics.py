"""
Prompt Generation Metrics - Observability for high-volume runs.

Tracks:
1. Generation timing per layer
2. Prompt counts per stage
3. Engine response latencies
4. Error rates and types
5. Quality distribution
"""

from __future__ import annotations

import logging
import time
from collections import defaultdict
from contextlib import contextmanager
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Generator

logger = logging.getLogger(__name__)


@dataclass
class TimingMetric:
    """Timing information for a single operation."""
    
    name: str
    started_at: datetime
    ended_at: datetime | None = None
    duration_ms: float = 0.0
    success: bool = True
    error: str | None = None
    metadata: dict = field(default_factory=dict)

    def complete(self, success: bool = True, error: str | None = None):
        self.ended_at = datetime.utcnow()
        self.duration_ms = (self.ended_at - self.started_at).total_seconds() * 1000
        self.success = success
        self.error = error


@dataclass
class PipelineMetrics:
    """Aggregated metrics for a pipeline run."""
    
    run_id: str
    project_id: str
    tier: str
    started_at: datetime = field(default_factory=datetime.utcnow)
    ended_at: datetime | None = None
    
    layer_timings: dict[str, TimingMetric] = field(default_factory=dict)
    engine_timings: dict[str, list[TimingMetric]] = field(default_factory=lambda: defaultdict(list))
    
    prompts_generated: int = 0
    prompts_deduplicated: int = 0
    prompts_executed: int = 0
    prompts_succeeded: int = 0
    prompts_failed: int = 0
    
    engine_calls: dict[str, int] = field(default_factory=lambda: defaultdict(int))
    engine_successes: dict[str, int] = field(default_factory=lambda: defaultdict(int))
    engine_failures: dict[str, int] = field(default_factory=lambda: defaultdict(int))
    engine_errors: dict[str, list[str]] = field(default_factory=lambda: defaultdict(list))
    
    quality_distribution: dict[str, int] = field(default_factory=lambda: defaultdict(int))
    tier_distribution: dict[str, int] = field(default_factory=lambda: defaultdict(int))
    intent_distribution: dict[str, int] = field(default_factory=lambda: defaultdict(int))

    def complete(self):
        self.ended_at = datetime.utcnow()

    def total_duration_ms(self) -> float:
        if not self.ended_at:
            return 0.0
        return (self.ended_at - self.started_at).total_seconds() * 1000

    def avg_engine_latency(self, engine: str) -> float:
        timings = self.engine_timings.get(engine, [])
        if not timings:
            return 0.0
        return sum(t.duration_ms for t in timings) / len(timings)

    def engine_success_rate(self, engine: str) -> float:
        calls = self.engine_calls.get(engine, 0)
        if calls == 0:
            return 0.0
        return (self.engine_successes.get(engine, 0) / calls) * 100

    def overall_success_rate(self) -> float:
        total = self.prompts_succeeded + self.prompts_failed
        if total == 0:
            return 0.0
        return (self.prompts_succeeded / total) * 100

    def to_dict(self) -> dict:
        return {
            "run_id": self.run_id,
            "project_id": self.project_id,
            "tier": self.tier,
            "started_at": self.started_at.isoformat(),
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
            "total_duration_ms": self.total_duration_ms(),
            "prompts": {
                "generated": self.prompts_generated,
                "deduplicated": self.prompts_deduplicated,
                "executed": self.prompts_executed,
                "succeeded": self.prompts_succeeded,
                "failed": self.prompts_failed,
                "success_rate": round(self.overall_success_rate(), 2),
            },
            "layer_timings": {
                name: {
                    "duration_ms": t.duration_ms,
                    "success": t.success,
                    "error": t.error,
                }
                for name, t in self.layer_timings.items()
            },
            "engines": {
                engine: {
                    "calls": self.engine_calls.get(engine, 0),
                    "successes": self.engine_successes.get(engine, 0),
                    "failures": self.engine_failures.get(engine, 0),
                    "success_rate": round(self.engine_success_rate(engine), 2),
                    "avg_latency_ms": round(self.avg_engine_latency(engine), 2),
                    "errors": self.engine_errors.get(engine, [])[:5],
                }
                for engine in set(self.engine_calls.keys())
            },
            "distributions": {
                "quality": dict(self.quality_distribution),
                "tier": dict(self.tier_distribution),
                "intent": dict(self.intent_distribution),
            },
        }


_active_metrics: dict[str, PipelineMetrics] = {}


def start_pipeline_metrics(
    run_id: str,
    project_id: str,
    tier: str,
) -> PipelineMetrics:
    """Start tracking metrics for a pipeline run."""
    metrics = PipelineMetrics(
        run_id=run_id,
        project_id=project_id,
        tier=tier,
    )
    _active_metrics[run_id] = metrics
    logger.info(f"Started metrics tracking for run {run_id}")
    return metrics


def get_pipeline_metrics(run_id: str) -> PipelineMetrics | None:
    """Get metrics for a pipeline run."""
    return _active_metrics.get(run_id)


def complete_pipeline_metrics(run_id: str) -> PipelineMetrics | None:
    """Complete and return metrics for a pipeline run."""
    metrics = _active_metrics.get(run_id)
    if metrics:
        metrics.complete()
        logger.info(
            f"Completed metrics for run {run_id}: "
            f"{metrics.prompts_executed} prompts, "
            f"{metrics.overall_success_rate():.1f}% success rate, "
            f"{metrics.total_duration_ms():.0f}ms total"
        )
    return metrics


def clear_pipeline_metrics(run_id: str):
    """Clear metrics for a pipeline run."""
    if run_id in _active_metrics:
        del _active_metrics[run_id]


@contextmanager
def track_layer_timing(
    run_id: str,
    layer_name: str,
    metadata: dict | None = None,
) -> Generator[TimingMetric, None, None]:
    """Context manager to track timing for a layer."""
    metric = TimingMetric(
        name=layer_name,
        started_at=datetime.utcnow(),
        metadata=metadata or {},
    )
    
    try:
        yield metric
        metric.complete(success=True)
    except Exception as e:
        metric.complete(success=False, error=str(e))
        raise
    finally:
        metrics = _active_metrics.get(run_id)
        if metrics:
            metrics.layer_timings[layer_name] = metric
            logger.debug(
                f"Layer {layer_name} completed in {metric.duration_ms:.0f}ms "
                f"(success={metric.success})"
            )


def record_engine_call(
    run_id: str,
    engine: str,
    duration_ms: float,
    success: bool,
    error: str | None = None,
):
    """Record a single engine call."""
    metrics = _active_metrics.get(run_id)
    if not metrics:
        return
    
    timing = TimingMetric(
        name=f"{engine}_call",
        started_at=datetime.utcnow(),
    )
    timing.duration_ms = duration_ms
    timing.success = success
    timing.error = error
    
    metrics.engine_timings[engine].append(timing)
    metrics.engine_calls[engine] += 1
    
    if success:
        metrics.engine_successes[engine] += 1
    else:
        metrics.engine_failures[engine] += 1
        if error:
            metrics.engine_errors[engine].append(error)


def record_prompt_generation(
    run_id: str,
    generated: int,
    deduplicated: int,
    quality_distribution: dict[str, int] | None = None,
    tier_distribution: dict[str, int] | None = None,
    intent_distribution: dict[str, int] | None = None,
):
    """Record prompt generation statistics."""
    metrics = _active_metrics.get(run_id)
    if not metrics:
        return
    
    metrics.prompts_generated = generated
    metrics.prompts_deduplicated = deduplicated
    
    if quality_distribution:
        metrics.quality_distribution.update(quality_distribution)
    if tier_distribution:
        metrics.tier_distribution.update(tier_distribution)
    if intent_distribution:
        metrics.intent_distribution.update(intent_distribution)


def record_prompt_execution(
    run_id: str,
    executed: int,
    succeeded: int,
    failed: int,
):
    """Record prompt execution statistics."""
    metrics = _active_metrics.get(run_id)
    if not metrics:
        return
    
    metrics.prompts_executed = executed
    metrics.prompts_succeeded = succeeded
    metrics.prompts_failed = failed


def get_all_active_metrics() -> dict[str, dict]:
    """Get all active pipeline metrics."""
    return {
        run_id: metrics.to_dict()
        for run_id, metrics in _active_metrics.items()
    }
