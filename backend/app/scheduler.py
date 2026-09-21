import time
import logging
import requests
from apscheduler.schedulers.background import BackgroundScheduler

from .database import SessionLocal
from .config import settings
from . import models, crud

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api-sentinel.scheduler")


def check_endpoint(endpoint_id: int):
    """Ping a single endpoint and record the result. Runs in its own DB session
    so it's safe to call both from the scheduler thread and from a request handler
    (used for the 'check immediately after creation' and 'check-now' features)."""
    db = SessionLocal()
    try:
        endpoint = db.query(models.Endpoint).filter(
            models.Endpoint.id == endpoint_id, models.Endpoint.is_active == True  # noqa: E712
        ).first()
        if not endpoint:
            return

        start = time.perf_counter()
        try:
            response = requests.request(
                endpoint.method,
                endpoint.url,
                timeout=settings.REQUEST_TIMEOUT_SECONDS,
            )
            elapsed_ms = (time.perf_counter() - start) * 1000
            is_up = response.status_code == endpoint.expected_status
            crud.record_check(
                db, endpoint.id, round(elapsed_ms, 2), response.status_code, is_up,
                error_message=None if is_up else f"Unexpected status {response.status_code}",
            )
            logger.info(f"[{endpoint.name}] {response.status_code} in {elapsed_ms:.0f}ms")
        except requests.RequestException as exc:
            elapsed_ms = (time.perf_counter() - start) * 1000
            crud.record_check(
                db, endpoint.id, round(elapsed_ms, 2), None, False, error_message=str(exc)
            )
            logger.warning(f"[{endpoint.name}] FAILED: {exc}")
    finally:
        db.close()


def check_all_active_endpoints():
    db = SessionLocal()
    try:
        endpoints = db.query(models.Endpoint).filter(models.Endpoint.is_active == True).all()  # noqa: E712
    finally:
        db.close()

    for endpoint in endpoints:
        check_endpoint(endpoint.id)


scheduler = BackgroundScheduler()


def start_scheduler(interval_seconds: int | None = None):
    interval = interval_seconds or settings.SWEEP_INTERVAL_SECONDS
    scheduler.add_job(
        check_all_active_endpoints,
        "interval",
        seconds=interval,
        id="health_check_sweep",
        replace_existing=True,
        max_instances=1,
    )
    scheduler.start()
    logger.info(f"Scheduler started, sweeping every {interval}s")


def shutdown_scheduler():
    scheduler.shutdown(wait=False)
