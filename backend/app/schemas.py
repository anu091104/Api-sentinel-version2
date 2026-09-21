from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class EndpointCreate(BaseModel):
    name: str = Field(..., max_length=120)
    url: str = Field(..., max_length=500)
    method: str = "GET"
    expected_status: int = 200
    check_interval_seconds: int = 120


class EndpointUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    method: Optional[str] = None
    expected_status: Optional[int] = None
    check_interval_seconds: Optional[int] = None
    is_active: Optional[bool] = None


class HealthCheckOut(BaseModel):
    id: int
    response_time_ms: Optional[float]
    status_code: Optional[int]
    is_up: bool
    error_message: Optional[str]
    checked_at: datetime

    class Config:
        from_attributes = True


class EndpointOut(BaseModel):
    id: int
    name: str
    url: str
    method: str
    expected_status: int
    check_interval_seconds: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class EndpointStatus(EndpointOut):
    current_status: str                    # "up" | "down" | "unknown"
    last_response_time_ms: Optional[float]
    last_checked_at: Optional[datetime]
    uptime_percent_24h: float
    failure_rate_24h: float
    total_checks_24h: int
    recent_latencies: list[float]          # last ~10 response times, oldest first — powers card sparkline


class SummaryOut(BaseModel):
    total: int
    operational: int
    down: int
    unknown: int
    avg_uptime_24h: float
