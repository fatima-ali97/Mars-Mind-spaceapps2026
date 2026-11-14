"""Derive approximate slope angles from height samples and Mars distances."""
import numpy as np

MARS_RADIUS_M = 3_389_500.0

def cell_spacing_m(bounds: dict, width: int, height: int):
    """Return east-west and north-south spacing in meters at each row.

    Assumes a small equirectangular latitude/longitude window; not suitable
    for polar regions or rover-scale navigation without better projections.
    """
    if width < 2 or height < 2:
        raise ValueError("Terrain grids must be at least 2x2")
    dlon = np.deg2rad((bounds["east"] - bounds["west"]) / width)
    dlat = np.deg2rad((bounds["north"] - bounds["south"]) / height)
    latitudes = bounds["north"] - (np.arange(height) + 0.5) * (bounds["north"] - bounds["south"]) / height
    dx = MARS_RADIUS_M * np.cos(np.deg2rad(latitudes)) * abs(dlon)
    dy = MARS_RADIUS_M * abs(dlat)
    if np.any(dx <= 0) or dy <= 0:
        raise ValueError("Invalid cell spacing")
    return dx, dy

def slope_degrees(elevation: np.ndarray, bounds: dict) -> np.ndarray:
    """Central differences; invalid DEM cells remain NaN.

    Neighboring missing cells are allowed to contaminate the gradient.
    This is intentionally conservative: uncertain cells become blocked.
    """
    z = np.asarray(elevation, dtype=float)
    if z.ndim != 2 or min(z.shape) < 2:
        raise ValueError("Elevation must be a 2D grid, at least 2x2")
    dx, dy = cell_spacing_m(bounds, z.shape[1], z.shape[0])
    dz_drow, dz_dcol = np.gradient(z)
    rise_over_run = np.hypot(dz_dcol / dx[:, None], dz_drow / dy)
    return np.rad2deg(np.arctan(rise_over_run))
