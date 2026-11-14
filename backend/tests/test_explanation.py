"""Checks grounded terrain explanations without making live Gemini calls."""
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.services.chatbot_service import chatbot_service

client = TestClient(app)


def test_fallback(monkeypatch):
    monkeypatch.setattr(settings, "AI_PROVIDER", "mock")
    result = client.post("/api/terrain/explain", json={"region_id": "demo-jezero", "lat": 18.4, "lon": 77.35})
    assert result.status_code == 200
    data = result.json()
    assert data["method"] == "rule_based"
    assert data["is_demo_data"] is True
    assert data["cell"]["elevation_m"] is not None
    assert "Synthetic" in data["disclaimer"]


def test_gemini_reuses_dev3(monkeypatch):
    monkeypatch.setattr(settings, "AI_PROVIDER", "gemini")
    monkeypatch.setattr(settings, "AI_API_KEY", "test-key")
    monkeypatch.setattr(chatbot_service, "_query_gemini_api", lambda *args, **kwargs: "Grounded AI explanation")
    result = client.post("/api/terrain/explain", json={"region_id": "demo-jezero", "lat": 18.4, "lon": 77.35})
    assert result.status_code == 200
    assert result.json()["method"] == "gemini"
    assert result.json()["explanation"] == "Grounded AI explanation"


def test_missing_region():
    result = client.post("/api/terrain/explain", json={"region_id": "missing", "lat": 18.4, "lon": 77.35})
    assert result.status_code == 404
