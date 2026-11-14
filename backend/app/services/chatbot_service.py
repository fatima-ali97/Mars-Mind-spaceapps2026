import json
import logging
import time
from typing import Dict, Generator, List, Optional, Tuple
import httpx
from app.config import settings
from app.models.chat import (
    ActionItem,
    ChatMessage,
    ChatResponse,
    MissionScenario,
    TelemetryBadge,
)

logger = logging.getLogger(__name__)


class ChatbotService:
    """
    Autonomous Resource & Exploration Specialist (ARES).
    Provides planetary science consultation, real-time telemetry diagnostics,
    mission contingency guidance, and LLM orchestration.
    """

    def __init__(self):
        self.bot_name = settings.CHATBOT_NAME
        self.provider = settings.AI_PROVIDER.lower()
        self.api_key = settings.AI_API_KEY
        self.gemini_model = settings.GEMINI_MODEL
        self.openai_model = settings.OPENAI_MODEL

    def get_starter_suggestions(self) -> List[str]:
        return [
            "What is the current atmospheric composition on Mars?",
            "How does the habitat life support system recycle water?",
            "What is the communication time delay between Earth and Mars?",
            "What radiation shielding strategies are used in the habitat?",
            "Summarize rover battery and navigation telemetry.",
            "Run emergency protocol for Sol 142 Dust Storm Alert.",
        ]

    def get_scenarios(self) -> List[MissionScenario]:
        return [
            MissionScenario(
                id="nominal",
                name="Expedition Sol 142 - Nominal Operations",
                description="Standard Martian summer operations in Jezero Crater. All life support and exploration rovers functioning nominally.",
                alert_level="nominal",
                parameters={
                    "ambient_temp": "-63°C",
                    "surface_pressure": "612 Pa",
                    "dust_tau": "0.34 (Clear)",
                    "eclss_status": "100% Operational",
                    "light_delay": "12m 44s",
                },
            ),
            MissionScenario(
                id="dust_storm",
                name="Regional Dust Storm (Tau > 2.8)",
                description="Rapid atmospheric opacity increase detected by MRO orbital relay. Solar array degradation anticipated.",
                alert_level="warning",
                parameters={
                    "ambient_temp": "-71°C",
                    "surface_pressure": "640 Pa",
                    "dust_tau": "2.85 (Severe Dust Storm)",
                    "eclss_status": "Pre-filter Purge Active",
                    "light_delay": "12m 44s",
                },
            ),
            MissionScenario(
                id="solar_event",
                name="Solar Particle Event (SPE) Radiation Advisory",
                description="Coronal Mass Ejection trajectory intersecting Martian orbital plane. Storm shelters activated.",
                alert_level="emergency",
                parameters={
                    "radiation_flux": "1.85 mSv/hr (Elevated)",
                    "water_wall_shielding": "Fully Charged",
                    "eva_status": "Strict Stand-Down Ordered",
                    "shelter_status": "Subsurface Lava Tube Ready",
                },
            ),
            MissionScenario(
                id="moxie_anomaly",
                name="MOXIE Oxygen Electrolyzer Fluctuation",
                description="Solid oxide cell cathode voltage variance in Module 2. Oxygen generation buffer at 82%.",
                alert_level="advisory",
                parameters={
                    "o2_generation_rate": "8.2 g/hr (Target: 10.0)",
                    "cell_temp": "795°C",
                    "backup_cryo_tanks": "98% Full",
                    "habitat_o2_partial_p": "20.8 kPa (Safe)",
                },
            ),
        ]

    def _generate_autonomous_response(
        self,
        query: str,
        history: List[ChatMessage] = None,
        mission_context: str = "nominal",
    ) -> Tuple[str, List[str], List[TelemetryBadge], List[ActionItem]]:
        lower_q = query.lower()
        badges: List[TelemetryBadge] = []
        actions: List[ActionItem] = []

        scenario_note = ""
        if mission_context == "dust_storm":
            scenario_note = (
                "> [!WARNING] **ACTIVE ALERT: Regional Dust Storm Active**\n"
                "> Atmospheric Tau is currently elevated to 2.85. Exterior sensors recommend sealing airlock pre-filters.\n\n"
            )
        elif mission_context == "solar_event":
            scenario_note = (
                "> [!CAUTION] **CRITICAL ADVISORY: Solar Particle Event (SPE)**\n"
                "> Crew has been directed to regolith-shielded subterranean storm shelters. Surface EVA is locked.\n\n"
            )
        elif mission_context == "moxie_anomaly":
            scenario_note = (
                "> [!NOTE] **SYSTEM ADVISORY: MOXIE Electrolyzer Variance**\n"
                "> Secondary catalytic loop undergoing autonomous recalibration.\n\n"
            )

        # 1. Greetings
        if any(w in lower_q for w in ["hello", "hi", "hey", "greetings", "ares"]):
            reply = (
                f"{scenario_note}"
                f"**ARES Core Active • Sol 142 Telemetry Stream Online.**\n\n"
                "Greetings, Explorer. I am your onboard **Autonomous Resource & Exploration Specialist**. "
                "I synthesize real-time data feeds across Jezero Crater surface meteorology, closed-loop ECLSS life support, "
                "autonomous AutoNav rovers, and Earth DSN communications.\n\n"
                "Select a mission subsystem or ask any inquiry to proceed."
            )
            suggestions = [
                "Inspect Jezero atmospheric pressure and composition",
                "Audit ECLSS water and oxygen reserves",
                "Calculate current Earth-to-Mars signal latency",
                "Show Autonomous Rover AutoNav map status",
            ]
            badges = [
                TelemetryBadge(label="Core AI", value="Nominal", status="nominal", subsystem="ARES"),
                TelemetryBadge(label="Telemetry Sync", value="Live (0.4s)", status="nominal", subsystem="DSN"),
            ]
            return reply, suggestions, badges, actions

        # 2. Atmosphere / Weather
        if any(w in lower_q for w in ["atmosphere", "air", "weather", "temperature", "pressure", "jezero"]):
            reply = (
                f"{scenario_note}"
                "**Martian Atmospheric Telemetry (Jezero Crater Station):**\n"
                "- **Gas Mixture:** 95.32% $CO_2$, 2.60% $N_2$, 1.90% $Ar$, 0.16% $O_2$, 0.08% $CO$.\n"
                "- **Surface Ambient Pressure:** 612 Pa (~0.006 atm, approx 4.6 mmHg).\n"
                "- **Temperature Range:** Diurnal minimum -78°C (05:20 LST), maximum -18°C (14:00 LST).\n"
                "- **Suspended Dust (Tau):** 0.34 in nominal mode; elevated to 2.85 during dust storm events.\n"
                "- **In-Situ Utilization:** Atmospheric carbon dioxide is pressurized to feed MOXIE solid oxide electrolyzers."
            )
            suggestions = [
                "How does MOXIE produce breathable oxygen?",
                "What protection prevents habitat depressurization?",
                "Simulate a dust storm event",
            ]
            badges = [
                TelemetryBadge(label="Surface Pressure", value="612 Pa", status="nominal", subsystem="ATMOSPHERE"),
                TelemetryBadge(label="Ambient Temp", value="-63°C", status="nominal", subsystem="ENVIRONMENT"),
                TelemetryBadge(label="CO2 Fraction", value="95.3%", status="nominal", subsystem="CHEMISTRY"),
            ]
            actions = [
                ActionItem(label="Run Barometric Calibration", action_type="diagnostic", payload={"sensor": "barometer_alpha"}),
                ActionItem(label="View Historical Sol Weather", action_type="telemetry_query", payload={"range": "30_sols"}),
            ]
            return reply, suggestions, badges, actions

        # 3. Comms / Latency / DSN
        if any(w in lower_q for w in ["comms", "communication", "delay", "latency", "signal", "dsn", "earth"]):
            reply = (
                f"{scenario_note}"
                "**Deep Space Network (DSN) Communication Relay:**\n"
                "- **One-Way Light Time (OWLT):** **12 minutes 44 seconds** (Current orbital distance: ~229 million km).\n"
                "- **Round-Trip Delay (RTT):** ~25 minutes 28 seconds.\n"
                "- **Carrier Frequencies:** High-gain Ka-band (32 GHz downlink, 2.0 Mbps) and X-band uplink.\n"
                "- **Relay Orbiters:** Mars Reconnaissance Orbiter (MRO) and Odyssey providing pass windows every 4.2 hours.\n"
                "- **Autonomous Handshake:** Mars Mind buffers mission packets locally and executes edge decision algorithms without waiting for Earth Houston approval."
            )
            suggestions = [
                "When is the next orbital relay satellite pass?",
                "Explain the Solar Conjunction comms blackout protocol",
                "Check Ka-band antenna alignment",
            ]
            badges = [
                TelemetryBadge(label="One-Way Delay", value="12m 44s", status="nominal", subsystem="DSN"),
                TelemetryBadge(label="Downlink Speed", value="2.0 Mbps", status="nominal", subsystem="COMMS"),
                TelemetryBadge(label="Relay Window", value="03h 18m Left", status="nominal", subsystem="ORBITAL"),
            ]
            actions = [
                ActionItem(label="Ping Relay Orbiter MRO", action_type="diagnostic", payload={"orbiter": "MRO"}),
                ActionItem(label="Queue Critical Science Downlink", action_type="override", payload={"priority": "HIGH"}),
            ]
            return reply, suggestions, badges, actions

        # 4. ECLSS / Oxygen / Water
        if any(w in lower_q for w in ["water", "oxygen", "eclss", "life support", "moxie", "breathe", "recycle"]):
            reply = (
                f"{scenario_note}"
                "**ECLSS (Environmental Control & Life Support System) Audit:**\n"
                "- **Oxygen Generation (MOXIE Electrolysis):** Solid oxide ceramic disc splitting $CO_2 \\rightarrow CO + \\frac{1}{2} O_2$ at 800°C. Producing **9.4 g/hr** of 99.6% purity medical-grade $O_2$.\n"
                "- **Closed-Loop Water Recovery:** Vapor Compression Distillation (VCD) & multi-stage filtration reclaiming **98.2%** of sweat condensate and hygiene effluent.\n"
                "- **Trace Contaminant Control:** Catalytic oxidizers and activated carbon beds scrub volatile organic compounds (VOCs) and methane continuously.\n"
                "- **Autonomous Redundancy:** 30-Sol cryogenic buffer reserves locked in underground pressurized vaults."
            )
            suggestions = [
                "What happens if MOXIE cathode voltage fluctuates?",
                "How much drinking water is currently in habitat storage?",
                "Show carbon dioxide scrubbing efficiency",
            ]
            badges = [
                TelemetryBadge(label="O2 Partial Pressure", value="21.1 kPa", status="nominal", subsystem="ECLSS"),
                TelemetryBadge(label="Water Recovery Rate", value="98.2%", status="nominal", subsystem="ECLSS"),
                TelemetryBadge(label="MOXIE Output", value="9.4 g/hr", status="nominal", subsystem="MOXIE"),
            ]
            actions = [
                ActionItem(label="Run ECLSS Filter Flush", action_type="diagnostic", payload={"subsystem": "filtration"}),
                ActionItem(label="Perform Emergency O2 Buffer Check", action_type="telemetry_query", payload={"target": "cryo_reserve"}),
            ]
            return reply, suggestions, badges, actions

        # 5. Rover / AutoNav / Navigation
        if any(w in lower_q for w in ["rover", "autonav", "navigation", "wheel", "telemetry", "drill", "sample"]):
            reply = (
                f"{scenario_note}"
                "**Autonomous Mobile Unit (AMU Rover) Telemetry:**\n"
                "- **Power Source:** Multi-Mission Radioisotope Thermoelectric Generator (MMRTG) outputting 110 W electrical, assisted by dual 43 Ah Li-ion buffers at **94% SOC**.\n"
                "- **Stereo AutoNav:** Onboard FPGA computing 3D hazard obstacle maps at 120 meters/hour drive rate without Earth command latency.\n"
                "- **Sample Cache Mechanism:** 8 sealed geological titanium cores hermetically stored; 12 empty sample tubes remaining for delta sediments.\n"
                "- **Mobility Health:** Rocker-bogie suspension slip ratio at nominal 4.1% over basaltic regolith."
            )
            suggestions = [
                "Display current rover route GPS coordinates",
                "What is the mineralogy of the last drill sample?",
                "Simulate a steep slope traction hazard",
            ]
            badges = [
                TelemetryBadge(label="MMRTG Battery", value="94% SOC", status="nominal", subsystem="ROVER"),
                TelemetryBadge(label="Odometer", value="14.2 km", status="nominal", subsystem="MOBILITY"),
                TelemetryBadge(label="Sample Cache", value="8 / 20 Sealed", status="nominal", subsystem="SCIENCE"),
            ]
            actions = [
                ActionItem(label="Run Rocker-Bogie Wheel Diagnostic", action_type="diagnostic", payload={"rover_id": "AMU-1"}),
                ActionItem(label="Download AutoNav Hazard Map", action_type="telemetry_query", payload={"type": "elevation_mesh"}),
            ]
            return reply, suggestions, badges, actions

        # 6. Radiation / Shielding / Solar Storm
        if any(w in lower_q for w in ["radiation", "shield", "storm", "spe", "flare", "cosmic", "sievert"]):
            reply = (
                f"{scenario_note}"
                "**Radiation Dosimetry & Habitat Defense Protocols:**\n"
                "- **Galactic Cosmic Radiation (GCR):** Background baseline of ~0.67 mSv/day (unshielded).\n"
                "- **Habitat Regolith Shielding:** 3.5 meters of compacted, microwave-sintered regolith shielding reduces indoor dosage by **88%** (< 0.08 mSv/day).\n"
                "- **Water Buffer Layer:** Crew quarters are wrapped in 25 cm perimeter potable water bladders for hydrogenous proton shielding.\n"
                "- **Storm Shelter Contingency:** Subterranean lava tube access located 18 meters below surface, activated whenever real-time solar monitors detect SPE flux > 1.0 mSv/hr."
            )
            suggestions = [
                "What is the astronauts' career radiation dose limit?",
                "Explain the lava tube subterranean storm shelter",
                "How does sintered regolith brick manufacturing work?",
            ]
            badges = [
                TelemetryBadge(label="Ambient Radiation", value="0.67 mSv/d", status="nominal", subsystem="DOSIMETRY"),
                TelemetryBadge(label="Habitat Interior", value="0.08 mSv/d", status="nominal", subsystem="SHIELDING"),
                TelemetryBadge(label="Shelter Readiness", value="100%", status="nominal", subsystem="SAFETY"),
            ]
            actions = [
                ActionItem(label="Test Storm Shelter Airlock Seal", action_type="diagnostic", payload={"sector": "lava_tube_1"}),
                ActionItem(label="Broadcast Crew Radiation Summary", action_type="telemetry_query", payload={"crew": "all"}),
            ]
            return reply, suggestions, badges, actions

        # 7. Dust Storm Emergency Scenario Query
        if any(w in lower_q for w in ["dust storm", "emergency", "contingency", "storm alert"]):
            reply = (
                "> [!WARNING] **EMERGENCY PROCEDURE: Sol 142 Dust Storm Protocol**\n"
                "- **Atmospheric Optical Depth (Tau):** Escalating from 0.34 to 2.85.\n"
                "- **Solar Power Decline:** Photovoltaic array output dropped by **72%**. Grid switched to primary MMRTG and nuclear micro-reactor.\n"
                "- **Automated Actions Taken:**\n"
                "  1. Exterior Rover AutoNav parked in lee of Jezero crater delta wall.\n"
                "  2. Habitat airlock exterior suction purges locked.\n"
                "  3. ECLSS electrostatic precipitators activated to repel fine particulate matter (PM2.5 basaltic dust)."
            )
            suggestions = [
                "How long can habitat life support run on micro-reactor power?",
                "Inspect airlock filtration electrostatic charge",
                "Return to nominal operations mode",
            ]
            badges = [
                TelemetryBadge(label="Dust Opacity (Tau)", value="2.85 (Severe)", status="warning", subsystem="WEATHER"),
                TelemetryBadge(label="Solar Generation", value="-72%", status="warning", subsystem="POWER"),
                TelemetryBadge(label="Airlock Pre-filter", value="Purge Active", status="alert", subsystem="SAFETY"),
            ]
            actions = [
                ActionItem(label="Engage Auxiliary Micro-Reactor", action_type="override", payload={"grid": "primary"}),
                ActionItem(label="Acknowledge Dust Storm Warning", action_type="alert_ack", payload={"code": "ALERT-TAU-285"}),
            ]
            return reply, suggestions, badges, actions

        # Default intelligent response
        reply = (
            f"{scenario_note}"
            f"**Mission Query Analyzed:** \"{query}\"\n\n"
            "I have cross-referenced your inquiry with the **Mars Mind Mission Knowledge Graph** and active telemetry logs. "
            "Telemetry across primary life support, rover autonomous navigation, and deep-space comms remains synchronized.\n\n"
            "You can query specific mission disciplines such as:\n"
            "- **Planetary Meteorology:** Atmospheric pressure, temperature swings, and dust opacity.\n"
            "- **ECLSS Life Support:** Oxygen production via MOXIE, closed-loop water recovery.\n"
            "- **Deep Space Network:** Transmission light-time delay and relay windows.\n"
            "- **Autonomous Rover Operations:** AutoNav obstacle avoidance, MMRTG power, and sample drilling."
        )
        suggestions = [
            "What is the current atmospheric composition on Mars?",
            "How does the habitat life support system recycle water?",
            "What is the communication time delay between Earth and Mars?",
            "Summarize rover battery and navigation telemetry.",
        ]
        badges = [
            TelemetryBadge(label="ARES Status", value="Online", status="nominal", subsystem="AI"),
            TelemetryBadge(label="Mission Sol", value="Sol 142", status="nominal", subsystem="MISSION"),
        ]
        return reply, suggestions, badges, actions

    def _query_gemini_api(
        self,
        message: str,
        history: List[ChatMessage] = None,
        mission_context: str = "nominal",
    ) -> Optional[str]:
        """Calls Google Gemini API using synchronous httpx client if configured."""
        if not self.api_key:
            return None

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={self.api_key}"
        
        system_prompt = (
            f"You are {self.bot_name}, an expert AI assistant aboard a manned Mars expedition for NASA Space Apps 2026. "
            "You provide highly accurate, scientifically grounded answers regarding Mars geology, atmospheric synthesis (MOXIE), "
            "ECLSS closed-loop life support, autonomous rover telemetry, radiation shielding, and DSN communications latency. "
            f"Current mission context: {mission_context}. Keep responses concise, clear, and formatted in markdown."
        )

        contents = []
        if history:
            for h in history[-6:]:
                role = "user" if h.role == "user" else "model"
                contents.append({"role": role, "parts": [{"text": h.content}]})

        contents.append({"role": "user", "parts": [{"text": message}]})

        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": contents,
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 800,
            },
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text")
                        if text:
                            return text
                else:
                    logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.warning(f"Gemini API query error: {e}")

        return None

    def generate_response(
        self,
        message: str,
        history: List[ChatMessage] = None,
        mission_context: str = "nominal",
    ) -> ChatResponse:
        """Process incoming query and return structured response."""
        llm_reply: Optional[str] = None

        if self.provider == "gemini" and self.api_key:
            llm_reply = self._query_gemini_api(message, history, mission_context)

        # Fallback to high-fidelity autonomous Mars engine
        rule_reply, suggestions, badges, actions = self._generate_autonomous_response(
            message, history, mission_context
        )

        final_reply = llm_reply if llm_reply else rule_reply
        engine_source = (
            f"{self.bot_name} (Gemini Live)"
            if llm_reply
            else f"{self.bot_name} (Autonomous Core)"
        )

        return ChatResponse(
            reply=final_reply,
            source=engine_source,
            suggestions=suggestions,
            telemetry=badges,
            actions=actions,
        )

    def stream_response(
        self,
        message: str,
        history: List[ChatMessage] = None,
        mission_context: str = "nominal",
    ) -> Generator[str, None, None]:
        """Stream response tokens as Server-Sent Events (SSE)."""
        response = self.generate_response(message, history, mission_context)
        words = response.reply.split(" ")

        for i, word in enumerate(words):
            chunk = word + (" " if i < len(words) - 1 else "")
            payload = {
                "chunk": chunk,
                "done": False,
                "source": response.source,
            }
            yield f"data: {json.dumps(payload)}\n\n"
            time.sleep(0.015)  # Natural typing cadence

        # Send final completion event with metadata, telemetry, suggestions, and actions
        final_payload = {
            "chunk": "",
            "done": True,
            "source": response.source,
            "suggestions": response.suggestions,
            "telemetry": [b.model_dump() for b in (response.telemetry or [])],
            "actions": [a.model_dump() for a in (response.actions or [])],
        }
        yield f"data: {json.dumps(final_payload)}\n\n"


chatbot_service = ChatbotService()
