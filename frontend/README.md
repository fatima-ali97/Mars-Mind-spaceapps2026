# Mars Mind - Frontend (React + TypeScript + Vite)

Interactive user interface for the Mars Mind planetary platform, featuring real-time telemetry dashboards and the **ARES AI Chatbot Specialist**.

## Architecture & Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.tsx             # Brand header with live BE status indicator & tabs
│   │   ├── MissionOverview.tsx    # Subsystem telemetry cards & quick AI triggers
│   │   └── Chatbot/
│   │       ├── ChatbotWidget.tsx  # Main chatbot panel (header, messages, input)
│   │       ├── MessageList.tsx    # Scrollable thread with typing indicators
│   │       ├── MessageItem.tsx    # Formatted speech bubble & suggestion chips
│   │       └── ChatInput.tsx      # Prompt input, keyboard shortcuts & quick topics
│   ├── services/
│   │   └── api.ts                 # Typed fetch client connecting to FastAPI backend
│   ├── types/
│   │   └── chat.ts                # TypeScript interfaces for messages and telemetry
│   ├── App.tsx                    # Top-level shell with tab navigation & slide-out drawer
│   ├── App.css                    # NASA Mars Mission styled theme
│   ├── index.css                  # Global styles & variables
│   └── main.tsx                   # React root entrypoint
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts                 # Proxies /api requests to http://127.0.0.1:8000
```

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

The frontend will run at [http://localhost:5173](http://localhost:5173).

### 3. Build for Production
```bash
npm run build
```

Build outputs are compiled to `frontend/dist/`.

