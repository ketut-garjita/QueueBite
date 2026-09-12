# QueueBite — AI-Powered Restaurant Waitlist Manager

**QueueBite** is an end-to-end, AI-augmented waitlist and table floor management system built for high-turnover dining establishments.

---

## Architecture Overview

```
aidevtools-module2/
├── PROJECT_SCOPE.md           # Project scoping & architectural specifications
├── backend/                   # Python backend managed by uv
│   ├── pyproject.toml         # uv dependencies (FastAPI, SQLModel, Uvicorn, httpx)
│   ├── .env.example           # Environment template (optional OpenAI / Gemini keys)
│   └── app/
│       ├── main.py            # FastAPI entry point, CORS, lifespan & health
│       ├── config.py          # App settings
│       ├── database.py        # SQLite engine & session management
│       ├── models.py          # SQLModel schemas & Pydantic DTOs
│       ├── seed.py            # Demo seeder for "The Rustic Olive"
│       ├── ai/
│       │   ├── predictor.py   # Dynamic wait-time calculation engine
│       │   ├── optimizer.py   # AI table seating match algorithm
│       │   └── assistant.py   # Conversational copilot (Local fallback + LLM)
│       └── routes/
│           ├── queue.py       # Waitlist CRUD, notify & seat endpoints
│           ├── tables.py      # Floor management, status & bussing
│           ├── ai.py          # AI wait prediction, optimizer & chat
│           └── notifications.py # Simulated SMS inbox log
└── frontend/                  # React + Vite frontend
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx            # Dual-portal shell (Host Stand vs Guest Mobile)
        ├── services/api.js    # API service client
        └── components/
            ├── host/          # Host Dashboard & Table Floor Plan
            ├── guest/         # Mobile Guest Tracker & Waitlist Joiner
            ├── chat/          # Interactive AI Copilot Drawer
            └── sms/           # Simulated Smartphone SMS Inbox Drawer
```

---

## Quick Start Guide

### 1. Run Backend (Python with `uv`)

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```
- **API Base:** `http://localhost:8000`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`
- **Database:** Auto-creates `queuebite.db` (SQLite) and seeds *"The Rustic Olive"* demo tables & parties on first launch.

### 2. Run Frontend (Node.js)

In a separate terminal:

```bash
cd frontend
npm install
npm run dev 
```
```bash
# in a separate terminal, only if needed:
npm audit fix --force   # force-fix security issues
```

- **Frontend App:** `http://localhost:5173`

### 3.Run Test

In a separate terminal:

```bash
cd backend
uv run pytest -v
```

---

## Key Features & Walkthrough

1. **Dual-Portal Interface:**
   - **Host Stand Dashboard:** View real-time queue, add walk-ins with live AI wait prediction, notify guests, and assign tables.
   - **Customer Mobile View:** Track queue position, live wait countdown, self-serve "Running 5m Late" or "Cancel Spot", and QR queue join form.
2. **AI Dynamic Wait-Time Prediction:**
   - Dynamically analyzes party size, section preference, currently occupied tables, and dining duration to project realistic wait times.
3. **AI Table Seating Optimizer:**
   - When seating a party, evaluates table capacity, bus/cleaning status, and turn projection to recommend the highest-scoring table.
4. **Interactive Simulated SMS Drawer:**
   - Click the **SMS Simulator** button to see simulated real-time text notifications sent to guests when added or notified.
5. **Conversational AI Copilot:**
   - Click the **AI Copilot** button to chat with the restaurant assistant (as a guest or host). Works 100% out-of-the-box with built-in intent understanding, and automatically connects to OpenAI/Gemini if API keys are supplied in `backend/.env`.
6. **One-Click Demo Reset:**
   - Click **Reset Demo** on the host dashboard at any time to restore the pre-seeded layout.
