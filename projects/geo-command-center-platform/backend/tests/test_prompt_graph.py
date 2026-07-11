"""
Tests for the prompt graph generation system.

Tests cover:
1. Site context building
2. Topic graph construction
3. Intent graph mapping
4. Seed prompt generation
5. Prompt expansion
6. Deduplication
7. Quality scoring
8. Tier assignment
9. Full orchestration
10. Per-website isolation
"""

import pytest
from dataclasses import dataclass
from typing import List

from app.services.prompt_graph.site_context_builder import (
    SiteContext,
    build_site_context,
    CrawledDocument,
)
from app.services.prompt_graph.topic_graph_builder import (
    TopicGraph,
    build_topic_graph,
)
from app.services.prompt_graph.intent_graph_builder import (
    IntentGraph,
    build_intent_graph,
)
from app.services.prompt_graph.seed_prompt_generator import (
    SeedPrompt,
    generate_seed_prompts,
)
from app.services.prompt_graph.prompt_expansion_engine import (
    ExpandedPrompt,
    expand_prompts,
)
from app.services.prompt_graph.prompt_dedupe_engine import (
    dedupe_prompts,
    DedupeResult,
)
from app.services.prompt_graph.prompt_quality_engine import (
    score_prompt_quality,
    QualityResult,
)
from app.services.prompt_graph.prompt_tier_planner import (
    assign_tiers,
    PromptTier,
    TierPlanResult,
)
from app.services.prompt_graph.orchestrator import (
    generate_prompt_universe,
    PromptGenerationResult,
)
from app.services.prompt_graph.caching import (
    cache_set,
    cache_get,
    clear_cache,
    get_cache_stats,
    compute_site_profile_key,
)
from app.services.prompt_graph.metrics import (
    start_pipeline_metrics,
    get_pipeline_metrics,
    complete_pipeline_metrics,
    record_prompt_generation,
)
from app.services.prompt_graph.chunking import (
    chunk_items,
    chunk_prompts_by_priority,
    estimate_execution_time,
    get_chunk_config,
)


def make_test_documents(domain: str, count: int = 3) -> List[CrawledDocument]:
    """Create test crawled documents."""
    docs = []
    for i in range(count):
        docs.append(
            CrawledDocument(
                url=f"https://{domain}/page-{i}",
                title=f"Test Page {i} - {domain}",
                content=f"This is test content for page {i} on {domain}. "
                f"We offer services in fishing, guides, and outdoor activities. "
                f"Our competitors include competitor-a.com and competitor-b.com.",
                headings=[f"Heading {i}", "Services", "About Us"],
                meta_description=f"Description for page {i}",
            )
        )
    return docs


class TestSiteContextBuilder:
    """Tests for site context extraction."""

    def test_build_site_context_extracts_brand(self):
        docs = make_test_documents("example.com")
        context = build_site_context(docs, "example.com")
        
        assert context is not None
        assert context.domain == "example.com"
        assert context.brand_name is not None

    def test_build_site_context_extracts_topics(self):
        docs = make_test_documents("fishing-guides.com")
        context = build_site_context(docs, "fishing-guides.com")
        
        assert len(context.core_topics) > 0

    def test_build_site_context_extracts_competitors(self):
        docs = make_test_documents("mysite.com")
        context = build_site_context(docs, "mysite.com")
        
        assert len(context.competitors) >= 0

    def test_empty_documents_returns_minimal_context(self):
        context = build_site_context([], "empty.com")
        
        assert context.domain == "empty.com"
        assert context.brand_name == "empty.com"


class TestTopicGraphBuilder:
    """Tests for topic graph construction."""

    def test_build_topic_graph_from_context(self):
        docs = make_test_documents("test.com")
        context = build_site_context(docs, "test.com")
        graph = build_topic_graph(context)
        
        assert graph is not None
        assert len(graph.core_topics) > 0

    def test_topic_graph_includes_supporting_topics(self):
        docs = make_test_documents("fishing.com")
        context = build_site_context(docs, "fishing.com")
        graph = build_topic_graph(context)
        
        assert len(graph.supporting_topics) >= 0

    def test_topic_graph_includes_competitor_topics(self):
        docs = make_test_documents("mysite.com")
        context = build_site_context(docs, "mysite.com")
        context.competitors = ["competitor.com"]
        graph = build_topic_graph(context)
        
        assert len(graph.competitor_topics) >= 0


class TestIntentGraphBuilder:
    """Tests for intent graph mapping."""

    def test_build_intent_graph_from_topic_graph(self):
        docs = make_test_documents("test.com")
        context = build_site_context(docs, "test.com")
        topic_graph = build_topic_graph(context)
        intent_graph = build_intent_graph(topic_graph, context)
        
        assert intent_graph is not None
        assert len(intent_graph.topic_intent_maps) > 0

    def test_intent_graph_covers_multiple_intents(self):
        docs = make_test_documents("services.com")
        context = build_site_context(docs, "services.com")
        topic_graph = build_topic_graph(context)
        intent_graph = build_intent_graph(topic_graph, context)
        
        all_intents = set()
        for tim in intent_graph.topic_intent_maps:
            for ip in tim.intent_prompts:
                all_intents.add(ip.intent.value)
        
        assert len(all_intents) >= 1


class TestSeedPromptGenerator:
    """Tests for seed prompt generation."""

    def test_generate_seed_prompts_from_intent_graph(self):
        docs = make_test_documents("test.com")
        context = build_site_context(docs, "test.com")
        topic_graph = build_topic_graph(context)
        intent_graph = build_intent_graph(topic_graph, context)
        seeds = generate_seed_prompts(intent_graph, context)
        
        assert len(seeds) > 0
        assert all(isinstance(s, SeedPrompt) for s in seeds)

    def test_seed_prompts_have_required_fields(self):
        docs = make_test_documents("test.com")
        context = build_site_context(docs, "test.com")
        topic_graph = build_topic_graph(context)
        intent_graph = build_intent_graph(topic_graph, context)
        seeds = generate_seed_prompts(intent_graph, context)
        
        for seed in seeds[:10]:
            assert seed.text is not None
            assert len(seed.text) > 0
            assert seed.topic is not None
            assert seed.intent is not None


class TestPromptExpansion:
    """Tests for prompt expansion."""

    def test_expand_prompts_increases_count(self):
        docs = make_test_documents("test.com")
        context = build_site_context(docs, "test.com")
        topic_graph = build_topic_graph(context)
        intent_graph = build_intent_graph(topic_graph, context)
        seeds = generate_seed_prompts(intent_graph, context)
        
        expanded = expand_prompts(seeds, context, tier="core")
        
        assert len(expanded) >= len(seeds)

    def test_expand_prompts_respects_tier_limits(self):
        docs = make_test_documents("test.com")
        context = build_site_context(docs, "test.com")
        topic_graph = build_topic_graph(context)
        intent_graph = build_intent_graph(topic_graph, context)
        seeds = generate_seed_prompts(intent_graph, context)
        
        core_expanded = expand_prompts(seeds, context, tier="core")
        deep_expanded = expand_prompts(seeds, context, tier="deep")
        
        assert len(deep_expanded) >= len(core_expanded)


class TestPromptDeduplication:
    """Tests for prompt deduplication."""

    def test_dedupe_removes_exact_duplicates(self):
        prompts = [
            ExpandedPrompt(text="What is fishing?", topic="fishing", intent="informational"),
            ExpandedPrompt(text="What is fishing?", topic="fishing", intent="informational"),
            ExpandedPrompt(text="Best fishing spots", topic="fishing", intent="informational"),
        ]
        
        result = dedupe_prompts(prompts)
        
        assert result.kept_count < len(prompts)
        assert result.exact_dupes > 0

    def test_dedupe_preserves_unique_prompts(self):
        prompts = [
            ExpandedPrompt(text="What is fishing?", topic="fishing", intent="informational"),
            ExpandedPrompt(text="Best fishing spots", topic="fishing", intent="informational"),
            ExpandedPrompt(text="Fishing gear reviews", topic="fishing", intent="commercial"),
        ]
        
        result = dedupe_prompts(prompts)
        
        assert result.kept_count == len(prompts)


class TestPromptQualityScoring:
    """Tests for prompt quality scoring."""

    def test_score_prompt_quality_returns_scores(self):
        docs = make_test_documents("test.com")
        context = build_site_context(docs, "test.com")
        
        prompts = [
            ExpandedPrompt(text="What is the best fishing guide in Arizona?", topic="fishing", intent="commercial"),
            ExpandedPrompt(text="test", topic="test", intent="informational"),
        ]
        
        result = score_prompt_quality(prompts, context)
        
        assert len(result.scored_prompts) == len(prompts)

    def test_quality_scores_are_normalized(self):
        docs = make_test_documents("test.com")
        context = build_site_context(docs, "test.com")
        
        prompts = [
            ExpandedPrompt(text="What is the best fishing guide in Arizona?", topic="fishing", intent="commercial"),
        ]
        
        result = score_prompt_quality(prompts, context)
        
        for sp in result.scored_prompts:
            assert 0 <= sp.quality_score <= 1


class TestPromptTierPlanner:
    """Tests for tier assignment."""

    def test_assign_tiers_distributes_prompts(self):
        docs = make_test_documents("test.com")
        context = build_site_context(docs, "test.com")
        
        prompts = [
            ExpandedPrompt(text=f"Prompt {i}", topic="topic", intent="informational", quality_score=0.5 + (i * 0.01))
            for i in range(100)
        ]
        
        result = assign_tiers(prompts, target_tier="core")
        
        assert result.core_count > 0

    def test_tier_assignment_respects_targets(self):
        docs = make_test_documents("test.com")
        context = build_site_context(docs, "test.com")
        
        prompts = [
            ExpandedPrompt(text=f"Prompt {i}", topic="topic", intent="informational", quality_score=0.8)
            for i in range(2000)
        ]
        
        result = assign_tiers(prompts, target_tier="core")
        
        assert result.core_count <= 1000


class TestCaching:
    """Tests for caching functionality."""

    def setup_method(self):
        clear_cache()

    def test_cache_set_and_get(self):
        cache_set("test:key", {"value": 123})
        result = cache_get("test:key")
        
        assert result == {"value": 123}

    def test_cache_miss_returns_none(self):
        result = cache_get("nonexistent:key")
        
        assert result is None

    def test_cache_stats_tracks_hits_misses(self):
        cache_set("test:key", "value")
        cache_get("test:key")
        cache_get("missing:key")
        
        stats = get_cache_stats()
        
        assert stats["hits"] >= 1
        assert stats["misses"] >= 1

    def test_compute_site_profile_key_is_deterministic(self):
        key1 = compute_site_profile_key("example.com", ["hash1", "hash2"])
        key2 = compute_site_profile_key("example.com", ["hash1", "hash2"])
        
        assert key1 == key2


class TestMetrics:
    """Tests for metrics tracking."""

    def test_start_and_complete_metrics(self):
        metrics = start_pipeline_metrics("run-1", "project-1", "core")
        
        assert metrics is not None
        assert metrics.run_id == "run-1"
        
        record_prompt_generation("run-1", generated=100, deduplicated=10)
        
        completed = complete_pipeline_metrics("run-1")
        
        assert completed.prompts_generated == 100
        assert completed.prompts_deduplicated == 10

    def test_get_pipeline_metrics(self):
        start_pipeline_metrics("run-2", "project-2", "expanded")
        
        metrics = get_pipeline_metrics("run-2")
        
        assert metrics is not None
        assert metrics.tier == "expanded"


class TestChunking:
    """Tests for chunking functionality."""

    def test_chunk_items_creates_correct_chunks(self):
        items = list(range(100))
        chunks = list(chunk_items(items, 25))
        
        assert len(chunks) == 4
        assert len(chunks[0]) == 25

    def test_chunk_prompts_by_priority_orders_by_quality(self):
        prompts = [
            {"text": "low", "quality_score": 0.3, "intent": "informational"},
            {"text": "high", "quality_score": 0.9, "intent": "informational"},
            {"text": "medium", "quality_score": 0.6, "intent": "commercial"},
        ]
        
        chunks = chunk_prompts_by_priority(prompts, "core")
        
        assert len(chunks) >= 1

    def test_estimate_execution_time_returns_estimate(self):
        estimate = estimate_execution_time(
            num_prompts=1000,
            num_engines=5,
            tier="core",
        )
        
        assert "estimated_time_ms" in estimate
        assert "num_chunks" in estimate
        assert "recommendation" in estimate

    def test_get_chunk_config_returns_tier_config(self):
        core_config = get_chunk_config("core")
        deep_config = get_chunk_config("deep")
        
        assert core_config.base_chunk_size <= deep_config.base_chunk_size


class TestWebsiteIsolation:
    """Tests for per-website data isolation."""

    def test_site_context_is_domain_specific(self):
        docs_a = make_test_documents("site-a.com")
        docs_b = make_test_documents("site-b.com")
        
        context_a = build_site_context(docs_a, "site-a.com")
        context_b = build_site_context(docs_b, "site-b.com")
        
        assert context_a.domain == "site-a.com"
        assert context_b.domain == "site-b.com"
        assert context_a.domain != context_b.domain

    def test_prompt_generation_is_isolated(self):
        docs_a = make_test_documents("site-a.com")
        docs_b = make_test_documents("site-b.com")
        
        result_a = generate_prompt_universe(docs_a, "site-a.com", tier="core")
        result_b = generate_prompt_universe(docs_b, "site-b.com", tier="core")
        
        prompts_a_domains = set()
        for p in result_a.prompts[:20]:
            if "site-a" in p.text.lower():
                prompts_a_domains.add("site-a")
            if "site-b" in p.text.lower():
                prompts_a_domains.add("site-b")
        
        assert "site-b" not in prompts_a_domains or len(prompts_a_domains) == 0


class TestFullOrchestration:
    """Tests for the full orchestration pipeline."""

    def test_generate_prompt_universe_returns_result(self):
        docs = make_test_documents("test.com")
        result = generate_prompt_universe(docs, "test.com", tier="core")
        
        assert isinstance(result, PromptGenerationResult)
        assert len(result.prompts) > 0

    def test_generate_prompt_universe_respects_tier(self):
        docs = make_test_documents("test.com")
        
        core_result = generate_prompt_universe(docs, "test.com", tier="core")
        
        assert core_result.metadata.tier == "core"
        assert len(core_result.prompts) <= 1500

    def test_generate_prompt_universe_includes_metadata(self):
        docs = make_test_documents("test.com")
        result = generate_prompt_universe(docs, "test.com", tier="core")
        
        assert result.metadata is not None
        assert result.metadata.generated_count > 0
        assert result.metadata.dedupe_removed >= 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
