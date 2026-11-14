from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["health"] == "/api/health"


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert "Mars Mind" in data["service"]
    assert "ai_provider" in data


def test_chat_suggestions():
    response = client.get("/api/chat/suggestions")
    assert response.status_code == 200
    suggestions = response.json()
    assert isinstance(suggestions, list)
    assert len(suggestions) > 0


def test_chat_scenarios():
    response = client.get("/api/chat/scenarios")
    assert response.status_code == 200
    scenarios = response.json()
    assert isinstance(scenarios, list)
    assert len(scenarios) >= 3
    scenario_ids = [s["id"] for s in scenarios]
    assert "nominal" in scenario_ids
    assert "dust_storm" in scenario_ids


def test_chat_message_with_telemetry():
    payload = {
        "message": "What is the atmosphere on Mars?",
        "history": [],
        "mission_context": "nominal"
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "CO_2" in data["reply"] or "Carbon Dioxide" in data["reply"]
    assert "source" in data
    assert "telemetry" in data
    assert len(data["telemetry"]) > 0


def test_chat_stream():
    payload = {
        "message": "Hello ARES",
        "history": [],
        "mission_context": "nominal"
    }
    response = client.post("/api/chat/stream", json=payload)
    assert response.status_code == 200
    assert "text/event-stream" in response.headers.get("content-type", "")
    content = response.text
    assert "data:" in content
