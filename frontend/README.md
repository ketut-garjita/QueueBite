# QueueBite Frontend

Modern React + Vite frontend for QueueBite Restaurant Waitlist Manager.

## Features
- **Dual-Portal UI:** Instant toggle between Host Stand Dashboard and Customer Mobile View.
- **Real-Time Live Queue:** Shows waiting parties, auto-refreshing wait times, and party statuses.
- **Visual Table Floor Plan:** Displays Indoor Dining, Patio, and Bar Lounge with statuses (`available`, `occupied`, `cleaning`).
- **AI Table Seating Modal:** Recommends the optimal table with match scores and reasoning before seating.
- **Mobile Guest Tracker:** Shows position in line, wait countdown, and celebratory alert when table is ready.
- **Simulated Smartphone SMS Inbox:** Realistic interactive drawer to inspect incoming text alerts without external SMS fees.
- **Interactive AI Copilot Drawer:** Chat with QueueBite AI as a guest or as a host stand operator.

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:5173`.
Ensure the backend is running at `http://localhost:8000`.
