
"""NASA Mars Trek map API for MarsMind."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/mars", tags=["Mars Map"])

NASA_TILE_ROOT = "https://trek.nasa.gov/tiles/Mars/EQ/"
MOLA_LAYER = "Mars_MGS_MOLA_ClrShade_merge_global_463m"

MOLA_TILES = (
    f"{NASA_TILE_ROOT}{MOLA_LAYER}"
    "/1.0.0/default/default028mm/"
    "{z}/{y}/{x}.jpg"
)


class Coordinates(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


@router.get("/map")
def get_mars_map():
    return {
        "name": "MarsMind Terrain Map",
        "provider": "NASA Mars Trek",
        "layer": "MOLA Global Color Hillshade",
        "projection": "Equirectangular Mars",
        "tile_url": MOLA_TILES,
        "tile_size": 256,
        "initial_zoom": 2,
        "center": {
            "latitude": 18.4,
            "longitude": 77.5,
        },
        "bounds": [-180, -90, 180, 90],
    }


@router.post("/analyze")
def analyze_location(coords: Coordinates):
    raise HTTPException(
        status_code=503,
        detail={
            "message": "Numeric terrain analysis requires a DEM.",
            "latitude": coords.latitude,
            "longitude": coords.longitude,
            "dem_required": True,
        },
    )
