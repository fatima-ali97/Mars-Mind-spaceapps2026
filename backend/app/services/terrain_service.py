"""Convert NASA DEM cells into frontend-friendly data and routing inputs."""
from functools import lru_cache
from fastapi import HTTPException
import numpy as np
from app.algorithms.slope_analysis import slope_degrees
from app.algorithms.risk_scoring import score_slope
from app.services.nasa_service import load_region

RISK_MODEL = "Demo heuristic: slope ≤5° low; ≤12° moderate; ≤20° high; >20° blocked; unknown blocked"

@lru_cache(maxsize=8)
def analyzed_region(region_id: str):
    region = load_region(region_id)
    bounds = region.metadata["bounds"]
    slope = slope_degrees(region.elevation, bounds)
    scores, hazards, passable = score_slope(slope)
    # A missing elevation must never become a traversable cell.
    valid_height = np.isfinite(region.elevation)
    passable &= valid_height
    hazards[~valid_height] = "unknown"
    scores[~valid_height] = np.nan
    return region, slope, scores, hazards, passable

def cell_at(region_id: str, row: int, col: int) -> dict:
    region, slope, scores, hazards, passable = analyzed_region(region_id)
    height, width = region.elevation.shape
    if not (0 <= row < height and 0 <= col < width):
        raise HTTPException(404, "Cell is outside this region")
    b = region.metadata["bounds"]
    lat = b["north"] - (row + 0.5) * (b["north"] - b["south"]) / height
    lon = b["west"] + (col + 0.5) * (b["east"] - b["west"]) / width
    def clean(value):
        return round(float(value), 4) if np.isfinite(value) else None
    return {
        "row": row, "col": col, "lat": round(lat, 6), "lon": round(lon, 6),
        "elevation_m": clean(region.elevation[row, col]),
        "slope_deg": clean(slope[row, col]),
        "risk_score": round(float(scores[row, col])) if np.isfinite(scores[row, col]) else None,
        "hazard": str(hazards[row, col]), "traversable": bool(passable[row, col]),
    }

def cell_for_coordinates(region_id: str, lat: float, lon: float) -> dict:
    region, *_ = analyzed_region(region_id)
    b = region.metadata["bounds"]
    if not (b["south"] <= lat <= b["north"] and b["west"] <= lon <= b["east"]):
        raise HTTPException(404, "Coordinate outside selected region")
    height, width = region.elevation.shape
    # Clamp the inclusive northern/eastern edges to final grid cell.
    row = min(height - 1, int((b["north"] - lat) / (b["north"] - b["south"]) * height))
    col = min(width - 1, int((lon - b["west"]) / (b["east"] - b["west"]) * width))
    return cell_at(region_id, row, col)

def grid_for_region(region_id: str, stride: int = 1) -> dict:
    region, *_ = analyzed_region(region_id)
    height, width = region.elevation.shape
    # Prevent accidental giant JSON responses during the demo.
    if len(range(0, height, stride)) * len(range(0, width, stride)) > 10_000:
        raise HTTPException(422, "Grid too large: increase stride (max 10,000 cells)")
    return {
        "region": region.metadata,
        "rows": [[cell_at(region_id, r, c) for c in range(0, width, stride)]
                 for r in range(0, height, stride)],
        "risk_model": RISK_MODEL,
    }
