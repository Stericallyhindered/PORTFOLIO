from celery import Celery

from app.core.config import settings

celery = Celery(
    "geo_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["worker.tasks"],
)
celery.conf.task_routes = {
    "worker.tasks.run_crawl_pipeline": {"queue": "crawl"},
    "worker.tasks.run_prompt_batch": {"queue": "engine_run"},
    "worker.tasks.run_full_geo_pipeline": {"queue": "pipeline"},
}
celery.conf.update(
    # Windows + Python 3.13 is unstable with prefork in local dev;
    # use solo pool so pipeline tasks execute reliably.
    worker_pool="solo",
    worker_concurrency=1,
    worker_prefetch_multiplier=1,
    task_track_started=True,
)
