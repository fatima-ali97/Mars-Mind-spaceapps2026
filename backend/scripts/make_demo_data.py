"""Produce a clearly SYNTHETIC terrain for immediate offline development.

Do not describe it as an actual NASA terrain measurement in the presentation.
"""
import json
from pathlib import Path
import numpy as np

OUT = Path(__file__).resolve().parents[1] / "app" / "data"
OUT.mkdir(parents=True, exist_ok=True)
WIDTH = HEIGHT = 40
BOUNDS = {"west": 77.30, "south": 18.35, "east": 77.40, "north": 18.45}
y, x = np.mgrid[0:HEIGHT, 0:WIDTH]
# Two broad hills, one depression, and an artificial ridge to show variation.
z = (-2100 + 160 * np.exp(-((x-11)**2 + (y-10)**2)/90)
     + 110 * np.exp(-((x-30)**2 + (y-24)**2)/55)
     - 85 * np.exp(-((x-24)**2 + (y-9)**2)/65)
     + 22 * np.sin(x/4))
np.save(OUT / "demo-jezero.npy", z.astype(np.float32))
metadata = {
    "id": "demo-jezero", "name": "Jezero area (synthetic demo)",
    "bounds": BOUNDS, "width": WIDTH, "height": HEIGHT,
    "resolution_m_approx": 150.0,
    "source": "Synthetic test fixture generated locally; NOT NASA measurements",
    "source_type": "synthetic_demo",
    "warning": "Illustrative surface only. Switch to a real NASA MOLA DEM before claiming real terrain analysis.",
}
(OUT / "demo-jezero.json").write_text(json.dumps(metadata, indent=2))
print("Created synthetic demo region (40 x 40) in", OUT)
