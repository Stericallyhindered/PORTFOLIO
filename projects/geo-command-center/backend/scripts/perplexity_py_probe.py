import asyncio
import json
import os
from pathlib import Path
import sys

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.services.provider_adapters import PerplexityEngineAdapter


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"')
        if key and key not in os.environ:
            os.environ[key] = value


async def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    load_env_file(repo_root / ".env.local")
    load_env_file(repo_root / "backend" / ".env")

    query = (
        os.sys.argv[1]
        if len(os.sys.argv) > 1
        else "Best Christmas light installation companies in Phoenix with ratings and review volume"
    )
    brand = os.sys.argv[2] if len(os.sys.argv) > 2 else "We Hang Christmas Lights LLC"
    domain = os.sys.argv[3] if len(os.sys.argv) > 3 else "wehangchristmaslights.com"

    adapter = PerplexityEngineAdapter()
    result = await adapter.run_prompt(
        prompt=query,
        context={
            "brand_name": brand,
            "primary_domain": domain,
            "competitors": [],
        },
    )

    metadata = result.metadata or {}
    request = metadata.get("request", {}) if isinstance(metadata, dict) else {}
    payload = {
        "probe": "python",
        "model": metadata.get("model"),
        "promptHash": request.get("promptHash"),
        "userPrompt": request.get("userPrompt"),
        "mentionedBrands": [m.get("entity_name") for m in result.mentions],
        "citationsTop5": [c.get("cited_domain") for c in result.citations[:5]],
        "answerPreview": result.raw_text[:900],
    }
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
