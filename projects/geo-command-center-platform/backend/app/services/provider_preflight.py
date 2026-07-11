from __future__ import annotations

import asyncio
from typing import List, Optional

from app.services.provider_adapters import SUPPORTED_ENGINES, provider_configuration_status, run_healthchecks


def evaluate_required_engine_preflight(engines_to_check: Optional[List[str]] = None) -> dict:
    """
    Evaluate preflight status for required engines.
    
    Args:
        engines_to_check: Optional list of engine names to check. 
                          If None, checks all SUPPORTED_ENGINES.
    
    Returns:
        Dict with ok status, engine results, and blocking engines.
    """
    if engines_to_check is None:
        engines_to_check = SUPPORTED_ENGINES
    else:
        engines_to_check = [e for e in engines_to_check if e in SUPPORTED_ENGINES]
        if not engines_to_check:
            engines_to_check = SUPPORTED_ENGINES
    
    config = provider_configuration_status()
    health = {item.engine_name: item for item in asyncio.run(run_healthchecks(engines_to_check))}
    engine_results = []
    blocking = []

    for engine_name in engines_to_check:
        configured = bool(config.get(engine_name, {}).get("configured"))
        health_row = health.get(engine_name)
        provider = str(config.get(engine_name, {}).get("provider") or "unknown")
        row = {
            "engine": engine_name,
            "provider": provider,
            "configured": configured,
            "liveVerified": bool(health_row.live_verified) if health_row else False,
            "errorCode": health_row.error_code if health_row else "healthcheck_missing",
            "errorMessage": health_row.error_message if health_row else "No healthcheck result.",
            "checkedAt": health_row.checked_at if health_row else None,
        }
        engine_results.append(row)
        if not row["configured"] or not row["liveVerified"]:
            blocking.append(row)

    return {
        "ok": len(blocking) == 0,
        "requiredEngines": engines_to_check,
        "engines": engine_results,
        "blockingEngines": blocking,
    }
