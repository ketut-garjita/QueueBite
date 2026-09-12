# QueueBite — AI-Powered Restaurant Waitlist Manager

## 1. Executive Summary
**QueueBite** is a modern, AI-augmented waitlist and table management platform designed for high-turnover restaurants. It bridges the gap between walk-in guests and host stand operations with intelligent queue scheduling, live guest tracking, and dynamic wait-time predictions.

---

## 2. Core Architecture & User Portals

### A. Host Stand Dashboard (Staff)
- **Live Queue Feed:** View waiting parties sorted by wait time, party size, and priority.
- **Table Management & Floor View:** Real-time visual overview of tables (Available, Occupied, Reserved, Cleaning).
- **Party Actions:** 
  - Quick walk-in registration (Name, Phone, Party size, Special notes/dietary).
  - Status updates: `Waiting` ➔ `Notified` ➔ `Seated` ➔ `Completed` (or `Cancelled` / `No-Show`).
  - Table assignment with AI recommendations based on party size and predicted turnaround.
- **AI Assist:** Smart wait-time calculations and automated smart notifications.

### B. Customer Portal (Mobile Web)
- **Queue Status Screen:** Shows current position in line, estimated wait time, and live status.
- **Self-Serve Actions:** Ability to notify host if running late or cancel queue spot.
- **QR Code Entry:** Scan at restaurant entrance to join the queue without waiting in line to speak to the host.

---

## 3. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Backend** | Python 3.11+, FastAPI, `uv` | Ultra-fast ASGI framework, modern typing, asynchronous APIs, rapid package management via `uv` |
| **Database** | SQLite + SQLModel / SQLAlchemy + Alembic | Zero-config, reliable transactional database, portable for dev & production |
| **Frontend** | Node.js, React, Vite, Tailwind CSS, Lucide Icons | Fast reactive UI, responsive mobile view for customers and clean desktop/tablet UI for hosts |
| **AI Layer** | Python Hybrid AI Engine | 1) **Predictor & Optimizer:** Real-time wait-time estimation based on table turnover rates & party sizes.<br>2) **Conversational Assistant:** LLM-powered guest status/menu queries & host stand AI copilot. |

---

## 4. AI Capabilities (Hybrid Engine)

### 1. Wait-Time & Table Allocation Optimizer
- **Predictive Turnover:** Calculates expected dining duration based on party size, current restaurant busyness, and time of day.
- **Smart Seating Recommendations:** Recommends optimal table combinations (e.g. merging two 2-tops for a party of 4) to minimize wait times.

### 2. Conversational Copilot & Guest Assistant
- **Guest Inquiries:** Live chat answering "How much longer?", "Can we sit outside?", or general menu/dietary FAQs.
- **Host Stand Copilot:** Natural language commands (e.g., *"Seat the Smith party at Table 4"*, *"Who has been waiting the longest?"*).

---

## 5. Tenancy & Access Control
- **Model:** Single-Restaurant Focus (Optimized for operational speed and MVP excellence).
- **Host Access:** Fast Host Mode switch with optional PIN code for staff actions.
- **Guest Access:** Zero-friction mobile web link / QR code (no registration or login required).

---

## 6. Notification & Live Update System
- **Real-Time Guest Status:** Auto-polling/SSE updates for queue position, estimated minutes, and status changes.
- **Audio Chime:** Audible chime on guest screen when status switches to `Notified` (Table Ready).
- **Interactive SMS Simulator:** Embedded host & customer SMS preview drawer to test text notifications seamlessly without requiring paid third-party gateway credentials.

---

## 7. AI Execution & Fallback Strategy
- **Zero-Dependency Mode (Default):**
  - **Wait-Time Engine:** Statistical regression + queue depth + table turnover velocity matrix.
  - **Conversational Assistant:** Built-in intent parser & state machine handling queue queries, cancellations, menu questions, and host commands without external API dependencies.
- **Enhanced LLM Mode (Configurable via `.env`):**
  - When `OPENAI_API_KEY` or `GEMINI_API_KEY` is present, dynamically proxies complex unstructured guest questions and host assistant queries to LLM with full context.

---

## 8. Proposed Data Model
- **`Restaurant`**: ID, name, operating hours, capacity.
- **`Table`**: ID, label/number, capacity (seats), section (indoor/outdoor/bar), status (`available`, `occupied`, `reserved`, `cleaning`).
- **`WaitlistEntry`**: ID, customer name, phone, party size, notes, joined_at, estimated_wait_minutes, notified_at, seated_at, status (`waiting`, `notified`, `seated`, `cancelled`, `no_show`), assigned_table_id.
- **`TableTurnHistory`**: Records past party sizes and dining durations to train/calibrate AI wait time predictions.
- **`NotificationLog`**: ID, entry_id, recipient_phone, message, sent_at, channel (`sms_simulated`, `web_push`).

---

## 9. Pre-Seeded Demo Dataset
- **Restaurant:** *"The Rustic Olive"* (Italian/Mediterranean, casual fine dining).
- **Floor Plan:** 12 tables divided across 3 sections (Main Dining, Patio, Bar Lounge) with 2-tops, 4-tops, and 6-top booths.
- **Initial State:**
  - 4 occupied tables with varied elapsed dining times.
  - 3 waiting parties in queue with AI estimated wait times.
  - 1 notified party waiting to be seated.
- **Demo Controls:** Host UI includes a *"Reset to Demo State"* button for clean repeatability.

---

## 10. Project Directory Layout

```
aidevtools-module2/
├── PROJECT_SCOPE.md               # Scoping & architecture documentation
├── backend/                       # Python backend managed by uv
│   ├── pyproject.toml             # uv project dependencies
│   ├── app/
│   │   ├── main.py                # FastAPI entry point & CORS
│   │   ├── config.py              # Settings & optional API keys
│   │   ├── database.py            # SQLite engine & session management
│   │   ├── models.py              # SQLModel database schemas
│   │   ├── seed.py                # "The Rustic Olive" demo seed generator
│   │   ├── ai/
│   │   │   ├── predictor.py       # Turnover & wait-time estimation engine
│   │   │   ├── assistant.py       # Conversational AI assistant & host copilot
│   │   │   └── optimizer.py       # Smart table assignment algorithm
│   │   └── routes/
│   │       ├── queue.py           # Waitlist CRUD, status transitions
│   │       ├── tables.py          # Table status & floor management
│   │       ├── ai.py              # AI prediction, optimizer & chat endpoints
│   │       └── notifications.py   # Simulated SMS & push log
└── frontend/                      # Node.js + React frontend
    ├── package.json
    ├── vite.config.js
    ├── src/
    │   ├── App.jsx                # Router & tab switcher (Host Stand / Customer)
    │   ├── components/
    │   │   ├── host/              # Host Stand Dashboard & Table Floor Map
    │   │   ├── guest/             # Customer Wait Status & Queue Joiner
    │   │   ├── chat/              # AI Conversational Copilot Drawer
    │   │   └── sms/               # Interactive Simulated SMS Phone Drawer
    │   └── services/              # API client & live polling
```

---

## 11. Scoping & Implementation Checklist
- [x] Application name decided: **QueueBite**
- [x] Dual-portal scope decided (Host Dashboard + Customer Mobile Status)
- [x] AI Feature Focus: **Hybrid** (Wait-Time/Seating Optimizer + Conversational Assistant)
- [x] Tenancy model: **Single-Restaurant with Host PIN & zero-friction guest access**
- [x] Guest notification: **Live Web Status + Interactive SMS Simulator + Audio Alert**
- [x] AI Engine Provider: **Self-Contained Hybrid Engine with optional external LLM key**
- [x] Pre-seeded demo dataset: **"The Rustic Olive" with instant reset capability**
- [x] Python backend scaffolded with `uv`, FastAPI, SQLModel, and SQLite database
- [x] Dynamic AI wait-time prediction and table seating optimizer implemented
- [x] Conversational AI Copilot with local intent engine and LLM fallback created
- [x] React + Vite frontend scaffolded with Host Dashboard, Table Floor Plan, Guest Tracker, and Simulated SMS Drawer
- [x] End-to-end integration and run documentation completed in [README.md](file:///home/deai/zoomcamp/myprojects/aidevtools-module2/README.md)

