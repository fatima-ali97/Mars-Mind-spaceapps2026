"""Crop a local numerical USGS/NASA MOLA DEM GeoTIFF to a Mars region.

Usage:
 python scripts/prepare_mola.py --input /path/to/Mars_MGS_MOLA_DEM_mosaic_global_463m.tif \
    --region-id jezero-mola --name 'Jezero MOLA' \
    --west 77.30 --south 18.35 --east 77.40 --north 18.45

Requirements: input must be an equirectangular *degree-coordinate* raster.
This script intentionally fails on projected rasters or 0..360 longitude
windows it cannot safely interpret. Resampling here is nearest-neighbor;
MOLA 463m is too coarse to resolve individual rover-scale rocks.
"""
import argparse
import json
from pathlib import Path
import numpy as np
import rasterio
from rasterio.windows import from_bounds, transform as window_transform
from rasterio.enums import Resampling

OUT = Path(__file__).resolve().parents[1] / "app" / "data"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--region-id", default="jezero-mola")
    parser.add_argument("--name", default="Jezero MOLA elevation")
    parser.add_argument("--west", type=float, default=77.20)
    parser.add_argument("--south", type=float, default=18.30)
    parser.add_argument("--east", type=float, default=77.60)
    parser.add_argument("--north", type=float, default=18.70)
    parser.add_argument("--size", type=int, default=40)
    args = parser.parse_args()
    if not all(c.isalnum() or c in "-_" for c in args.region_id):
        parser.error("region-id can only contain letters, digits, - and _")
    if not (-180 <= args.west < args.east <= 180 and -90 <= args.south < args.north <= 90):
        parser.error("Invalid geographic bounds")
    if not (2 <= args.size <= 200):
        parser.error("size must be 2..200")

    with rasterio.open(args.input) as src:
        # This version expects lon/lat values in affine x/y (degrees).
        # We cannot simply use EPSG:4326 for Mars without changing datum.
        if src.transform.b != 0 or src.transform.d != 0 or src.transform.a <= 0 or src.transform.e >= 0:
            raise ValueError("Expected north-up geographic longitude/latitude GeoTIFF")
        if max(abs(src.bounds.left), abs(src.bounds.right)) > 361 or max(abs(src.bounds.top), abs(src.bounds.bottom)) > 91:
            raise ValueError("Expected geographic degrees, not projected meters")
        # Some Mars products encode longitude as 0..360, which is fine for this
        # example's positive eastern bounds (Jezero is around 77°E).
        if not (src.bounds.left <= args.west < args.east <= src.bounds.right and
                src.bounds.bottom <= args.south < args.north <= src.bounds.top):
            raise ValueError(f"Requested area outside source bounds: {src.bounds}")
        window = from_bounds(args.west, args.south, args.east, args.north, transform=src.transform)
        heights = src.read(1, window=window, out_shape=(args.size,args.size),
                           resampling=Resampling.bilinear, masked=True)
        heights = np.asarray(heights.filled(np.nan), dtype=np.float32)
        if np.isfinite(heights).sum() < 4:
            raise ValueError("No valid MOLA cells were found in the selected area")

    OUT.mkdir(parents=True, exist_ok=True)
    np.save(OUT / f"{args.region_id}.npy", heights)
    meta = {
        "id": args.region_id, "name": args.name,
        "bounds": {"west": args.west, "south": args.south, "east": args.east, "north": args.north},
        "width": args.size, "height": args.size,
        "resolution_m_approx": round(3389500 * np.deg2rad((args.north - args.south)/args.size), 1),
        "source": "NASA Mars Global Surveyor MOLA DEM via USGS Astrogeology (Mars_MGS_MOLA_DEM_mosaic_global_463m.tif)",
        "source_type": "nasa_mola_dem",
        "warning": "Coarse regional MOLA analysis: does NOT detect rocks or certify rover safety. Bilinear resampling cannot create extra spatial detail.",
    }
    (OUT / f"{args.region_id}.json").write_text(json.dumps(meta, indent=2))
    print("Prepared", args.region_id, "shape", heights.shape, "valid cells", int(np.isfinite(heights).sum()))

if __name__ == "__main__":
    main()
