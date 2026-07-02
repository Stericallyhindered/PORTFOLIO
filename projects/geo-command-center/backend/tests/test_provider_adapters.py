import pytest

pytest.importorskip("pydantic_settings")

from app.services.provider_adapters import resolve_engine_adapter


def test_engine_resolution_covers_required_engines():
    assert resolve_engine_adapter("chatgpt") is not None
    assert resolve_engine_adapter("google-ai-overviews") is not None
    assert resolve_engine_adapter("perplexity") is not None
    assert resolve_engine_adapter("gemini") is not None
    assert resolve_engine_adapter("claude") is not None


def test_engine_resolution_rejects_unknown_engine():
    with pytest.raises(ValueError):
        resolve_engine_adapter("unknown-engine")
