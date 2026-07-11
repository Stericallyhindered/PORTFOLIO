"""
Claude Site Analyzer - Uses Claude AI to analyze crawled website content.

This is the backbone of the prompt generation system. Claude parses the entire
website content and recognizes:
- Industry (fishing, software, retail, etc.)
- Products and services offered
- Target audiences
- Pain points solved
- Use cases
- Features and benefits
- Competitors
- Core and supporting topics

The extracted site intelligence drives all prompt generation.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import TYPE_CHECKING

import httpx

from app.core.config import settings

if TYPE_CHECKING:
    from app.services.crawler import CrawledDocument

logger = logging.getLogger(__name__)


CLAUDE_SITE_UNDERSTANDING_PROMPT = """You are a market intelligence extraction system analyzing a website.

I will provide you with the complete crawled content from every page of a website including:
- Page URLs and titles
- All headings (H1, H2, H3, H4)
- Full page text content
- Navigation items and footer links
- Schema.org structured data

Your task is to deeply analyze this content and extract EVERYTHING about what this business does.

Extract the following:

1. **Brand Identity**
   - brand_name: The company/brand name
   - tagline: Main value proposition if present

2. **Industry Classification**
   - primary_industry: Main industry (e.g., "fishing guides", "software", "e-commerce", "legal services")
   - subindustries: Related niches (e.g., "bass fishing", "tournament fishing", "Arizona outdoors")

3. **Products** (what they sell - physical or digital)
   - List each product with a short description

4. **Services** (what they offer)
   - List each service with a short description

5. **Target Audiences**
   - Who are their customers? (e.g., "tournament anglers", "recreational fishermen", "families", "small businesses")

6. **Use Cases**
   - How do customers use their products/services?

7. **Pain Points**
   - What problems do they solve for customers?

8. **Features & Benefits**
   - Key capabilities and advantages

9. **Claims & Social Proof**
   - Marketing claims, testimonials, statistics

10. **Competitors**
    - Any competitors mentioned or implied

11. **Core Topics**
    - Main topics the website covers (these should be specific to the business, NOT generic marketing terms)
    - Examples: "bass fishing Arizona", "guided fishing trips", "fishing tournaments", "lake conditions"

12. **Supporting Topics**
    - Secondary topics (e.g., "fishing tips", "gear reviews", "tournament results")

13. **Locations**
    - Geographic areas served or mentioned

14. **FAQ Questions**
    - Questions found in the content

CRITICAL RULES:
- Extract ONLY from the provided content - do not hallucinate
- Use concise, normalized phrases
- Be thorough - scan every piece of content
- Focus on what makes this specific business unique
- Core topics should be SPECIFIC to this business (e.g., "bass fishing Arizona" not "generative engine optimization")
- DO NOT include generic marketing/SEO terms unless the business is actually about marketing/SEO

Return valid JSON only with this structure:
{
  "brand_name": "string",
  "tagline": "string or null",
  "primary_industry": "string",
  "subindustries": ["string"],
  "products": [{"name": "string", "description": "string"}],
  "services": [{"name": "string", "description": "string"}],
  "audiences": ["string"],
  "use_cases": ["string"],
  "pain_points": ["string"],
  "features": ["string"],
  "claims": ["string"],
  "competitors": ["string"],
  "core_topics": ["string"],
  "supporting_topics": ["string"],
  "locations": ["string"],
  "faq_questions": ["string"]
}"""


@dataclass
class ClaudeSiteAnalysis:
    """Structured result from Claude's site analysis."""
    brand_name: str
    tagline: str | None
    primary_industry: str
    subindustries: list[str]
    products: list[dict]
    services: list[dict]
    audiences: list[str]
    use_cases: list[str]
    pain_points: list[str]
    features: list[str]
    claims: list[str]
    competitors: list[str]
    core_topics: list[str]
    supporting_topics: list[str]
    locations: list[str]
    faq_questions: list[str]
    raw_response: dict


def _format_page_for_claude(doc: "CrawledDocument", max_text_chars: int = 12000) -> str:
    """Format a single crawled page for Claude's analysis."""
    headings_text = "\n".join(doc.headings[:60]) if doc.headings else "None"
    text_preview = doc.text[:max_text_chars] if doc.text else "None"
    schema_text = ", ".join(doc.schema_types) if doc.schema_types else "None"
    
    return f"""
--- PAGE: {doc.url} ---
Title: {doc.title or 'N/A'}
H1: {doc.h1 or 'N/A'}
Meta Description: {doc.meta_description or 'N/A'}

Headings:
{headings_text}

Page Content:
{text_preview}

Schema Types: {schema_text}
"""


def _aggregate_site_content(
    documents: list["CrawledDocument"],
    brand_name: str,
    domain: str,
    max_total_chars: int = 180000,
) -> str:
    """Aggregate all page content into a single prompt for Claude."""
    page_summaries: list[str] = []
    total_chars = 0
    
    # Prioritize homepage and important pages
    sorted_docs = sorted(
        documents,
        key=lambda d: (
            0 if d.url.rstrip("/").endswith(domain.replace("www.", "")) else 1,
            0 if "/about" in d.url.lower() else 1,
            0 if "/service" in d.url.lower() else 1,
            0 if "/product" in d.url.lower() else 1,
            len(d.text) if d.text else 0,
        ),
    )
    
    for doc in sorted_docs:
        # Adjust text length based on remaining budget
        remaining = max_total_chars - total_chars
        if remaining <= 0:
            break
        
        max_text = min(12000, remaining // max(1, len(sorted_docs) - len(page_summaries)))
        page_content = _format_page_for_claude(doc, max_text_chars=max_text)
        
        if total_chars + len(page_content) > max_total_chars:
            # Truncate this page to fit
            page_content = page_content[:remaining]
        
        page_summaries.append(page_content)
        total_chars += len(page_content)
    
    return f"""WEBSITE: {domain}
BRAND: {brand_name}
TOTAL PAGES CRAWLED: {len(documents)}

{chr(10).join(page_summaries)}
"""


async def analyze_site_with_claude(
    documents: list["CrawledDocument"],
    brand_name: str,
    domain: str,
) -> ClaudeSiteAnalysis:
    """
    Use Claude to analyze all crawled pages and extract comprehensive site intelligence.
    
    This is the backbone of the prompt generation system - Claude parses the entire
    website content and recognizes the industry, products, services, and generates
    the site profile that drives all prompt generation.
    
    Args:
        documents: List of crawled documents from the website
        brand_name: The brand name from the project
        domain: The website domain
        
    Returns:
        ClaudeSiteAnalysis with all extracted site intelligence
        
    Raises:
        ValueError: If Claude API key is not configured
        RuntimeError: If Claude analysis fails
    """
    if not settings.ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY is not configured. Claude is required for site analysis.")
    
    # Aggregate all page content
    full_site_content = _aggregate_site_content(documents, brand_name, domain)
    
    logger.info(f"Analyzing site {domain} with Claude. Content size: {len(full_site_content)} chars, {len(documents)} pages")
    
    # Models to try in order of preference
    models_to_try = [
        "claude-sonnet-4-20250514",
        "claude-3-7-sonnet-latest",
        "claude-3-5-sonnet-latest",
        "claude-3-7-sonnet-20250219",
        "claude-3-5-sonnet-20241022",
        "claude-3-5-sonnet-20240620",
    ]
    
    last_error: Exception | None = None
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        for model_name in models_to_try:
            try:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": settings.ANTHROPIC_API_KEY,
                        "anthropic-version": "2023-06-01",
                    },
                    json={
                        "model": model_name,
                        "max_tokens": 8000,
                        "messages": [
                            {
                                "role": "user",
                                "content": f"{CLAUDE_SITE_UNDERSTANDING_PROMPT}\n\n{full_site_content}",
                            }
                        ],
                    },
                )
                
                if response.status_code == 404:
                    logger.warning(f"Claude model not found: {model_name}, trying next...")
                    continue
                
                if response.status_code >= 400:
                    logger.warning(f"Claude API error ({response.status_code}): {response.text[:500]}")
                    last_error = RuntimeError(f"Claude API error: {response.status_code}")
                    continue
                
                payload = response.json()
                content = payload.get("content", [])
                
                if not content or not isinstance(content, list):
                    logger.warning(f"Empty response from Claude model {model_name}")
                    continue
                
                response_text = content[0].get("text", "")
                
                # Parse JSON from response
                try:
                    # Try to extract JSON from the response
                    json_start = response_text.find("{")
                    json_end = response_text.rfind("}") + 1
                    
                    if json_start >= 0 and json_end > json_start:
                        json_str = response_text[json_start:json_end]
                        analysis_data = json.loads(json_str)
                    else:
                        raise ValueError("No JSON found in response")
                    
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse Claude JSON response: {e}")
                    logger.debug(f"Response text: {response_text[:1000]}")
                    last_error = e
                    continue
                
                logger.info(f"Successfully analyzed site {domain} with Claude model {model_name}")
                
                return ClaudeSiteAnalysis(
                    brand_name=analysis_data.get("brand_name", brand_name),
                    tagline=analysis_data.get("tagline"),
                    primary_industry=analysis_data.get("primary_industry", ""),
                    subindustries=analysis_data.get("subindustries", []),
                    products=analysis_data.get("products", []),
                    services=analysis_data.get("services", []),
                    audiences=analysis_data.get("audiences", []),
                    use_cases=analysis_data.get("use_cases", []),
                    pain_points=analysis_data.get("pain_points", []),
                    features=analysis_data.get("features", []),
                    claims=analysis_data.get("claims", []),
                    competitors=analysis_data.get("competitors", []),
                    core_topics=analysis_data.get("core_topics", []),
                    supporting_topics=analysis_data.get("supporting_topics", []),
                    locations=analysis_data.get("locations", []),
                    faq_questions=analysis_data.get("faq_questions", []),
                    raw_response=analysis_data,
                )
                
            except httpx.TimeoutException:
                logger.warning(f"Timeout with Claude model {model_name}")
                last_error = RuntimeError(f"Claude request timed out with model {model_name}")
                continue
            except Exception as e:
                logger.warning(f"Error with Claude model {model_name}: {e}")
                last_error = e
                continue
    
    # All models failed
    raise RuntimeError(f"Claude site analysis failed after trying all models. Last error: {last_error}")


def analysis_to_dict(analysis: ClaudeSiteAnalysis) -> dict:
    """Convert ClaudeSiteAnalysis to a dictionary for storage."""
    return {
        "brand_name": analysis.brand_name,
        "tagline": analysis.tagline,
        "primary_industry": analysis.primary_industry,
        "subindustries": analysis.subindustries,
        "products": analysis.products,
        "services": analysis.services,
        "audiences": analysis.audiences,
        "use_cases": analysis.use_cases,
        "pain_points": analysis.pain_points,
        "features": analysis.features,
        "claims": analysis.claims,
        "competitors": analysis.competitors,
        "core_topics": analysis.core_topics,
        "supporting_topics": analysis.supporting_topics,
        "locations": analysis.locations,
        "faq_questions": analysis.faq_questions,
    }


CLAUDE_PROMPT_GENERATION_PROMPT = """You are a GEO (Generative Engine Optimization) expert generating search prompts to test how well AI search engines (ChatGPT, Perplexity, Gemini, Claude) can find and recommend a business.

I will provide you with:
1. Complete website content from every page
2. The number of prompts to generate

Your task is to generate EXACTLY {num_prompts} search prompts that a real person would type into an AI assistant when looking for this type of business/service/product.

CRITICAL RULES:
1. Prompts must be NATURAL - how a real person would ask an AI assistant
2. Prompts must be SPECIFIC to this business's industry, services, and location
3. Include a MIX of:
   - Direct brand queries ("Who is [brand]?", "Tell me about [brand]")
   - Service/product queries ("Best [service] in [location]", "Who offers [service]?")
   - Comparison queries ("Compare [brand] to competitors", "Best [service] companies")
   - Problem-solving queries ("I need help with [pain point]", "How do I find [service]?")
   - Location-based queries ("[service] near [location]", "[service] in [city]")
   - Review/reputation queries ("Is [brand] good?", "Reviews for [service] in [location]")
4. DO NOT generate generic marketing/SEO questions
5. DO NOT ask about "GEO optimization" unless the business is actually about GEO
6. Each prompt should be something a potential customer would actually search

Return ONLY a JSON array of strings, exactly {num_prompts} prompts:
["prompt 1", "prompt 2", "prompt 3", ...]"""


async def generate_prompts_with_claude(
    documents: list["CrawledDocument"],
    brand_name: str,
    domain: str,
    num_prompts: int = 20,
) -> list[str]:
    """
    Use Claude to generate business-specific GEO audit prompts.
    
    This function analyzes the website content and generates natural search
    prompts that real users would type into AI assistants when looking for
    this type of business.
    
    Args:
        documents: List of crawled documents from the website
        brand_name: The brand name from the project
        domain: The website domain
        num_prompts: Number of prompts to generate
        
    Returns:
        List of generated prompt strings
        
    Raises:
        ValueError: If Claude API key is not configured
        RuntimeError: If Claude prompt generation fails
    """
    if not settings.ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY is not configured. Claude is required for prompt generation.")
    
    # Aggregate site content (smaller budget for prompt generation)
    full_site_content = _aggregate_site_content(documents, brand_name, domain, max_total_chars=100000)
    
    prompt_instruction = CLAUDE_PROMPT_GENERATION_PROMPT.format(num_prompts=num_prompts)
    
    logger.info(f"Generating {num_prompts} prompts for {domain} with Claude. Content size: {len(full_site_content)} chars")
    
    models_to_try = [
        "claude-sonnet-4-20250514",
        "claude-3-7-sonnet-latest",
        "claude-3-5-sonnet-latest",
        "claude-3-7-sonnet-20250219",
        "claude-3-5-sonnet-20241022",
        "claude-3-5-sonnet-20240620",
    ]
    
    last_error: Exception | None = None
    
    async with httpx.AsyncClient(timeout=90.0) as client:
        for model_name in models_to_try:
            try:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": settings.ANTHROPIC_API_KEY,
                        "anthropic-version": "2023-06-01",
                    },
                    json={
                        "model": model_name,
                        "max_tokens": 4000,
                        "messages": [
                            {
                                "role": "user",
                                "content": f"{prompt_instruction}\n\n{full_site_content}",
                            }
                        ],
                    },
                )
                
                if response.status_code == 404:
                    logger.warning(f"Claude model not found: {model_name}, trying next...")
                    continue
                
                if response.status_code >= 400:
                    logger.warning(f"Claude API error ({response.status_code}): {response.text[:500]}")
                    last_error = RuntimeError(f"Claude API error: {response.status_code}")
                    continue
                
                payload = response.json()
                content = payload.get("content", [])
                
                if not content or not isinstance(content, list):
                    logger.warning(f"Empty response from Claude model {model_name}")
                    continue
                
                response_text = content[0].get("text", "")
                
                # Parse JSON array from response
                try:
                    json_start = response_text.find("[")
                    json_end = response_text.rfind("]") + 1
                    
                    if json_start >= 0 and json_end > json_start:
                        json_str = response_text[json_start:json_end]
                        prompts = json.loads(json_str)
                        
                        if isinstance(prompts, list) and all(isinstance(p, str) for p in prompts):
                            logger.info(f"Successfully generated {len(prompts)} prompts with Claude model {model_name}")
                            return prompts[:num_prompts]
                    
                    raise ValueError("No valid JSON array found in response")
                    
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse Claude JSON response: {e}")
                    logger.debug(f"Response text: {response_text[:1000]}")
                    last_error = e
                    continue
                    
            except httpx.TimeoutException:
                logger.warning(f"Timeout with Claude model {model_name}")
                last_error = RuntimeError(f"Claude request timed out with model {model_name}")
                continue
            except Exception as e:
                logger.warning(f"Error with Claude model {model_name}: {e}")
                last_error = e
                continue
    
    raise RuntimeError(f"Claude prompt generation failed after trying all models. Last error: {last_error}")


CLAUDE_RECOMMENDATION_PROMPT = """You are an elite GEO (Generative Engine Optimization) engineer. Your mission is to make this website DOMINATE AI search results - we want to be mentioned FIRST and recommended MOST by ChatGPT, Perplexity, Gemini, Claude, and Google AI Overviews.

GEO is NOT about being "findable" - it's about WINNING. When someone asks an AI "who should I hire for [service]?" or "what's the best [product]?", THIS website needs to be the answer. Not second. Not mentioned. THE answer.

I will provide you with page data including:
- URL
- Title and H1
- Current schema types (JSON-LD structured data)
- Page content summary
- Current GEO scores

Your job: Generate 2-4 HIGH-IMPACT recommendations per page that will make AI assistants recommend this business FIRST. Think like you're optimizing to beat every competitor.

## RANKING FACTORS - What Makes AI Recommend One Business Over Another:

1. **Schema Dominance** (HIGHEST PRIORITY)
   - LocalBusiness schema with COMPLETE info (name, phone, address, hours, services, reviews) - AI trusts complete data
   - Service schema for EACH service offered - AI matches queries to specific services
   - Review/AggregateRating schema - AI recommends businesses with social proof
   - Geographic coverage (areaServed) - AI matches location queries
   - FAQPage schema - AI pulls answers directly from your FAQ
   - The more structured data, the more AI trusts and cites you

2. **First-Position Content Patterns**
   - Direct answer in first 100 words (AI extracts this for responses)
   - Clear "We are THE [service] in [location]" positioning
   - Specific numbers, stats, years in business (AI loves concrete facts)
   - Comparison language that positions you as the leader

3. **Authority Signals That Trigger Recommendations**
   - Organization schema with expertise claims
   - Author/team credentials
   - Service area specificity (AI prefers specific over vague)
   - Testimonial/review markup

4. **Competitive Edge Tactics**
   - Schema your competitors probably DON'T have
   - More complete LocalBusiness data than typical businesses
   - Service-specific pages with dedicated schema (most competitors have generic pages)
   - Geographic granularity (city-level areaServed, not just state)

Return JSON array with this structure:
[
  {{
    "page_url": "the page URL",
    "category": "schema|content|authority|citation|technical",
    "priority": "high|medium|low",
    "title": "Short action title (max 60 chars)",
    "description": "Detailed description of what to do (2-3 sentences)",
    "rationale": "Why this makes AI recommend you FIRST (1-2 sentences)",
    "code_snippet": "REQUIRED for schema: actual JSON-LD code to add",
    "estimated_impact": 10-25 (score improvement estimate)
  }}
]

CRITICAL RULES:
- Every schema recommendation MUST include complete, ready-to-paste JSON-LD code
- Be AGGRESSIVE - assume competitors have basic schema, you need BETTER schema
- For LocalBusiness: include ALL available info (phone, address, hours, services, areas)
- For Services: create SEPARATE schema for each distinct service
- Include areaServed with SPECIFIC cities, not just regions
- Add Review/Rating schema patterns even if suggesting they collect reviews
- Think "What would make an AI say 'I recommend [this business]' instead of 'Here are some options'"
- Maximum 4 recommendations per page, prioritize what moves the needle MOST"""


@dataclass
class PageRecommendation:
    """A single GEO recommendation for a specific page."""
    page_url: str
    category: str
    priority: str
    title: str
    description: str
    rationale: str
    code_snippet: str | None
    estimated_impact: float


async def generate_page_recommendations_with_claude(
    pages_data: list[dict],
    brand_name: str,
    domain: str,
    industry: str = "",
) -> list[PageRecommendation]:
    """
    Use Claude to generate page-specific GEO recommendations.
    
    Args:
        pages_data: List of dicts with page info (url, title, h1, schema_types, content_preview, scores)
        brand_name: The brand name
        domain: The website domain
        industry: The business industry (if known)
        
    Returns:
        List of PageRecommendation objects
    """
    if not settings.ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY is not configured.")
    
    # Format pages for Claude
    pages_text = f"WEBSITE: {domain}\nBRAND: {brand_name}\nINDUSTRY: {industry or 'Unknown'}\n\n"
    
    for page in pages_data[:20]:  # Limit to 20 pages
        schema_str = ", ".join(page.get("schema_types", [])) or "None detected"
        pages_text += f"""
--- PAGE: {page.get('url', 'Unknown')} ---
Title: {page.get('title', 'N/A')}
H1: {page.get('h1', 'N/A')}
Current Schema: {schema_str}
Content Preview: {(page.get('content_preview', '') or '')[:500]}
Scores: Technical={page.get('technical_score', 'N/A')}, Extractability={page.get('extractability_score', 'N/A')}, Citation={page.get('citation_score', 'N/A')}
"""
    
    logger.info(f"Generating recommendations for {len(pages_data)} pages on {domain}")
    
    models_to_try = [
        "claude-sonnet-4-20250514",
        "claude-3-7-sonnet-latest",
        "claude-3-5-sonnet-latest",
    ]
    
    last_error: Exception | None = None
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        for model_name in models_to_try:
            try:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": settings.ANTHROPIC_API_KEY,
                        "anthropic-version": "2023-06-01",
                    },
                    json={
                        "model": model_name,
                        "max_tokens": 8000,
                        "messages": [
                            {
                                "role": "user",
                                "content": f"{CLAUDE_RECOMMENDATION_PROMPT}\n\n{pages_text}",
                            }
                        ],
                    },
                )
                
                if response.status_code == 404:
                    continue
                
                if response.status_code >= 400:
                    last_error = RuntimeError(f"Claude API error: {response.status_code}")
                    continue
                
                payload = response.json()
                content = payload.get("content", [])
                
                if not content:
                    continue
                
                response_text = content[0].get("text", "")
                
                # Parse JSON array
                json_start = response_text.find("[")
                json_end = response_text.rfind("]") + 1
                
                if json_start >= 0 and json_end > json_start:
                    json_str = response_text[json_start:json_end]
                    recommendations_data = json.loads(json_str)
                    
                    recommendations = []
                    for rec in recommendations_data:
                        recommendations.append(PageRecommendation(
                            page_url=rec.get("page_url", ""),
                            category=rec.get("category", "content"),
                            priority=rec.get("priority", "medium"),
                            title=rec.get("title", "")[:255],
                            description=rec.get("description", ""),
                            rationale=rec.get("rationale", ""),
                            code_snippet=rec.get("code_snippet"),
                            estimated_impact=float(rec.get("estimated_impact", 15)),
                        ))
                    
                    logger.info(f"Generated {len(recommendations)} recommendations with Claude")
                    return recommendations
                    
            except Exception as e:
                last_error = e
                continue
    
    raise RuntimeError(f"Claude recommendation generation failed. Last error: {last_error}")
