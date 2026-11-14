"""Check key terrain guarantees and HTTP responses."""
import numpy as np
from fastapi.testclient import TestClient
from app.algorithms.risk_scoring import score_slope
from app.algorithms.slope_analysis import slope_degrees
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "operational"

def test_regions():
    response = client.get("/api/mars/regions")
    assert response.status_code == 200
    assert any(x["id"] == "demo-jezero" and x["source_type"] == "synthetic_demo" for x in response.json())

def test_grid_contract():
    response = client.get("/api/terrain/grid?region_id=demo-jezero&stride=4")
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["rows"]) == 10
    assert len(payload["rows"][0]) == 10
    cell = payload["rows"][0][0]
    assert {"row", "col", "lat", "lon", "elevation_m", "slope_deg", "risk_score", "hazard", "traversable"} <= cell.keys()

def test_point_query():
    response = client.get("/api/terrain/point?region_id=demo-jezero&lat=18.40&lon=77.35")
    assert response.status_code == 200
    assert response.json()["cell"]["elevation_m"] is not None

def test_unknown_region():
    assert client.get("/api/terrain/grid?region_id=not-here").status_code == 404

def test_outside_region():
    assert client.get("/api/terrain/point?region_id=demo-jezero&lat=0&lon=0").status_code == 404

def test_invalid_stride():
    assert client.get("/api/terrain/grid?stride=0").status_code == 422

def test_unknown_slope_blocked():
    scores, labels, traversable = score_slope(np.array([0., 8., 15., 30., np.nan]))
    assert labels.tolist() == ["low", "moderate", "high", "blocked", "unknown"]
    assert traversable.tolist() == [True, True, True, False, False]
    assert np.isnan(scores[-1])

def test_flat_surface_has_zero_slope():
    flat = np.full((5,5), -2000.0)
    bounds = {"west": 77.0,"east": 78.0,"south": 18.0,"north": 19.0}
    assert np.allclose(slope_degrees(flat, bounds), 0)


def test_real_region_flag_without_faking_values(tmp_path, monkeypatch):
    """Confirm the API preserves provenance of an imported NASA raster."""
    import json
    from app.core.config import settings
    from app.services.terrain_service import analyzed_region
    monkeypatch.setattr(settings, "data_dir", tmp_path)
    metadata = {
        "id": "nasa-test", "name": "NASA test fixture", "bounds": {"west": 77.0, "south": 18.0, "east": 78.0, "north": 19.0},
        "width": 4, "height": 4, "resolution_m_approx": 1000, "source": "test fixture", "source_type": "nasa_mola_dem"
    }
    (tmp_path / "nasa-test.json").write_text(json.dumps(metadata))
    np.save(tmp_path / "nasa-test.npy", np.ones((4,4)))
    analyzed_region.cache_clear()
    resp = client.get("/api/terrain/grid?region_id=nasa-test")
    assert resp.status_code == 200
    assert resp.json()["region"]["source_type"] == "nasa_mola_dem"
    analyzed_region.cache_clear()


def test_missing_grid_rejected():
    assert client.get("/api/terrain/grid?region_id=../../etc/passwd").status_code in (400, 404)
