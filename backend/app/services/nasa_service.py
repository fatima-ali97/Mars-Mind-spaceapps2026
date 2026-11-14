"""Load a previously prepared regional elevation grid from local files.

NASA's Trek WMTS supplies *imagery* for Dev 1, not numerical heights.
Dev 2 gets heights from a USGS/NASA MOLA GeoTIFF (prepared offline).
"""
import json
from dataclasses import dataclass
from pathlib import Path
import numpy as np
from fastapi import HTTPException
from app.core.config import settings

@dataclass(frozen=True)
class ElevationRegion:
    metadata: dict
    elevation: np.ndarray

def regions_directory() -> Path:
    return settings.data_dir.resolve()

def list_regions() -> list[dict]:
    entries = []
    for path in sorted(regions_directory().glob("*.json")):
        try:
            meta = json.loads(path.read_text())
            grid = path.with_suffix(".npy")
            if grid.exists() and meta.get("id") == path.stem:
                entries.append(meta)
        except (OSError, ValueError):
            continue
    return entries

def load_region(region_id: str) -> ElevationRegion:
    # Prevent a request from reading arbitrary disk paths.
    if not region_id or not all(c.isalnum() or c in "-_" for c in region_id):
        raise HTTPException(400, "Invalid region ID")
    meta_path = regions_directory() / f"{region_id}.json"
    data_path = regions_directory() / f"{region_id}.npy"
    if not meta_path.is_file() or not data_path.is_file():
        raise HTTPException(404, f"Region '{region_id}' is not installed")
    try:
        metadata = json.loads(meta_path.read_text())
        heights = np.load(data_path, allow_pickle=False)
        if heights.ndim != 2 or list(heights.shape) != [metadata["height"], metadata["width"]]:
            raise ValueError("DEM dimensions disagree with metadata")
        if not np.issubdtype(heights.dtype, np.number):
            raise ValueError("DEM must contain numerical values")
        return ElevationRegion(metadata, heights.astype(float))
    except (OSError, ValueError, KeyError) as exc:
        raise HTTPException(500, f"Region data is invalid: {exc}") from exc
