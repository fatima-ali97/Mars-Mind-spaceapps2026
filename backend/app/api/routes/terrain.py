"""Terrain endpoints; Dev 3 can consume these values for routing."""
from fastapi import APIRouter, Query
from app.core.config import settings
from app.schemas.terrain import TerrainCell, TerrainGrid, TerrainPoint
from app.services.terrain_service import cell_at, cell_for_coordinates, grid_for_region

router = APIRouter(prefix="/terrain", tags=["Terrain intelligence"])

@router.get("/grid", response_model=TerrainGrid)
def grid(region_id: str = settings.default_region, stride: int = Query(1, ge=1, le=100)):
    return grid_for_region(region_id, stride)

@router.get("/cell", response_model=TerrainPoint)
def cell(row: int = Query(ge=0), col: int = Query(ge=0), region_id: str = settings.default_region):
    return {"region_id": region_id, "cell": cell_at(region_id, row, col)}

@router.get("/point", response_model=TerrainPoint)
def point(lat: float = Query(ge=-90, le=90), lon: float = Query(ge=-180, le=180), region_id: str = settings.default_region):
    return {"region_id": region_id, "cell": cell_for_coordinates(region_id, lat, lon)}
