"""Main FastAPI application for MarsMind AI."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.api.mars_map import router as mars_map_router

app = FastAPI(
    title="MarsMind AI",
    description="NASA Mars terrain analysis API",
    version="1.0.0",
)

# Allow the React frontend to communicate with FastAPI.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the Mars and terrain endpoints.
app.include_router(api_router)
app.include_router(mars_map_router, prefix="/api")


@app.get("/api/health")
def health_check():
    """Return the current backend health status."""
    return {"status": "operational"}
