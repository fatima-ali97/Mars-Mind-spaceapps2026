"""Public response schemas used by Dev 1 and Dev 3."""
from typing import Literal
from pydantic import BaseModel, Field

class Bounds(BaseModel):
    west: float
    south: float
    east: float
    north: float

class RegionInfo(BaseModel):
    id: str
    name: str
    bounds: Bounds
    width: int
    height: int
    resolution_m_approx: float
    source: str
    source_type: Literal["synthetic_demo", "nasa_mola_dem"]
    warning: str | None = None

class TerrainCell(BaseModel):
    row: int
    col: int
    lat: float
    lon: float
    elevation_m: float | None
    slope_deg: float | None
    risk_score: int | None = Field(default=None, ge=0, le=100)
    hazard: Literal["low", "moderate", "high", "blocked", "unknown"]
    traversable: bool

class TerrainGrid(BaseModel):
    region: RegionInfo
    rows: list[list[TerrainCell]]
    risk_model: str

class TerrainPoint(BaseModel):
    region_id: str
    cell: TerrainCell
