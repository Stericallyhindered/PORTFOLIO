from datetime import datetime
import asyncio

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_scoped_db
from app.models.models import Citation, EngineRun, Mention, Project, Prompt

from app.services.provider_adapters import resolve_engine_adapter

router = APIRouter()

SUPPORTED_ENGINES = [
    "chatgpt",
    "google-ai-overviews",
    "perplexity",
    "gemini",
    "claude",
]

class EngineRunIn(BaseModel):
    project_id: str
    prompt_id: str
    engine_name: str
    brand_name: str
    primary_domain: str


@router.get("/engines")
def engines():
    return {"engines": SUPPORTED_ENGINES}


@router.post("/run")
async def run_prompt(payload: EngineRunIn, scope=Depends(get_scoped_db)):
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == payload.project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    prompt_row = (
        db.query(Prompt)
        .filter(Prompt.id == payload.prompt_id)
        .first()
    )
    if not prompt_row:
        raise HTTPException(status_code=404, detail="Prompt not found")
    engine = str(payload.engine_name).lower()
    if engine not in SUPPORTED_ENGINES:
        raise HTTPException(status_code=422, detail="Unsupported engine")
    prompt = str(prompt_row.prompt_text)
    context = {
        "brand_name": payload.brand_name,
        "primary_domain": payload.primary_domain,
    }
    run = EngineRun(
        project_id=payload.project_id,
        engine_name=engine,
        engine_variant="default",
        prompt_id=payload.prompt_id,
        run_status="running",
        started_at=datetime.utcnow(),
    )
    db.add(run)
    db.flush()

    adapter = resolve_engine_adapter(engine)
    result = None
    failure = None
    for attempt in range(3):
        try:
            result = await adapter.run_prompt(prompt=prompt, context=context)
            break
        except Exception as exc:  # noqa: BLE001
            failure = str(exc)
            await asyncio.sleep(0.5 * (attempt + 1))
    if result is None:
        run.run_status = "failed"
        run.error_message = failure or "Engine execution failed"
        run.completed_at = datetime.utcnow()
        db.commit()
        raise HTTPException(status_code=502, detail=run.error_message)

    run.run_status = "completed"
    run.response_text = result.raw_text
    run.completed_at = datetime.utcnow()
    run.response_json = {
        "citations": result.citations,
        "mentions": result.mentions,
        "metadata": result.metadata,
    }
    for idx, citation in enumerate(result.citations):
        mention_type = str(citation.get("mention_type", "neutral"))
        db.add(
            Citation(
                engine_run_id=run.id,
                cited_domain=citation.get("cited_domain"),
                cited_url=citation.get("cited_url"),
                citation_order=int(citation.get("citation_order", idx + 1)),
                mention_type=mention_type,
                confidence=float(citation.get("confidence", 0.75)),
                is_brand=mention_type == "brand",
                is_competitor=mention_type == "competitor",
                snippet=citation.get("snippet"),
                title=citation.get("title"),
            )
        )
    for mention in result.mentions:
        db.add(
            Mention(
                engine_run_id=run.id,
                entity_name=mention.get("entity_name", "unknown"),
                entity_type=mention.get("entity_type"),
                sentiment=mention.get("sentiment"),
                position_score=float(mention.get("position_score", 0.5)),
                context_snippet=mention.get("context_snippet"),
            )
        )
    db.commit()
    db.refresh(run)
    return {
        "engine_name": result.engine_name,
        "raw_text": result.raw_text,
        "citations": result.citations,
        "mentions": result.mentions,
        "metadata": result.metadata,
        "engine_run_id": run.id,
    }


@router.get("/")
def list_engine_runs(project_id: str, scope=Depends(get_scoped_db)):
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    rows = (
        db.query(EngineRun)
        .filter(EngineRun.project_id == project_id)
        .order_by(EngineRun.started_at.desc())
        .all()
    )
    return {
        "items": [
            {
                "id": r.id,
                "engineName": r.engine_name,
                "runStatus": r.run_status,
                "promptId": r.prompt_id,
                "startedAt": r.started_at.isoformat() if r.started_at else None,
                "completedAt": r.completed_at.isoformat() if r.completed_at else None,
                "errorMessage": r.error_message,
                "errorCode": (r.response_json or {}).get("errorCode") if isinstance(r.response_json, dict) else None,
                "runId": (r.request_payload or {}).get("run_id") if isinstance(r.request_payload, dict) else None,
            }
            for r in rows
        ]
    }


@router.get("/{run_id}")
def get_engine_run(run_id: str, scope=Depends(get_scoped_db)):
    db, org_id = scope
    row = (
        db.query(EngineRun)
        .join(Project, Project.id == EngineRun.project_id)
        .filter(EngineRun.id == run_id, Project.organization_id == org_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Engine run not found")
    citations = db.query(Citation).filter(Citation.engine_run_id == run_id).all()
    mentions = db.query(Mention).filter(Mention.engine_run_id == run_id).all()
    return {
        "item": {
            "id": row.id,
            "projectId": row.project_id,
            "engineName": row.engine_name,
            "engineVariant": row.engine_variant,
            "promptId": row.prompt_id,
            "runStatus": row.run_status,
            "startedAt": row.started_at.isoformat() if row.started_at else None,
            "completedAt": row.completed_at.isoformat() if row.completed_at else None,
            "responseText": row.response_text,
            "errorMessage": row.error_message,
            "errorCode": (row.response_json or {}).get("errorCode")
            if isinstance(row.response_json, dict)
            else None,
            "citations": [
                {
                    "id": c.id,
                    "citedDomain": c.cited_domain,
                    "citedUrl": c.cited_url,
                    "citationOrder": c.citation_order,
                    "mentionType": c.mention_type,
                    "confidence": c.confidence,
                    "isBrand": c.is_brand,
                    "isCompetitor": c.is_competitor,
                }
                for c in citations
            ],
            "mentions": [
                {
                    "id": m.id,
                    "entityName": m.entity_name,
                    "entityType": m.entity_type,
                    "sentiment": m.sentiment,
                    "positionScore": m.position_score,
                    "contextSnippet": m.context_snippet,
                }
                for m in mentions
            ],
        }
    }
