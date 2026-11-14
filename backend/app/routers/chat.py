from typing import List
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from app.models.chat import ChatRequest, ChatResponse, MissionScenario
from app.services.chatbot_service import chatbot_service

router = APIRouter(prefix="/chat", tags=["Chatbot"])


@router.post("", response_model=ChatResponse, status_code=status.HTTP_200_OK)
def send_chat_message(request: ChatRequest):
    """
    Submit a message to the Mars Mind AI Chatbot (ARES).
    Accepts current message, conversation history, and optional mission context.
    """
    if not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty."
        )

    try:
        response = chatbot_service.generate_response(
            message=request.message,
            history=request.history,
            mission_context=request.mission_context or "nominal"
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat service encountered an error: {str(e)}"
        )


@router.post("/stream")
def stream_chat_message(request: ChatRequest):
    """
    Stream AI responses token-by-token using Server-Sent Events (SSE).
    """
    if not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty."
        )

    return StreamingResponse(
        chatbot_service.stream_response(
            message=request.message,
            history=request.history,
            mission_context=request.mission_context or "nominal"
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.get("/suggestions", response_model=List[str])
def get_chat_suggestions():
    """Retrieve suggested queries to guide new explorer interactions."""
    return chatbot_service.get_starter_suggestions()


@router.get("/scenarios", response_model=List[MissionScenario])
def get_mission_scenarios():
    """Retrieve selectable mission simulation scenarios for ARES."""
    return chatbot_service.get_scenarios()
