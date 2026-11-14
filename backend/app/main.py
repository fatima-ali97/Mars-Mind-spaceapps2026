from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import health, chat

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend service for Mars Mind - NASA Space Apps 2026 platform with mission telemetry and AI Chatbot."
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(chat.router, prefix=settings.API_PREFIX)


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint verifying API availability and documentation links."""
    return {
        "message": "Welcome to the Mars Mind Backend API",
        "documentation": "/docs",
        "health": f"{settings.API_PREFIX}/health",
        "chat": f"{settings.API_PREFIX}/chat"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)

