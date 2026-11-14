from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., description="Role of the sender: 'user', 'assistant', or 'system'")
    content: str = Field(..., description="Message text content")
    timestamp: Optional[datetime] = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp of the message"
    )


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="The user's query or instruction")
    history: Optional[List[ChatMessage]] = Field(
        default_factory=list,
        description="Prior message history for multi-turn conversations"
    )
    mission_context: Optional[str] = Field(
        default="mars_exploration",
        description="Optional mission scenario or telemetry context"
    )


class ChatResponse(BaseModel):
    reply: str = Field(..., description="AI response text")
    source: str = Field(default="ARES-Core", description="Engine or model answering the request")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp of the response"
    )
    suggestions: List[str] = Field(
        default_factory=list,
        description="Suggested follow-up queries"
    )


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

