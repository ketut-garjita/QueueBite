# QueueBite Backend

FastAPI & SQLModel backend for the QueueBite Restaurant Waitlist Manager, managed with `uv`.

## Features
- **Queue Management:** Real-time party waitlist with status tracking (`waiting`, `notified`, `seated`, `cancelled`, `no_show`).
- **Table Floor Management:** Real-time tracking of Indoor, Patio, and Bar tables across `available`, `occupied`, and `cleaning` states.
- **Dynamic AI Wait-Time Prediction:** Considers queue depth, elapsed dining minutes of occupied tables, party size compatibility, and historical turn rates.
- **Smart Table Seating Optimizer:** Scores and recommends optimal table assignments for waiting parties.
- **Conversational AI Copilot:** Built-in semantic intent parser + optional OpenAI/Gemini support for host stand operations and guest queries.
- **Simulated SMS Notification Engine:** Logs and manages guest notifications without requiring third-party carrier fees.
- **One-Click Demo Reset:** Pre-loaded with *"The Rustic Olive"* floor plan and active parties.

## Running with `uv`

```bash
# 1. Navigate to backend directory
cd backend

# 2. Run the application (uv will automatically install dependencies and start the server)
uv run uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.
Interactive Swagger UI documentation is available at `http://localhost:8000/docs`.
