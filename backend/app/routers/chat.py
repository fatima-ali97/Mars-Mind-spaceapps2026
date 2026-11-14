from typing import List
from fastapi import APIRouter, HTTPException, status
from app.models.chat import ChatRequest, ChatResponse
from app.services.chatbot_service import chatbot_service

router = APIRouter(prefix="/chat", tags=["Chatbot"])


@router.post("", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def send_chat_message(request: ChatRequest):
    """
    Submit a message to the Mars Mind AI Chatbot.
    Accepts current message, conversation history, and optional mission context.
    """
    if not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty."
        )

    try:
        response = await chatbot_service.generate_response(
            message=request.message,
            history=request.history,
            mission_context=request.mission_context or "mars_exploration"
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat service encountered an error: {str(e)}"
        )


@router.get("/suggestions", response_model=List[str])
async def get_chat_suggestions():
    """Retrieve suggested queries to guide new explorer interactions."""
    return chatbot_service.get_starter_suggestions()

