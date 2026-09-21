from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import models, schemas, crud
from .database import engine, get_db
from .config import settings
from .scheduler import start_scheduler, shutdown_scheduler, check_endpoint

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API Sentinel",
    version="2.0.0",
    description="Real-time API reliability monitoring — uptime, latency, and failure-rate tracking.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    start_scheduler()


@app.on_event("shutdown")
def on_shutdown():
    shutdown_scheduler()


@app.get("/health")
def health():
    """Used by Render's health check and by the frontend to detect backend availability."""
    return {"status": "ok"}


@app.post("/apis", response_model=schemas.EndpointOut)
def create_api(data: schemas.EndpointCreate, db: Session = Depends(get_db)):
    endpoint = crud.create_endpoint(db, data)
    check_endpoint(endpoint.id)  # immediate check so the UI doesn't sit at "pending"
    return endpoint


@app.get("/apis", response_model=list[schemas.EndpointStatus])
def list_apis(db: Session = Depends(get_db)):
    endpoints = crud.get_endpoints(db)
    return [crud.build_status(db, e) for e in endpoints]


@app.get("/apis/summary", response_model=schemas.SummaryOut)
def apis_summary(db: Session = Depends(get_db)):
    endpoints = crud.get_endpoints(db)
    statuses = [crud.build_status(db, e) for e in endpoints]
    return crud.build_summary(statuses)


@app.get("/apis/{endpoint_id}", response_model=schemas.EndpointStatus)
def get_api(endpoint_id: int, db: Session = Depends(get_db)):
    endpoint = crud.get_endpoint(db, endpoint_id)
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    return crud.build_status(db, endpoint)


@app.patch("/apis/{endpoint_id}", response_model=schemas.EndpointOut)
def update_api(endpoint_id: int, data: schemas.EndpointUpdate, db: Session = Depends(get_db)):
    endpoint = crud.get_endpoint(db, endpoint_id)
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    return crud.update_endpoint(db, endpoint, data)


@app.delete("/apis/{endpoint_id}")
def delete_api(endpoint_id: int, db: Session = Depends(get_db)):
    endpoint = crud.get_endpoint(db, endpoint_id)
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    crud.delete_endpoint(db, endpoint)
    return {"detail": "deleted"}


@app.get("/apis/{endpoint_id}/history", response_model=list[schemas.HealthCheckOut])
def api_history(endpoint_id: int, limit: int = 100, db: Session = Depends(get_db)):
    endpoint = crud.get_endpoint(db, endpoint_id)
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    return crud.get_history(db, endpoint_id, limit)


@app.post("/apis/{endpoint_id}/check-now", response_model=schemas.EndpointStatus)
def force_check(endpoint_id: int, db: Session = Depends(get_db)):
    endpoint = crud.get_endpoint(db, endpoint_id)
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    check_endpoint(endpoint_id)
    db.refresh(endpoint)
    return crud.build_status(db, endpoint)
