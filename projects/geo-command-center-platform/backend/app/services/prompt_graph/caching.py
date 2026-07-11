"""
Prompt Generation Caching - Performance optimization for high-volume runs.

Implements caching at multiple levels:
1. Site profile cache - keyed by domain + content hash
2. Prompt generation cache - keyed by site profile hash + tier + strategy version
3. Provider response cache - keyed by prompt + engine + settings (time-windowed)
4. Extraction cache - keyed by response hash
"""

from __future__ import annotations

import hashlib
import json
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from .site_context_builder import SiteContext

logger = logging.getLogger(__name__)

CACHE_TTL_HOURS = {
    "site_profile": 24,
    "prompt_generation": 12,
    "provider_response": 6,
    "extraction": 24,
}

_memory_cache: dict[str, tuple[Any, datetime]] = {}


@dataclass
class CacheStats:
    """Statistics about cache usage."""
    
    hits: int = 0
    misses: int = 0
    evictions: int = 0
    total_entries: int = 0

    def hit_rate(self) -> float:
        total = self.hits + self.misses
        return (self.hits / total) * 100 if total > 0 else 0.0


_cache_stats = CacheStats()


def _compute_hash(data: str | dict | list) -> str:
    """Compute a stable hash for cache keys."""
    if isinstance(data, (dict, list)):
        data = json.dumps(data, sort_keys=True)
    return hashlib.sha256(data.encode("utf-8")).hexdigest()[:32]


def _is_expired(cached_at: datetime, ttl_hours: int) -> bool:
    """Check if a cache entry is expired."""
    return datetime.utcnow() > cached_at + timedelta(hours=ttl_hours)


def _evict_expired():
    """Remove expired entries from the cache."""
    global _memory_cache, _cache_stats
    
    now = datetime.utcnow()
    expired_keys = []
    
    for key, (_, cached_at) in _memory_cache.items():
        cache_type = key.split(":")[0]
        ttl = CACHE_TTL_HOURS.get(cache_type, 12)
        if _is_expired(cached_at, ttl):
            expired_keys.append(key)
    
    for key in expired_keys:
        del _memory_cache[key]
        _cache_stats.evictions += 1
    
    _cache_stats.total_entries = len(_memory_cache)


def get_cache_stats() -> dict:
    """Get current cache statistics."""
    _evict_expired()
    return {
        "hits": _cache_stats.hits,
        "misses": _cache_stats.misses,
        "evictions": _cache_stats.evictions,
        "total_entries": _cache_stats.total_entries,
        "hit_rate": round(_cache_stats.hit_rate(), 2),
    }


def clear_cache():
    """Clear all cached entries."""
    global _memory_cache, _cache_stats
    _memory_cache = {}
    _cache_stats = CacheStats()


def compute_site_profile_key(domain: str, content_hashes: list[str]) -> str:
    """Compute cache key for site profile."""
    combined = f"{domain}:{':'.join(sorted(content_hashes))}"
    return f"site_profile:{_compute_hash(combined)}"


def compute_prompt_generation_key(
    site_profile_hash: str,
    tier: str,
    strategy_version: str = "v1",
) -> str:
    """Compute cache key for prompt generation."""
    combined = f"{site_profile_hash}:{tier}:{strategy_version}"
    return f"prompt_generation:{_compute_hash(combined)}"


def compute_provider_response_key(
    prompt_text: str,
    engine_name: str,
    settings: dict | None = None,
) -> str:
    """Compute cache key for provider response."""
    settings_str = json.dumps(settings or {}, sort_keys=True)
    combined = f"{prompt_text}:{engine_name}:{settings_str}"
    return f"provider_response:{_compute_hash(combined)}"


def compute_extraction_key(response_text: str) -> str:
    """Compute cache key for extraction results."""
    return f"extraction:{_compute_hash(response_text)}"


def cache_get(key: str) -> Any | None:
    """Get a value from the cache."""
    global _cache_stats
    
    _evict_expired()
    
    if key in _memory_cache:
        value, cached_at = _memory_cache[key]
        cache_type = key.split(":")[0]
        ttl = CACHE_TTL_HOURS.get(cache_type, 12)
        
        if not _is_expired(cached_at, ttl):
            _cache_stats.hits += 1
            logger.debug(f"Cache hit: {key[:50]}...")
            return value
    
    _cache_stats.misses += 1
    logger.debug(f"Cache miss: {key[:50]}...")
    return None


def cache_set(key: str, value: Any):
    """Set a value in the cache."""
    global _memory_cache, _cache_stats
    
    _memory_cache[key] = (value, datetime.utcnow())
    _cache_stats.total_entries = len(_memory_cache)
    logger.debug(f"Cache set: {key[:50]}...")


def cache_site_profile(
    domain: str,
    content_hashes: list[str],
    site_context: "SiteContext",
) -> str:
    """Cache a site profile and return its key."""
    key = compute_site_profile_key(domain, content_hashes)
    cache_set(key, site_context.to_dict())
    return key


def get_cached_site_profile(
    domain: str,
    content_hashes: list[str],
) -> dict | None:
    """Get a cached site profile."""
    key = compute_site_profile_key(domain, content_hashes)
    return cache_get(key)


def cache_prompt_generation(
    site_profile_hash: str,
    tier: str,
    prompts: list[dict],
    metadata: dict,
    strategy_version: str = "v1",
) -> str:
    """Cache prompt generation results and return the key."""
    key = compute_prompt_generation_key(site_profile_hash, tier, strategy_version)
    cache_set(key, {"prompts": prompts, "metadata": metadata})
    return key


def get_cached_prompt_generation(
    site_profile_hash: str,
    tier: str,
    strategy_version: str = "v1",
) -> dict | None:
    """Get cached prompt generation results."""
    key = compute_prompt_generation_key(site_profile_hash, tier, strategy_version)
    return cache_get(key)


def cache_provider_response(
    prompt_text: str,
    engine_name: str,
    response: dict,
    settings: dict | None = None,
) -> str:
    """Cache a provider response and return the key."""
    key = compute_provider_response_key(prompt_text, engine_name, settings)
    cache_set(key, response)
    return key


def get_cached_provider_response(
    prompt_text: str,
    engine_name: str,
    settings: dict | None = None,
) -> dict | None:
    """Get a cached provider response."""
    key = compute_provider_response_key(prompt_text, engine_name, settings)
    return cache_get(key)


def cache_extraction(
    response_text: str,
    extraction_result: dict,
) -> str:
    """Cache extraction results and return the key."""
    key = compute_extraction_key(response_text)
    cache_set(key, extraction_result)
    return key


def get_cached_extraction(response_text: str) -> dict | None:
    """Get cached extraction results."""
    key = compute_extraction_key(response_text)
    return cache_get(key)
