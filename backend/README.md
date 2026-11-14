# Mars Mind - Backend API

FastAPI-powered backend powering Mars Mind telemetry, mission control endpoints, and the onboard AI Chatbot (ARES).

## Features
- **FastAPI Architecture**: High performance, asynchronous request handling, automatic OpenAPI/Swagger documentation.
- **Mars Mind Chatbot API (`/api/chat`)**: Multi-turn dialogue support, Mars mission queries, telemetry summaries, and follow-up suggestion engine.
- **Health Monitoring (`/api/health`)**: System operational heartbeat monitoring for frontend and infra.
- **CORS Configured**: Pre-configured for Vite / React frontend development.

## Setup & Running

### 1. Create a Virtual Environment
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Variables
Copy `.env.example` to `.env` if custom configurations are needed:
```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

### 4. Start the Development Server
```bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- Interactive API Docs (Swagger): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Alternative Docs (ReDoc): [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- Health Check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

### 5. Running Tests
```bash
pytest tests/
```

