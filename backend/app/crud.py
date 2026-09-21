from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from . import models, schemas


def create_endpoint(db: Session, data: schemas.EndpointCreate) -> models.Endpoint:
    endpoint = models.Endpoint(**data.model_dump())
    db.add(endpoint)
    db.commit()
    db.refresh(endpoint)
    return endpoint


def get_endpoints(db: Session):
    return db.query(models.Endpoint).order_by(models.Endpoint.created_at.asc()).all()


def get_endpoint(db: Session, endpoint_id: int):
    return db.query(models.Endpoint).filter(models.Endpoint.id == endpoint_id).first()


def update_endpoint(db: Session, endpoint: models.Endpoint, data: schemas.EndpointUpdate):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(endpoint, field, value)
    db.commit()
    db.refresh(endpoint)
    return endpoint


def delete_endpoint(db: Session, endpoint: models.Endpoint):
    db.delete(endpoint)
    db.commit()


def record_check(db: Session, endpoint_id: int, response_time_ms, status_code, is_up, error_message=None):
    check = models.HealthCheck(
        endpoint_id=endpoint_id,
        response_time_ms=response_time_ms,
        status_code=status_code,
        is_up=is_up,
        error_message=error_message,
    )
    db.add(check)
    db.commit()
    return check


def get_history(db: Session, endpoint_id: int, limit: int = 100):
    return (
        db.query(models.HealthCheck)
        .filter(models.HealthCheck.endpoint_id == endpoint_id)
        .order_by(models.HealthCheck.checked_at.desc())
        .limit(limit)
        .all()
    )


def build_status(db: Session, endpoint: models.Endpoint) -> schemas.EndpointStatus:
    since = datetime.now(timezone.utc) - timedelta(hours=24)

    last_check = (
        db.query(models.HealthCheck)
        .filter(models.HealthCheck.endpoint_id == endpoint.id)
        .order_by(models.HealthCheck.checked_at.desc())
        .first()
    )

    checks_24h = (
        db.query(models.HealthCheck)
        .filter(
            models.HealthCheck.endpoint_id == endpoint.id,
            models.HealthCheck.checked_at >= since,
        )
        .all()
    )

    total = len(checks_24h)
    up_count = sum(1 for c in checks_24h if c.is_up)
    uptime_percent = round((up_count / total) * 100, 2) if total else 100.0
    failure_rate = round(100 - uptime_percent, 2) if total else 0.0

    if last_check is None:
        current_status = "unknown"
    elif last_check.is_up:
        current_status = "up"
    else:
        current_status = "down"

    recent = (
        db.query(models.HealthCheck)
        .filter(models.HealthCheck.endpoint_id == endpoint.id)
        .order_by(models.HealthCheck.checked_at.desc())
        .limit(10)
        .all()
    )
    recent_latencies = [c.response_time_ms for c in reversed(recent) if c.response_time_ms is not None]

    return schemas.EndpointStatus(
        id=endpoint.id,
        name=endpoint.name,
        url=endpoint.url,
        method=endpoint.method,
        expected_status=endpoint.expected_status,
        check_interval_seconds=endpoint.check_interval_seconds,
        is_active=endpoint.is_active,
        created_at=endpoint.created_at,
        current_status=current_status,
        last_response_time_ms=last_check.response_time_ms if last_check else None,
        last_checked_at=last_check.checked_at if last_check else None,
        uptime_percent_24h=uptime_percent,
        failure_rate_24h=failure_rate,
        total_checks_24h=total,
        recent_latencies=recent_latencies,
    )


def build_summary(statuses: list[schemas.EndpointStatus]) -> schemas.SummaryOut:
    total = len(statuses)
    operational = sum(1 for s in statuses if s.current_status == "up")
    down = sum(1 for s in statuses if s.current_status == "down")
    unknown = sum(1 for s in statuses if s.current_status == "unknown")
    avg_uptime = round(sum(s.uptime_percent_24h for s in statuses) / total, 2) if total else 0.0
    return schemas.SummaryOut(
        total=total, operational=operational, down=down, unknown=unknown, avg_uptime_24h=avg_uptime
    )
