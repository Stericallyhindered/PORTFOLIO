import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.db.session import SessionLocal
from redis import Redis

from app.api.router import api_router
from app.core.config import settings

app = FastAPI(title=settings.APP_NAME)

# Allow browser-origin frontend calls during local development and deployment previews.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.middleware("http")
async def request_timing_middleware(request: Request, call_next):
    started = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - started) * 1000
    response.headers["x-response-time-ms"] = f"{elapsed_ms:.2f}"
    return response


@app.get("/health")
def health():
    return {"ok": True, "service": "geo-command-center-backend"}


@app.get("/ready")
def ready():
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception as exc:  # noqa: BLE001
        return JSONResponse(status_code=503, content={"ok": False, "db": str(exc)})
    try:
        redis = Redis.from_url(settings.REDIS_URL)
        redis.ping()
    except Exception as exc:  # noqa: BLE001
        return JSONResponse(status_code=503, content={"ok": False, "redis": str(exc)})
    return {"ok": True}
