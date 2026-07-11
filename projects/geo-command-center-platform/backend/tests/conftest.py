"""
Pytest configuration and fixtures for GEO Command Center tests.
"""

import os
import sys
from pathlib import Path

import pytest

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("SECRET_KEY", "test-secret-key")


@pytest.fixture(autouse=True)
def reset_caches():
    """Reset caches before each test."""
    from app.services.prompt_graph.caching import clear_cache
    from app.services.prompt_graph.metrics import _active_metrics
    
    clear_cache()
    _active_metrics.clear()
    yield
    clear_cache()
    _active_metrics.clear()


@pytest.fixture
def sample_crawled_documents():
    """Provide sample crawled documents for testing."""
    from app.services.prompt_graph.site_context_builder import CrawledDocument
    
    return [
        CrawledDocument(
            url="https://example.com/",
            title="Example Company - Home",
            content="Welcome to Example Company. We provide excellent services in software development, consulting, and training.",
            headings=["Welcome", "Our Services", "Contact Us"],
            meta_description="Example Company - Your trusted partner for software solutions.",
        ),
        CrawledDocument(
            url="https://example.com/services",
            title="Our Services - Example Company",
            content="We offer software development, cloud consulting, and technical training. Our competitors include TechCorp and DevSolutions.",
            headings=["Services", "Development", "Consulting", "Training"],
            meta_description="Professional software services from Example Company.",
        ),
        CrawledDocument(
            url="https://example.com/about",
            title="About Us - Example Company",
            content="Founded in 2020, Example Company has grown to serve clients worldwide. Our team of experts delivers quality solutions.",
            headings=["About", "Our Team", "Our History"],
            meta_description="Learn about Example Company and our mission.",
        ),
    ]


@pytest.fixture
def sample_site_context(sample_crawled_documents):
    """Provide a sample site context for testing."""
    from app.services.prompt_graph.site_context_builder import build_site_context
    
    return build_site_context(sample_crawled_documents, "example.com")


@pytest.fixture
def sample_topic_graph(sample_site_context):
    """Provide a sample topic graph for testing."""
    from app.services.prompt_graph.topic_graph_builder import build_topic_graph
    
    return build_topic_graph(sample_site_context)


@pytest.fixture
def sample_intent_graph(sample_topic_graph, sample_site_context):
    """Provide a sample intent graph for testing."""
    from app.services.prompt_graph.intent_graph_builder import build_intent_graph
    
    return build_intent_graph(sample_topic_graph, sample_site_context)


@pytest.fixture
def sample_seed_prompts(sample_intent_graph, sample_site_context):
    """Provide sample seed prompts for testing."""
    from app.services.prompt_graph.seed_prompt_generator import generate_seed_prompts
    
    return generate_seed_prompts(sample_intent_graph, sample_site_context)
