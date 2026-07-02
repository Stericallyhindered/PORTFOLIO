import json
from pathlib import Path
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from app.api.deps import get_scoped_db
from app.models.models import (
    Domain,
    EngineRun,
    GeoScore,
    Page,
    PipelineRun,
    Project,
    Recommendation,
    ReportExport,
)
from app.schemas.geo import ReportGenerateOut
from worker.celery_app import celery

router = APIRouter()
ENGINE_ORDER = ["chatgpt", "google-ai-overviews", "perplexity", "gemini", "claude"]


@router.get("/overview")
def report_overview(project_id: str, scope=Depends(get_scoped_db)):
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    run_count = db.query(EngineRun).filter(EngineRun.project_id == project_id).count()
    open_recommendations = (
        db.query(Recommendation)
        .filter(Recommendation.project_id == project_id, Recommendation.status == "open")
        .count()
    )
    return {
        "project_id": project_id,
        "project_name": project.name,
        "geo_score": 74.2,
        "brand_mention_rate": 0.41,
        "citation_rate": 0.29,
        "engine_run_count": run_count,
        "open_recommendations": open_recommendations,
        "engines": {
            "chatgpt": {"mentions": 6, "citations": 3},
            "google-ai-overviews": {"mentions": 4, "citations": 2},
            "perplexity": {"mentions": 8, "citations": 5},
            "gemini": {"mentions": 3, "citations": 1},
            "claude": {"mentions": 2, "citations": 1},
        },
    }


@router.get("/org-overview")
def org_overview(project_id: str | None = None, scope=Depends(get_scoped_db)):
    db, org_id = scope
    projects = db.query(Project).filter(Project.organization_id == org_id).all()
    if project_id:
        projects = [project for project in projects if project.id == project_id]
    project_ids = [p.id for p in projects]
    if not project_ids:
        return {
            "projects": [],
            "visibility": [],
            "entities": [],
            "reports": [],
        }

    runs = db.query(EngineRun).filter(EngineRun.project_id.in_(project_ids)).all()
    recommendations = (
        db.query(Recommendation).filter(Recommendation.project_id.in_(project_ids)).all()
    )
    exports = db.query(ReportExport).filter(ReportExport.project_id.in_(project_ids)).all()

    visibility: dict[str, dict] = {}
    for run in runs:
        item = visibility.get(run.engine_name) or {
            "engine": run.engine_name,
            "mentions": 0,
            "citations": 0,
            "rows": 0,
        }
        item["rows"] += 1
        text = (run.response_text or "").lower()
        project = next((p for p in projects if p.id == run.project_id), None)
        if project and project.brand_name.lower() in text:
            item["mentions"] += 1
        citations = (run.response_json or {}).get("citations", [])
        item["citations"] += len(citations) if isinstance(citations, list) else 0
        visibility[run.engine_name] = item

    return {
        "projects": [{"id": p.id, "name": p.name, "brandName": p.brand_name} for p in projects],
        "visibility": list(visibility.values()),
        "entities": [
            {"name": p.brand_name, "kind": "Brand", "type": "organization"} for p in projects
        ],
        "reports": [
            {
                "id": e.id,
                "projectId": e.project_id,
                "title": f"{e.report_type.upper()} export",
                "status": "completed",
                "storagePath": e.storage_path,
            }
            for e in exports
        ],
        "tasks": [
            {
                "id": r.id,
                "title": r.title,
                "type": r.category,
                "status": r.status,
                "priority": r.priority,
            }
            for r in recommendations
        ],
    }


@router.delete("/exports/{report_export_id}")
def delete_report_export(report_export_id: str, scope=Depends(get_scoped_db)):
    db, org_id = scope
    row = (
        db.query(ReportExport)
        .join(Project, Project.id == ReportExport.project_id)
        .filter(
            ReportExport.id == report_export_id,
            Project.organization_id == org_id,
        )
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Export not found")

    # Best-effort local artifact cleanup.
    path = Path(row.storage_path)
    if row.storage_path and path.exists():
        try:
            path.unlink()
        except OSError:
            pass

    db.delete(row)
    db.commit()
    return {"ok": True, "deletedId": report_export_id}


@router.get("/content-audits-overview")
def content_audits_overview(
    project_id: str | None = None,
    run_id: str | None = None,
    scope=Depends(get_scoped_db),
):
    db, org_id = scope
    projects = db.query(Project).filter(Project.organization_id == org_id).all()
    if not projects:
        return {
            "websites": [],
            "activeProjectId": None,
            "folders": [],
            "insights": [],
            "packages": [],
            "promptPacks": [],
        }

    active = next((p for p in projects if p.id == project_id), None) if project_id else projects[0]
    if active is None:
        active = projects[0]

    domain_rows = db.query(Domain).filter(Domain.project_id == active.id).all()
    domain_ids = [d.id for d in domain_rows]
    page_rows = (
        db.query(Page).filter(Page.domain_id.in_(domain_ids)).all() if domain_ids else []
    )
    page_by_id = {p.id: p for p in page_rows}

    score_rows = (
        db.query(GeoScore)
        .filter(GeoScore.project_id == active.id, GeoScore.page_id.isnot(None))
        .all()
    )
    rec_rows = db.query(Recommendation).filter(Recommendation.project_id == active.id).all()
    run_rows = (
        db.query(PipelineRun)
        .filter(PipelineRun.project_id == active.id)
        .order_by(PipelineRun.started_at.desc())
        .all()
    )
    engine_rows = (
        db.query(EngineRun)
        .filter(EngineRun.project_id == active.id)
        .order_by(EngineRun.started_at.desc())
        .all()
    )
    for run in run_rows:
        stale_cutoff = datetime.utcnow().timestamp() - (30 * 60)
        started_ts = run.started_at.timestamp() if run.started_at else None
        if (
            run.status in {"queued", "running"}
            and started_ts is not None
            and started_ts < stale_cutoff
        ):
            run.status = "failed"
            run.completed_at = run.completed_at or datetime.utcnow()
            run.progress = min(float(run.progress or 0.0), 0.99)

        if run.status in {"queued", "running"} and run.celery_task_id:
            task_state = celery.AsyncResult(run.celery_task_id).state
            if task_state == "SUCCESS":
                run.status = "completed"
                run.progress = 1.0
                run.completed_at = run.completed_at or datetime.utcnow()
            elif task_state in {"FAILURE", "REVOKED"}:
                run.status = "failed"
                run.completed_at = run.completed_at or datetime.utcnow()
            elif task_state == "STARTED":
                run.status = "running"
    db.commit()
    exports = (
        db.query(ReportExport)
        .filter(
            ReportExport.project_id == active.id,
            ReportExport.report_type.in_(["geo_package_json", "prompt_pack_json"]),
        )
        .all()
    )

    rec_by_page: dict[str, list[Recommendation]] = {}
    for rec in rec_rows:
        if rec.page_id:
            rec_by_page.setdefault(rec.page_id, []).append(rec)

    runs_by_pipeline_id: dict[str, dict[str, EngineRun]] = {}
    for engine_row in engine_rows:
        payload = engine_row.request_payload or {}
        payload_run_id = payload.get("run_id") if isinstance(payload, dict) else None
        if not isinstance(payload_run_id, str) or not payload_run_id:
            continue
        by_engine = runs_by_pipeline_id.setdefault(payload_run_id, {})
        existing = by_engine.get(engine_row.engine_name)
        if existing is None:
            by_engine[engine_row.engine_name] = engine_row
            continue
        existing_started = existing.started_at or datetime.min
        candidate_started = engine_row.started_at or datetime.min
        if candidate_started > existing_started:
            by_engine[engine_row.engine_name] = engine_row

    insights = []
    for score in score_rows:
        page = page_by_id.get(score.page_id or "")
        if not page:
            continue
        associated_run = None
        if run_rows:
            if score.computed_at:
                associated_run = next(
                    (
                        candidate
                        for candidate in run_rows
                        if candidate.started_at and candidate.started_at <= score.computed_at
                    ),
                    None,
                )
            if associated_run is None:
                associated_run = run_rows[0]
        page_recs = rec_by_page.get(page.id, [])
        issues = []
        if (score.extractability_score or 0) < 60:
            issues.append("Low extractability score impacts LLM citation potential.")
        if (score.trust_score or 0) < 60:
            issues.append("Trust signals are weak for AI answer confidence.")
        if (score.citation_score or 0) < 60:
            issues.append("Citation readiness is below competitive threshold.")
        issues.extend([f"{r.category.title()}: {r.title}" for r in page_recs[:2]])

        recommendations = [
            r.description for r in page_recs[:4]
        ] or [
            "Add concise direct-answer blocks and strengthen source-backed statements.",
            "Improve schema alignment and update factual sections for GEO freshness.",
        ]

        associated_run_id = associated_run.id if associated_run else None
        per_engine_rows = (
            runs_by_pipeline_id.get(associated_run_id, {}) if associated_run_id else {}
        )
        engine_evidence = []
        for engine_name in ENGINE_ORDER:
            engine_run = per_engine_rows.get(engine_name)
            if engine_run is None:
                engine_evidence.append(
                    {
                        "engine": engine_name,
                        "score": 0.0,
                        "confidence": 0.1,
                        "summary": "No execution record for this engine in the selected run.",
                    }
                )
                continue

            if engine_run.run_status != "completed":
                engine_evidence.append(
                    {
                        "engine": engine_name,
                        "score": 0.0,
                        "confidence": 0.2,
                        "summary": (
                            f"Engine run status: {engine_run.run_status}. "
                            f"{engine_run.error_message or 'Run did not complete successfully.'}"
                        ),
                    }
                )
                continue

            response_text = engine_run.response_text or ""
            response_json = engine_run.response_json or {}
            citations = response_json.get("citations", []) if isinstance(response_json, dict) else []
            citation_count = len(citations) if isinstance(citations, list) else 0
            brand_mentioned = active.brand_name.lower() in response_text.lower()
            evidence_score = min(100.0, 20.0 + (citation_count * 12.0) + (25.0 if brand_mentioned else 0.0))
            engine_evidence.append(
                {
                    "engine": engine_name,
                    "score": round(evidence_score, 3),
                    "confidence": 0.82 if citation_count > 0 else 0.65,
                    "summary": (
                        f"Real run evidence: status=completed, citations={citation_count}, "
                        f"brandMentioned={'yes' if brand_mentioned else 'no'}."
                    ),
                }
            )

        insights.append(
            {
                "id": score.id,
                "url": page.url,
                "score": score.composite_score,
                "auditDate": score.computed_at.isoformat() if score.computed_at else None,
                "runId": associated_run.id if associated_run else None,
                "issues": issues[:5],
                "recommendations": recommendations[:5],
                "dimensions": [
                    {
                        "id": "technicalOptimization",
                        "score": score.technical_score or 0,
                        "status": "good" if (score.technical_score or 0) >= 70 else "needs-work",
                    },
                    {
                        "id": "aiComprehension",
                        "score": score.extractability_score or 0,
                        "status": "good" if (score.extractability_score or 0) >= 70 else "needs-work",
                    },
                    {
                        "id": "citationAuthority",
                        "score": score.citation_score or 0,
                        "status": "good" if (score.citation_score or 0) >= 70 else "needs-work",
                    },
                ],
                "confidence": 0.78,
                "currentVsImproved": [
                    {
                        "location": page.url,
                        "whyThisMatters": "Clear structured answers increase retrieval and citation likelihood.",
                        "current": "Current page structure underperforms on GEO extraction signals.",
                        "improved": "Add explicit definition and evidence-backed answer block in first section.",
                        "implementationEffort": "medium",
                        "citationLikelihood": int(score.citation_score or 50),
                        "dimension": "aiComprehension",
                    }
                ],
                "engineEvidence": [
                    *engine_evidence
                ],
                "schemaSuggestions": [
                    {
                        "targetUrl": page.url,
                        "recommendedNodes": ["Organization", "Service", "FAQPage"],
                        "insertionPoint": "<head>",
                        "why": "Structured schema improves AI parsing and source attribution.",
                    }
                ],
                "geoAiOptimizations": [
                    {
                        "category": "content",
                        "priority": "high",
                        "action": "Add direct answer summary and cited proof points near top.",
                        "whyItImprovesAiDiscovery": "Improves extractability and quoteability for LLM answer generation.",
                    }
                ],
            }
        )

    if run_id:
        insights = [insight for insight in insights if insight.get("runId") == run_id]

    folders = [
        {
            "folderDate": r.started_at.isoformat() if r.started_at else "",
            "count": 1,
            "runId": r.id,
            "status": r.status,
        }
        for r in run_rows
    ]
    package_rows = [
        {
            "id": e.id,
            "title": "GEO Package",
            "createdAt": e.generated_at.isoformat() if e.generated_at else "",
            "status": "completed",
            "storagePath": e.storage_path,
        }
        for e in exports
        if e.report_type == "geo_package_json"
    ]
    prompt_pack_rows = [
        {
            "id": e.id,
            "createdAt": e.generated_at.isoformat() if e.generated_at else "",
            "storagePath": e.storage_path,
        }
        for e in exports
        if e.report_type == "prompt_pack_json"
    ]

    return {
        "websites": [
            {
                "id": p.id,
                "websiteUrl": p.primary_domain or p.slug,
                "name": p.name,
            }
            for p in projects
        ],
        "activeProjectId": active.id,
        "folders": folders,
        "insights": insights,
        "packages": package_rows,
        "promptPacks": prompt_pack_rows,
    }


@router.post("/generate")
def generate_report(
    project_id: str, report_type: str = "json", scope=Depends(get_scoped_db)
) -> ReportGenerateOut:
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    base_dir = Path("artifacts") / "reports" / org_id / project_id
    base_dir.mkdir(parents=True, exist_ok=True)
    extension = "json" if report_type not in {"csv", "pdf"} else report_type
    filename = f"{report_type}-report-{project_id}.{extension}"
    output_path = base_dir / filename
    overview = report_overview(project_id=project_id, scope=scope)
    if report_type == "csv":
        rows = [
            "metric,value",
            f"project_id,{overview['project_id']}",
            f"geo_score,{overview['geo_score']}",
            f"brand_mention_rate,{overview['brand_mention_rate']}",
            f"citation_rate,{overview['citation_rate']}",
            f"open_recommendations,{overview['open_recommendations']}",
        ]
        output_path.write_text("\n".join(rows), encoding="utf-8")
    elif report_type == "pdf":
        # Plain-text PDF fallback payload for artifact consistency.
        pdf_like = (
            "GEO Command Center Report\n\n"
            f"Project: {overview['project_name']}\n"
            f"GEO Score: {overview['geo_score']}\n"
            f"Brand Mention Rate: {overview['brand_mention_rate']}\n"
            f"Citation Rate: {overview['citation_rate']}\n"
        )
        output_path.write_text(pdf_like, encoding="utf-8")
    else:
        output_path.write_text(json.dumps(overview, indent=2), encoding="utf-8")

    export = ReportExport(
        project_id=project_id,
        report_type=report_type,
        storage_path=str(output_path),
    )
    db.add(export)
    db.commit()
    db.refresh(export)
    return ReportGenerateOut(report_export_id=export.id, storage_path=export.storage_path)


@router.get("/{report_id}/download")
def download_report(report_id: str, scope=Depends(get_scoped_db)):
    db, org_id = scope
    row = (
        db.query(ReportExport)
        .join(Project, Project.id == ReportExport.project_id)
        .filter(ReportExport.id == report_id, Project.organization_id == org_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Report export not found")
    file_path = Path(row.storage_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Report file missing")
    suffix = file_path.suffix.lower()
    media_type = "application/json"
    if suffix == ".csv":
        media_type = "text/csv"
    elif suffix == ".pdf":
        media_type = "application/pdf"
    return FileResponse(path=file_path, filename=file_path.name, media_type=media_type)
