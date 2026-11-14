from fastapi import APIRouter
from app.config import settings
from app.models.chat import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint to verify backend operational status."""
    return HealthResponse(
        status="operational",
        service=settings.PROJECT_NAME,
        version=settings.VERSION
    )

