import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.chatbot_service import chatbot_service
from app.models.chat import ChatRequest


def run_verification():
    print("Testing Mars Mind Chatbot Service...")
    
    # 1. Test starter suggestions
    suggestions = chatbot_service.get_starter_suggestions()
    print(f"Suggestions count: {len(suggestions)}")
    assert len(suggestions) > 0

    # 2. Test scenarios
    scenarios = chatbot_service.get_scenarios()
    print(f"Scenarios count: {len(scenarios)}")
    assert len(scenarios) >= 3

    # 3. Test atmospheric response with telemetry
    resp = chatbot_service.generate_response("atmosphere", mission_context="nominal")
    print(f"Reply sample: {resp.reply[:60]}...")
    print(f"Source: {resp.source}")
    print(f"Telemetry badges: {[b.label for b in (resp.telemetry or [])]}")
    print(f"Actions: {[a.label for a in (resp.actions or [])]}")
    assert resp.telemetry is not None and len(resp.telemetry) > 0

    # 4. Test dust storm scenario
    dust_resp = chatbot_service.generate_response("status", mission_context="dust_storm")
    print(f"Dust storm scenario badge check: {[b.label for b in (dust_resp.telemetry or [])]}")
    assert "Regional Dust Storm Active" in dust_resp.reply

    # 5. Test streaming generator
    chunks = list(chatbot_service.stream_response("hello ares", mission_context="nominal"))
    print(f"Streamed SSE events count: {len(chunks)}")
    assert len(chunks) > 5

    print("ALL CHATBOT BACKEND TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    run_verification()
