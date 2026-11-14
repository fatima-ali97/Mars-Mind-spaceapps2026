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


def test_chat_suggestions():
    response = client.get("/api/chat/suggestions")
    assert response.status_code == 200
    suggestions = response.json()
    assert isinstance(suggestions, list)
    assert len(suggestions) > 0


def test_chat_message():
    payload = {
        "message": "What is the atmosphere on Mars?",
        "history": [],
        "mission_context": "test"
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "CO_2" in data["reply"] or "Carbon Dioxide" in data["reply"]
    assert "source" in data

