# 🛠️ Mars Mind Developer Guide

Welcome to the development guide for **Mars Mind (NASA Space Apps 2026)**. This guide outlines everything new and returning developers need to get their environment configured, install all dependencies, run development servers, and contribute new features.

---

## 📋 Table of Contents
1. [System Requirements](#system-requirements)
2. [Full Local Setup in 5 Minutes](#full-local-setup-in-5-minutes)
3. [Working on the Backend (Python / FastAPI)](#working-on-the-backend-python--fastapi)
4. [Working on the Frontend (React / TypeScript / Vite)](#working-on-the-frontend-react--typescript--vite)
5. [Working on the Chatbot Feature](#working-on-the-chatbot-feature)
6. [Connecting Real AI Models (Gemini / OpenAI)](#connecting-real-ai-models-gemini--openai)
7. [Running Tests & Quality Checks](#running-tests--quality-checks)
8. [Common Troubleshooting & FAQs](#common-troubleshooting--faqs)

---

## 1. System Requirements

| Tool | Minimum Version | Recommended Version | Check Command |
|---|---|---|---|
| **Python** | 3.10+ | 3.11 / 3.12 / 3.13 | `python --version` |
| **Node.js** | 18.0+ | 20 LTS or 22 | `node --version` |
| **npm** | 9.0+ | 10.x | `npm --version` |
| **Git** | 2.30+ | Latest | `git --version` |

---

## 2. Full Local Setup in 5 Minutes

### Step A: Clone the repository
```bash
git clone https://github.com/your-org/Mars-Mind-spaceapps2026.git
cd Mars-Mind-spaceapps2026
```

### Step B: Setup Python Backend
```bash
cd backend

# Create virtual environment
# On Windows:
python -m venv .venv
.venv\Scripts\activate

# On macOS/Linux:
python3 -m venv .venv
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start backend server
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
> Verify: Open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) in your browser. You should see the interactive Swagger UI.

### Step C: Setup React Frontend (New Terminal)
```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```
> Verify: Open [http://localhost:5173](http://localhost:5173) in your browser. The "BE: ONLINE" status badge should illuminate green.

---

## 3. Working on the Backend (Python / FastAPI)

The backend code is housed under `backend/app/`.

### Directory Overview:
- `app/main.py`: Creates the FastAPI application, loads middleware (CORS), and mounts routers.
- `app/config.py`: Environment configurations using Pydantic Settings.
- `app/models/chat.py`: Type-checked data models for requests and responses.
- `app/routers/`: Add new API routes here (e.g., `telemetry.py`, `rovers.py`).
- `app/services/`: Place heavy domain logic, database operations, or external API calls here.

### Adding a New Backend Endpoint:
1. Define your Pydantic schema in `app/models/`.
2. Create or open a router in `app/routers/`.
3. Example:
   ```python
   from fastapi import APIRouter
   router = APIRouter(prefix="/sensors", tags=["Sensors"])

   @router.get("/radiation")
   async def get_radiation():
       return {"current_rad_mSv": 0.42, "status": "safe"}
   ```
4. Include router in `app/main.py`:
   ```python
   from app.routers import sensors
   app.include_router(sensors.router, prefix=settings.API_PREFIX)
   ```

---

## 4. Working on the Frontend (React / TypeScript / Vite)

The frontend is located under `frontend/`.

### Key Technologies:
- **React 18** functional components with hooks (`useState`, `useEffect`, `useRef`).
- **TypeScript** with strict type checks enabled.
- **Vite** with an internal dev proxy (`vite.config.ts`) that redirects `/api/*` to `http://127.0.0.1:8000`, eliminating local CORS configuration hurdles.

### Adding a New Dashboard Component:
1. Create a component in `frontend/src/components/`, e.g., `RoverMap.tsx`.
2. Define its TypeScript props.
3. Import and render it in `frontend/src/components/MissionOverview.tsx` or `frontend/src/App.tsx`.

---

## 5. Working on the Chatbot Feature

The chatbot is designed to be self-contained and modular:
- **Frontend Container**: `frontend/src/components/Chatbot/ChatbotWidget.tsx`
  - Floating trigger button on dashboard screens.
  - Slide-out quick drawer and full-screen view.
  - Formats bullet points, code blocks, and markdown bold automatically.
  - Suggestion chips dynamically populate after each AI response.
- **Backend Service**: `backend/app/services/chatbot_service.py`
  - Inspects incoming questions for keywords (atmosphere, comms delay, radiation, water recovery, rovers).
  - Supplies contextual follow-up chips.

---

## 6. Connecting Real AI Models (Gemini / OpenAI)

By default, Mars Mind runs in `mock` mode with realistic space telemetry so developers can test without external API keys.

To plug in a live LLM (e.g., Google Gemini):

1. In `backend/.env`:
   ```ini
   AI_PROVIDER=gemini
   AI_API_KEY=your_gemini_api_key_here
   ```
2. Update `backend/app/services/chatbot_service.py`:
   ```python
   if self.provider == "gemini":
       # Call google-genai or httpx endpoint using self.api_key
       ...
   ```

---

## 7. Running Tests & Quality Checks

### Run Backend Tests:
```bash
cd backend
pytest tests/ -v
```

### Run Frontend Build Check:
```bash
cd frontend
npm run build
```

---

## 8. Common Troubleshooting & FAQs

### Q1: On Windows, PowerShell says `npm.ps1 cannot be loaded because running scripts is disabled`.
**Fix**: Run npm commands with `cmd /c npm ...` or enable script execution:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Q2: Frontend shows `BE: OFFLINE`.
**Fix**:
1. Check if the Python backend is running on `http://127.0.0.1:8000`.
2. Visit `http://127.0.0.1:8000/api/health` directly in your browser.
3. If on a custom port, update `frontend/vite.config.ts` target proxy.

### Q3: How do I change the default port?
- **Backend**: Pass `--port <PORT>` to uvicorn, or change `PORT=8000` in `backend/.env`.
- **Frontend**: Update `server.port` in `frontend/vite.config.ts`.

