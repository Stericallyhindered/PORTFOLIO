"""
Prompt Graph Orchestrator - Main entry point for the 10k prompt generation pipeline.

Orchestrates the full 8-layer pipeline:
1. Site Context Builder - Extract structured site intelligence
2. Topic Graph Builder - Build topic taxonomy
3. Intent Graph Builder - Map intents across topics
4. Seed Prompt Generator - Generate high-quality seeds
5. Prompt Expansion Engine - Expand to thousands of prompts
6. Prompt Dedupe Engine - Remove duplicates
7. Prompt Quality Engine - Score and filter
8. Prompt Tier Planner - Organize into execution tiers
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import TYPE_CHECKING
from uuid import uuid4

from .site_context_builder import SiteContext, build_site_context, build_site_context_with_claude
from .topic_graph_builder import TopicGraph, build_topic_graph
from .intent_graph_builder import IntentGraph, build_intent_graph
from .seed_prompt_generator import SeedPrompt, generate_seed_prompts
from .prompt_expansion_engine import ExpandedPrompt, expand_prompts
from .prompt_dedupe_engine import DedupeResult, dedupe_prompts
from .prompt_quality_engine import QualityResult, score_prompt_quality
from .prompt_tier_planner import TierPlanResult, PromptTier, assign_tiers

if TYPE_CHECKING:
    from app.services.crawler import CrawledDocument


logger = logging.getLogger(__name__)


@dataclass
class GenerationMetadata:
    """Metadata about the generation run."""
    
    generation_id: str = field(default_factory=lambda: str(uuid4()))
    started_at: datetime = field(default_factory=datetime.utcnow)
    completed_at: datetime | None = None
    target_tier: str = "core"
    
    site_context_extracted: bool = False
    topic_graph_built: bool = False
    intent_graph_built: bool = False
    seeds_generated: int = 0
    prompts_expanded: int = 0
    prompts_after_dedupe: int = 0
    prompts_after_quality: int = 0
    
    tier1_count: int = 0
    tier2_count: int = 0
    tier3_count: int = 0
    
    dedupe_stats: dict = field(default_factory=dict)
    quality_stats: dict = field(default_factory=dict)
    tier_stats: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "generation_id": self.generation_id,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "target_tier": self.target_tier,
            "site_context_extracted": self.site_context_extracted,
            "topic_graph_built": self.topic_graph_built,
            "intent_graph_built": self.intent_graph_built,
            "seeds_generated": self.seeds_generated,
            "prompts_expanded": self.prompts_expanded,
            "prompts_after_dedupe": self.prompts_after_dedupe,
            "prompts_after_quality": self.prompts_after_quality,
            "tier1_count": self.tier1_count,
            "tier2_count": self.tier2_count,
            "tier3_count": self.tier3_count,
            "dedupe_stats": self.dedupe_stats,
            "quality_stats": self.quality_stats,
            "tier_stats": self.tier_stats,
        }


@dataclass
class PromptGenerationResult:
    """Complete result of prompt generation."""
    
    metadata: GenerationMetadata
    site_context: SiteContext | None = None
    topic_graph: TopicGraph | None = None
    intent_graph: IntentGraph | None = None
    tier_plan: TierPlanResult | None = None
    
    core_prompts: list[ExpandedPrompt] = field(default_factory=list)
    expanded_prompts: list[ExpandedPrompt] = field(default_factory=list)
    deep_prompts: list[ExpandedPrompt] = field(default_factory=list)

    def get_prompts_for_tier(self, tier: str) -> list[ExpandedPrompt]:
        """Get prompts for a specific tier."""
        if tier == "core":
            return self.core_prompts
        elif tier == "expanded":
            return self.expanded_prompts
        elif tier == "deep":
            return self.deep_prompts
        return self.core_prompts

    def to_summary_dict(self) -> dict:
        return {
            "metadata": self.metadata.to_dict(),
            "site_context": self.site_context.to_dict() if self.site_context else None,
            "topic_graph": self.topic_graph.to_dict() if self.topic_graph else None,
            "intent_graph": self.intent_graph.to_dict() if self.intent_graph else None,
            "tier_plan": self.tier_plan.to_dict() if self.tier_plan else None,
            "core_prompt_count": len(self.core_prompts),
            "expanded_prompt_count": len(self.expanded_prompts),
            "deep_prompt_count": len(self.deep_prompts),
        }


def generate_prompt_universe(
    brand_name: str,
    domain: str,
    documents: list["CrawledDocument"],
    known_competitors: list[str] | None = None,
    target_tier: str = "core",
    use_claude: bool = True,
) -> PromptGenerationResult:
    """
    Generate a complete prompt universe from crawled documents.
    
    This is the main entry point for the 10k prompt generation pipeline.
    Uses Claude AI by default to analyze the website and extract comprehensive
    site intelligence for generating website-specific prompts.
    
    Args:
        brand_name: The brand/company name
        domain: The primary domain being audited
        documents: List of crawled documents from the site
        known_competitors: Optional list of known competitors
        target_tier: Target tier for generation ("core", "expanded", "deep")
        use_claude: Whether to use Claude for site analysis (default: True)
    
    Returns:
        PromptGenerationResult with prompts organized by tier
    """
    import asyncio
    
    metadata = GenerationMetadata(target_tier=target_tier)
    
    logger.info(f"Starting prompt generation for {domain} (tier: {target_tier})")
    
    logger.info("Layer 1: Building site context...")
    
    if use_claude:
        logger.info("  - Using Claude AI for site intelligence extraction...")
        try:
            # Run async Claude analysis in sync context
            site_context = asyncio.run(build_site_context_with_claude(
                brand_name=brand_name,
                domain=domain,
                documents=documents,
                known_competitors=known_competitors,
            ))
            logger.info("  - Claude analysis successful")
        except Exception as e:
            logger.warning(f"  - Claude analysis failed ({e}), falling back to regex extraction")
            site_context = build_site_context(
                brand_name=brand_name,
                domain=domain,
                documents=documents,
                known_competitors=known_competitors,
            )
    else:
        site_context = build_site_context(
            brand_name=brand_name,
            domain=domain,
            documents=documents,
            known_competitors=known_competitors,
        )
    
    metadata.site_context_extracted = True
    logger.info(f"  - Extracted {len(site_context.core_topics)} core topics")
    logger.info(f"  - Found {len(site_context.competitors)} competitors")
    logger.info(f"  - Industries: {site_context.industries[:3]}")
    logger.info(f"  - Products: {site_context.products[:5]}")
    logger.info(f"  - Services: {site_context.services[:5]}")
    
    logger.info("Layer 2: Building topic graph...")
    topic_graph = build_topic_graph(site_context)
    metadata.topic_graph_built = True
    logger.info(f"  - Total topics: {topic_graph.topic_count()}")
    
    logger.info("Layer 3: Building intent graph...")
    intent_graph = build_intent_graph(topic_graph, site_context)
    metadata.intent_graph_built = True
    logger.info(f"  - Intent prompts: {len(intent_graph.all_prompts())}")
    
    logger.info("Layer 4: Generating seed prompts...")
    seeds = generate_seed_prompts(site_context, topic_graph, intent_graph)
    metadata.seeds_generated = len(seeds)
    logger.info(f"  - Generated {len(seeds)} seed prompts")
    
    logger.info(f"Layer 5: Expanding prompts (tier: {target_tier})...")
    expanded = expand_prompts(seeds, site_context, target_tier=target_tier)
    metadata.prompts_expanded = len(expanded)
    logger.info(f"  - Expanded to {len(expanded)} prompts")
    
    logger.info("Layer 6: Deduplicating prompts...")
    dedupe_result = dedupe_prompts(expanded)
    metadata.prompts_after_dedupe = len(dedupe_result.kept_prompts)
    metadata.dedupe_stats = dedupe_result.to_dict()
    logger.info(f"  - After dedupe: {len(dedupe_result.kept_prompts)} prompts")
    logger.info(f"  - Removed: {dedupe_result.dropped_count} duplicates")
    
    logger.info("Layer 7: Scoring prompt quality...")
    quality_result = score_prompt_quality(dedupe_result.kept_prompts, site_context)
    metadata.prompts_after_quality = len(quality_result.scored_prompts)
    metadata.quality_stats = quality_result.to_dict()
    logger.info(f"  - After quality filter: {len(quality_result.scored_prompts)} prompts")
    logger.info(f"  - Average quality score: {quality_result.avg_score:.3f}")
    
    logger.info("Layer 8: Planning tiers...")
    tier_target = PromptTier(target_tier) if target_tier in ("core", "expanded", "deep") else PromptTier.CORE
    tier_plan = assign_tiers(quality_result.scored_prompts, target_tier=tier_target)
    metadata.tier_stats = tier_plan.to_dict()
    metadata.tier1_count = tier_plan.core.actual_count
    metadata.tier2_count = tier_plan.expanded.actual_count - tier_plan.core.actual_count
    metadata.tier3_count = tier_plan.deep.actual_count - tier_plan.expanded.actual_count
    logger.info(f"  - Core tier: {tier_plan.core.actual_count} prompts")
    logger.info(f"  - Expanded tier: {tier_plan.expanded.actual_count} prompts")
    logger.info(f"  - Deep tier: {tier_plan.deep.actual_count} prompts")
    
    metadata.completed_at = datetime.utcnow()
    
    result = PromptGenerationResult(
        metadata=metadata,
        site_context=site_context,
        topic_graph=topic_graph,
        intent_graph=intent_graph,
        tier_plan=tier_plan,
        core_prompts=tier_plan.core.prompts,
        expanded_prompts=tier_plan.expanded.prompts,
        deep_prompts=tier_plan.deep.prompts,
    )
    
    logger.info(f"Prompt generation complete. Total: {len(tier_plan.deep.prompts)} prompts")
    
    return result


def generate_prompts_from_site_context(
    site_context: SiteContext,
    target_tier: str = "core",
) -> PromptGenerationResult:
    """
    Generate prompts from an existing site context.
    Useful for re-generation without re-crawling.
    """
    metadata = GenerationMetadata(target_tier=target_tier)
    metadata.site_context_extracted = True
    
    topic_graph = build_topic_graph(site_context)
    metadata.topic_graph_built = True
    
    intent_graph = build_intent_graph(topic_graph, site_context)
    metadata.intent_graph_built = True
    
    seeds = generate_seed_prompts(site_context, topic_graph, intent_graph)
    metadata.seeds_generated = len(seeds)
    
    expanded = expand_prompts(seeds, site_context, target_tier=target_tier)
    metadata.prompts_expanded = len(expanded)
    
    dedupe_result = dedupe_prompts(expanded)
    metadata.prompts_after_dedupe = len(dedupe_result.kept_prompts)
    metadata.dedupe_stats = dedupe_result.to_dict()
    
    quality_result = score_prompt_quality(dedupe_result.kept_prompts, site_context)
    metadata.prompts_after_quality = len(quality_result.scored_prompts)
    metadata.quality_stats = quality_result.to_dict()
    
    tier_target = PromptTier(target_tier) if target_tier in ("core", "expanded", "deep") else PromptTier.CORE
    tier_plan = assign_tiers(quality_result.scored_prompts, target_tier=tier_target)
    metadata.tier_stats = tier_plan.to_dict()
    metadata.tier1_count = tier_plan.core.actual_count
    metadata.tier2_count = tier_plan.expanded.actual_count - tier_plan.core.actual_count
    metadata.tier3_count = tier_plan.deep.actual_count - tier_plan.expanded.actual_count
    
    metadata.completed_at = datetime.utcnow()
    
    return PromptGenerationResult(
        metadata=metadata,
        site_context=site_context,
        topic_graph=topic_graph,
        intent_graph=intent_graph,
        tier_plan=tier_plan,
        core_prompts=tier_plan.core.prompts,
        expanded_prompts=tier_plan.expanded.prompts,
        deep_prompts=tier_plan.deep.prompts,
    )
