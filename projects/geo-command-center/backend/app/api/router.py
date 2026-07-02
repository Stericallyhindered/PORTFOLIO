from fastapi import APIRouter

from app.api.routes import (
    auth,
    citations,
    competitors,
    crawl,
    diagnostics,
    domains,
    engine_runs,
    mentions,
    observability,
    organizations,
    pages,
    prompts,
    projects,
    recommendations,
    reports,
    scoring,
    settings,
    tasks,
    users,
    workflows,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(competitors.router, prefix="/competitors", tags=["competitors"])
api_router.include_router(domains.router, prefix="/domains", tags=["domains"])
api_router.include_router(pages.router, prefix="/pages", tags=["pages"])
api_router.include_router(crawl.router, prefix="/crawl", tags=["crawl"])
api_router.include_router(prompts.router, prefix="/prompts", tags=["prompts"])
api_router.include_router(engine_runs.router, prefix="/engine-runs", tags=["engine-runs"])
api_router.include_router(citations.router, prefix="/citations", tags=["citations"])
api_router.include_router(mentions.router, prefix="/mentions", tags=["mentions"])
api_router.include_router(scoring.router, prefix="/scores", tags=["scores"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(workflows.router, prefix="/workflows", tags=["workflows"])
api_router.include_router(observability.router, prefix="/observability", tags=["observability"])
api_router.include_router(diagnostics.router, prefix="/diagnostics", tags=["diagnostics"])
