
"""Main FastAPI application for MarsMind AI."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Developer 2 - Mars Map and Terrain
from app.api.router import api_router
from app.api.mars_map import router as mars_map_router

# Main Backend - Configuration and AI Chatbot
from app.config import settings
from app.routers import health, chat


# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "MarsMind AI - NASA Space Apps 2026 platform "
        "with Mars terrain analysis, NASA map integration, "
        "mission telemetry, and AI chatbot."
    ),
)


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(
        dict.fromkeys(
            [
                *settings.ALLOWED_ORIGINS,
                "http://localhost:5173",
                "http://127.0.0.1:5173",
            ]
        )
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Existing Mars and Terrain APIs
app.include_router(api_router)


# NASA Mars Trek Map APIs
app.include_router(
    mars_map_router,
    prefix="/api",
)


# Main Backend Health and Chatbot APIs
app.include_router(
    health.router,
    prefix=settings.API_PREFIX,
)

app.include_router(
    chat.router,
    prefix=settings.API_PREFIX,
)


# Legacy health endpoint for Developer 2
@app.get("/api/health", tags=["Health"], include_in_schema=False)
def legacy_health_check():
    """Return backend operational status."""
    return {"status": "operational"}


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Return API information and documentation links."""
    return {
        "message": "Welcome to the Mars Mind Backend API",
        "documentation": "/docs",
        "health": f"{settings.API_PREFIX}/health",
        "chat": f"{settings.API_PREFIX}/chat",
        "mars_map": "/api/mars/map",
        "terrain": "/api/terrain/grid",
    }


# Run FastAPI locally
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
