"""Unit tests for real raster extraction: no NASA measurements are fabricated."""
from pathlib import Path
import subprocess
import sys
import numpy as np
import rasterio
from rasterio.transform import from_origin


def test_import_region_from_test_geotiff(tmp_path):
    raster_path = tmp_path / "tiny.tif"
    # A small known-value raster tests the import mechanism independently
    # of the 2 GB official source file.
    heights = np.arange(100, dtype=np.int16).reshape(10, 10) - 2000
    with rasterio.open(raster_path, "w", driver="GTiff", height=10, width=10,
                       count=1, dtype="int16", transform=from_origin(77, 19, .1, .1)) as dst:
        dst.write(heights, 1)
    script = Path(__file__).resolve().parents[1] / "scripts" / "prepare_mola.py"
    # Keep real app data untouched by using the unique region id.
    result = subprocess.run([sys.executable, str(script), "--input", str(raster_path),
                             "--region-id", "test-import-fixture", "--west", "77.1",
                             "--east", "77.8", "--south", "18.2", "--north", "18.9",
                             "--size", "7"], capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
    data_path = script.parents[1] / "app" / "data" / "test-import-fixture.npy"
    meta_path = data_path.with_suffix(".json")
    assert np.isfinite(np.load(data_path)).all()
    data_path.unlink()
    meta_path.unlink()
