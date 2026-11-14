from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class TelemetryBadge(BaseModel):
    """Real-time telemetry metric attached to an AI response."""
    label: str = Field(..., description="Metric display name (e.g. Atmospheric Pressure)")
    value: str = Field(..., description="Formatted value (e.g. 612 Pa)")
    status: str = Field(default="nominal", description="Status level: nominal, warning, alert, or critical")
    subsystem: Optional[str] = Field(default="GENERAL", description="Subsystem tag (e.g. ECLSS, ROVER, DSN)")


class ActionItem(BaseModel):
    """Interactive action recommended by ARES."""
    label: str = Field(..., description="Action button title")
    action_type: str = Field(..., description="Action identifier: diagnostic, alert_ack, telemetry_query, override")
    payload: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Metadata or parameters for action")


class ChatMessage(BaseModel):
    role: str = Field(..., description="Role of the sender: 'user', 'assistant', or 'system'")
    content: str = Field(..., description="Message text content")
    timestamp: Optional[datetime] = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp of the message"
    )
    telemetry: Optional[List[TelemetryBadge]] = Field(
        default=None,
        description="Optional telemetry metrics embedded with this message"
    )
    actions: Optional[List[ActionItem]] = Field(
        default=None,
        description="Interactive action prompts recommended by ARES"
    )


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="The user's query or instruction")
    history: Optional[List[ChatMessage]] = Field(
        default_factory=list,
        description="Prior message history for multi-turn conversations"
    )
    mission_context: Optional[str] = Field(
        default="mars_exploration",
        description="Optional mission scenario identifier (e.g. nominal, dust_storm, solar_event, moxie_warning)"
    )
    stream: Optional[bool] = Field(
        default=False,
        description="Whether to request token-by-token streaming"
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
    telemetry: Optional[List[TelemetryBadge]] = Field(
        default=None,
        description="Contextual telemetry badges"
    )
    actions: Optional[List[ActionItem]] = Field(
        default=None,
        description="Contextual action prompts"
    )


class MissionScenario(BaseModel):
    id: str
    name: str
    description: str
    alert_level: str  # nominal, advisory, warning, emergency
    parameters: Dict[str, str]


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    ai_provider: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
