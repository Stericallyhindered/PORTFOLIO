"""
Prompt Graph Engine - Site-derived 10k+ prompt generation system.

This package implements the layered prompt generation pipeline as specified in:
- promptgeneration.txt
- overview.txt

The system generates thousands of relevant prompts per website based on:
- Site content analysis
- Topic/intent graphs
- Competitor awareness
- Multi-pass expansion
- Semantic deduplication
- Quality scoring
- Tiered prioritization
"""

from .site_context_builder import SiteContext, build_site_context, build_site_context_with_claude
from .topic_graph_builder import TopicGraph, build_topic_graph
from .intent_graph_builder import IntentGraph, build_intent_graph
from .seed_prompt_generator import SeedPrompt, generate_seed_prompts
from .prompt_expansion_engine import ExpandedPrompt, expand_prompts
from .prompt_dedupe_engine import dedupe_prompts, DedupeResult
from .prompt_quality_engine import score_prompt_quality, QualityResult
from .prompt_tier_planner import assign_tiers, PromptTier, TierPlanResult
from .orchestrator import (
    generate_prompt_universe,
    generate_prompts_from_site_context,
    PromptGenerationResult,
    GenerationMetadata,
)
from .feedback_expansion import (
    analyze_answer_space,
    generate_feedback_expansion,
    AnswerSpaceAnalysis,
    FeedbackExpansionResult,
)
from .caching import (
    get_cache_stats,
    clear_cache,
    cache_site_profile,
    get_cached_site_profile,
    cache_prompt_generation,
    get_cached_prompt_generation,
    cache_provider_response,
    get_cached_provider_response,
)
from .metrics import (
    start_pipeline_metrics,
    get_pipeline_metrics,
    complete_pipeline_metrics,
    track_layer_timing,
    record_engine_call,
    record_prompt_generation,
    record_prompt_execution,
    get_all_active_metrics,
    PipelineMetrics,
)
from .chunking import (
    get_chunk_config,
    chunk_items,
    chunk_prompts_by_priority,
    estimate_execution_time,
    aggregate_chunk_results,
    ChunkConfig,
    ChunkResult,
)
from .claude_site_analyzer import (
    analyze_site_with_claude,
    ClaudeSiteAnalysis,
    analysis_to_dict,
    generate_prompts_with_claude,
    generate_page_recommendations_with_claude,
    PageRecommendation,
)

__all__ = [
    "SiteContext",
    "build_site_context",
    "build_site_context_with_claude",
    "TopicGraph",
    "build_topic_graph",
    "IntentGraph",
    "build_intent_graph",
    "SeedPrompt",
    "generate_seed_prompts",
    "ExpandedPrompt",
    "expand_prompts",
    "dedupe_prompts",
    "DedupeResult",
    "score_prompt_quality",
    "QualityResult",
    "assign_tiers",
    "PromptTier",
    "TierPlanResult",
    "generate_prompt_universe",
    "generate_prompts_from_site_context",
    "PromptGenerationResult",
    "GenerationMetadata",
    "analyze_answer_space",
    "generate_feedback_expansion",
    "AnswerSpaceAnalysis",
    "FeedbackExpansionResult",
    # Caching
    "get_cache_stats",
    "clear_cache",
    "cache_site_profile",
    "get_cached_site_profile",
    "cache_prompt_generation",
    "get_cached_prompt_generation",
    "cache_provider_response",
    "get_cached_provider_response",
    # Metrics
    "start_pipeline_metrics",
    "get_pipeline_metrics",
    "complete_pipeline_metrics",
    "track_layer_timing",
    "record_engine_call",
    "record_prompt_generation",
    "record_prompt_execution",
    "get_all_active_metrics",
    "PipelineMetrics",
    # Chunking
    "get_chunk_config",
    "chunk_items",
    "chunk_prompts_by_priority",
    "estimate_execution_time",
    "aggregate_chunk_results",
    "ChunkConfig",
    "ChunkResult",
    # Claude Site Analyzer
    "analyze_site_with_claude",
    "ClaudeSiteAnalysis",
    "analysis_to_dict",
    "generate_prompts_with_claude",
    "generate_page_recommendations_with_claude",
    "PageRecommendation",
]
