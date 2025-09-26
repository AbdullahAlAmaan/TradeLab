"""Health check endpoints."""

from fastapi import APIRouter
from datetime import datetime
from app.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Check server health status."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow()
    )
