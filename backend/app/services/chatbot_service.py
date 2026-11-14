import re
from typing import List, Tuple
from app.config import settings
from app.models.chat import ChatMessage, ChatResponse


class ChatbotService:
    """Service handling natural language query responses for Mars Mind."""

    def __init__(self):
        self.bot_name = settings.CHATBOT_NAME
        self.provider = settings.AI_PROVIDER

    def get_starter_suggestions(self) -> List[str]:
        return [
            "What is the current atmospheric composition on Mars?",
            "How does the habitat life support system recycle water?",
            "What is the communication time delay between Earth and Mars?",
            "What radiation shielding strategies are used in the habitat?",
            "Summarize rover battery and navigation telemetry."
        ]

    def _generate_rule_based_response(self, query: str) -> Tuple[str, List[str]]:
        lower_q = query.lower()

        if any(w in lower_q for w in ["hello", "hi", "hey", "greetings"]):
            reply = (
                f"Greetings, Explorer! I am {self.bot_name}, your onboard mission AI for Mars Mind. "
                "I monitor habitat telemetry, life-support reserves, and rover exploration protocols. "
                "How can I assist your mission today?"
            )
            suggestions = [
                "Check habitat oxygen and life support status",
                "Explain the Earth-to-Mars communication delay",
                "Show surface environmental conditions"
            ]
            return reply, suggestions

        if any(w in lower_q for w in ["atmosphere", "air", "breath", "pressure"]):
            reply = (
                "**Mars Atmospheric Profile:**\n"
                "- **Composition:** ~95.3% Carbon Dioxide ($CO_2$), 2.6% Nitrogen ($N_2$), 1.9% Argon ($Ar$), 0.16% Oxygen ($O_2$).\n"
                "- **Surface Pressure:** Average ~610 Pa (~0.6% of Earth's sea-level pressure).\n"
                "- **Temperature:** Ranging from -125°C at poles to 20°C at the equator in summer.\n"
                "- **Life Support Integration:** MOXIE-style solid oxide electrolysis extracts $O_2$ directly from ambient atmospheric $CO_2$."
            )
            suggestions = [
                "How does MOXIE produce oxygen?",
                "What is the current habitat air pressure?"
            ]
            return reply, suggestions

        if any(w in lower_q for w in ["delay", "latency", "communication", "radio", "signal"]):
            reply = (
                "**Earth-Mars Communication Telemetry:**\n"
                "- **Light Time Delay:** Between 3 to 22 minutes each way depending on orbital positions.\n"
                "- **Solar Conjunction:** Every ~26 months, the Sun aligns directly between Earth and Mars, causing a ~2-week communications blackout.\n"
                "- **Deep Space Network (DSN):** Mars Mind uses high-gain X-band and Ka-band relay via orbital satellites to schedule uplink/downlink windows."
            )
            suggestions = [
                "How does the autonomous scheduler handle the blackout?",
                "What is the relay satellite orbital period?"
            ]
            return reply, suggestions

        if any(w in lower_q for w in ["radiation", "shielding", "solar flare", "cosmic ray"]):
            reply = (
                "**Radiation Defense Systems:**\n"
                "- **Threats:** Galactic Cosmic Rays (GCR) and Solar Particle Events (SPE).\n"
                "- **Passive Shielding:** Regolith berms (3+ meters of sintered Martian soil) layered over habitat pressure hulls.\n"
                "- **Internal Shielding:** Polyethylene water wall buffers surrounding crew sleeping quarters.\n"
                "- **Storm Shelters:** Underground volcanic lava tube shelters activated during elevated radiation alerts."
            )
            suggestions = [
                "What is the crew radiation dosage limit?",
                "Explain regolith brick manufacturing"
            ]
            return reply, suggestions

        if any(w in lower_q for w in ["water", "recycling", "life support", "eclss", "oxygen"]):
            reply = (
                "**ECLSS (Environmental Control and Life Support System):**\n"
                "- **Water Recovery:** Closed-loop vapor compression distillation yields ~98% recovery efficiency from humidity condensate and graywater.\n"
                "- **Subsurface Extraction:** In-situ automated ice melting drills targeting glaciated deposits at mid-latitudes.\n"
                "- **Sabatier Reactor:** Combines byproduct $CO_2$ and $H_2$ to generate water and methane propellant."
            )
            suggestions = [
                "What is the current water reserve level?",
                "How does the Sabatier reactor work?"
            ]
            return reply, suggestions

        if any(w in lower_q for w in ["rover", "telemetry", "wheel", "navigation", "battery"]):
            reply = (
                "**Autonomous Rover Telemetry Summary:**\n"
                "- **Power Unit:** Multi-Mission Radioisotope Thermoelectric Generator (MMRTG) paired with secondary Li-ion buffers at 94% capacity.\n"
                "- **Autonomous Navigation (AutoNav):** Stereo visual odometry mapping terrain hazards at 120 meters/hour.\n"
                "- **Sample Cache:** 8 geological drill cores sealed and registered for return payload."
            )
            suggestions = [
                "Display recent sample drill locations",
                "What is the rover's current route heading?"
            ]
            return reply, suggestions

        # Default intelligent response
        reply = (
            f"**Mission Query Received:** \"{query}\"\n\n"
            f"I have processed your query against the Mars Mind knowledge graph. "
            "Our autonomous systems are operating within nominal parameters. "
            "For specific subsystems, you can ask about atmospheric synthesis, habitat life support, "
            "communication relay schedules, or autonomous rover navigation."
        )
        suggestions = [
            "What is the current atmospheric composition on Mars?",
            "How does the habitat life support system recycle water?",
            "What is the communication time delay between Earth and Mars?"
        ]
        return reply, suggestions

    async def generate_response(
        self,
        message: str,
        history: List[ChatMessage] = None,
        mission_context: str = "mars_exploration"
    ) -> ChatResponse:
        """Process incoming query and return formatted response."""
        reply_text, suggestions = self._generate_rule_based_response(message)
        
        return ChatResponse(
            reply=reply_text,
            source=f"{self.bot_name} ({self.provider.upper()})",
            suggestions=suggestions
        )


chatbot_service = ChatbotService()

