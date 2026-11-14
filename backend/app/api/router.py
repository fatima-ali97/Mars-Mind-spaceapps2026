"""Shared API router. Dev 3 adds the missions and AI routers here."""
from fastapi import APIRouter
from app.api.routes import mars, terrain

api_router = APIRouter(prefix="/api")
api_router.include_router(mars.router)
api_router.include_router(terrain.router)
