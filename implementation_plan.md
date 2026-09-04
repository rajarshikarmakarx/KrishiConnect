# Implementation Plan — KrishiFlow

**KrishiFlow** is a smart procurement and queue management platform designed for farmers, procurement centre operators, and district administrators. It reduces waiting times, physical congestion, and uncertainty at agricultural procurement centres through real-time queue tracking, smart centre recommendation, transactional counter management, and instant payment status updates.

---

## Proposed Architecture

### Stack Overview
1. **Backend**: Python FastAPI with SQLite (SQLAlchemy async/sync with row locking & transactional queues), Pydantic schemas, and WebSocket / SSE real-time broadcast engine.
2. **Frontend**: Vite + React + TailwindCSS + Lucide Icons + Recharts (analytics) + Leaflet (interactive procurement centre map).
3. **Real-time Layer**: Server-Sent Events (SSE) / WebSocket engine broadcasting live queue status changes instantly to connected Farmer and Operator clients with state re-sync on reconnection.
4. **Design System**: Government/Public-Service + Modern Fintech aesthetic — deep slate, emerald accents, saffron highlight, clean typography, high contrast, mobile-first farmer view, dense data operator dashboard.

---

## User Review Required

> [!NOTE]
> The backend will provide a ready-to-run FastAPI server with built-in real-time WebSocket/SSE broadcast and persistent SQLite database, plus full compatibility options for Supabase integration. A single npm command will start both the backend API and frontend dev server.

> [!TIP]
> A top navigation **"Demo Role Switcher"** will be included so evaluators can seamlessly switch between **Farmer View (Token A127)**, **Haripur Centre Operator View**, and **District Admin Analytics View**, or open side-by-side windows to test real-time instant queue updates.

---

## Key Components to Build

### 1. Database & Backend API (FastAPI)
- **Schema (`backend/app/models.py`)**:
  - `User` (Farmer, Operator, Admin)
  - `ProcurementCentre` (Name, location, distance, active counters, status, max capacity)
  - `CentreCounter` (Counter number, operator name, current active queue entry)
  - `TimeSlot` (Centre ID, date, time window, total capacity, booked count)
  - `QueueEntry` (Token e.g. `A127`, status: `WAITING` | `CALLED` | `PROCESSING` | `COMPLETED` | `CANCELLED`, counter ID, assigned timestamp, ETA)
  - `Procurement` (Queue entry ID, crop, expected qty, accepted qty, rate per kg, total amount)
  - `Payment` (Procurement ID, amount, status: `PROCESSING` | `PAID`, timestamp)
  - `Notification` (Farmer ID, message, timestamp, read status)
- **Transactional Queue Logic (`backend/app/services/queue_service.py`)**:
  - `CALL NEXT`: Server-side database query selecting the oldest `WAITING` token for the centre using transactional locking, setting status to `CALLED`, assigning to available counter.
  - Broadcasts realtime event `QUEUE_CHANGED` to all connected clients.
- **REST Endpoints (`backend/app/api/`)**:
  - Auth: Register & Login (Farmer, Operator, Admin)
  - Centres: List nearby centres, get centre details, smart recommendation scoring
  - Slots: List available time slots for chosen date
  - Queue: Book slot (generates token like `A127`), view my queue status, view centre queue, operator queue actions (`call`, `start`, `complete`, `cancel`)
  - Procurement: Record quantity, calculate payout
  - Payment: Update payment status (`Processing` -> `Paid`)
  - Analytics: District overview & per-centre metrics

### 2. Real-Time Engine (`backend/app/realtime.py`)
- SSE / WebSocket broadcast channel sending event updates when queue entries or payment statuses change.
- Client reconnection logic in React hook `useRealtimeQueue` displaying `🟢 LIVE` or `🟡 Reconnecting...`.

### 3. Frontend Application (React + Tailwind CSS)

#### Design System & Theme
- Color Palette: Public Service Emerald (`#065f46`), Deep Slate (`#0f172a`), Clean Pearl (`#f8fafc`), High-contrast Saffron Accent (`#d97706`).
- Typography: Inter / Roboto, clear bold numbers for Token displays (`A127`), high contrast badges.

#### Modules & Views
1. **Header & Hackathon Demo Switcher**:
   - Quick role switcher buttons: `Farmer View (A127)`, `Operator Dashboard (Haripur)`, `District Admin View`, `Interactive Map`.
   - Real-time connection status pill (`🟢 LIVE`).
2. **Farmer Experience**:
   - **Auth / Registration**: Simple 4-field registration (Name, Mobile, Village, District).
   - **Centre Discovery & Smart Recommendation**:
     - Card list & Map view of centres (Haripur, Bagnan, Uluberia, Amta).
     - Recommendation badge explaining *why* a centre is recommended (e.g. "Shorter queue, 3 active counters, lowest ETA").
   - **Slot Booking Modal**: Date selector, time slots with availability count, crop & expected weight selection.
   - **Live Queue Tracking Screen (The core screen)**:
     - Prominent token banner (`YOUR TOKEN: A127`).
     - Current serving token (`CURRENTLY SERVING: A122`).
     - Live counter of farmers ahead (`4 farmers ahead`).
     - Dynamic ETA badge (`~28 minutes estimated wait`).
     - Visual queue position progress bar and upcoming tokens table.
     - Turn-approaching toast notification (`🔔 Your turn is approaching! Proceed to Counter 2`).
   - **Procurement & Payment Progress Screen**:
     - Real-time state tracker: `Booked` -> `Waiting` -> `Called` -> `Processing` -> `Completed` -> `Payment Processing` -> `Paid`.
     - Procurement summary card (Accepted Qty, Rate ₹/kg, Total Payout).
   - **Farmer History**: Past procurements & downloaded receipts.
3. **Operator Dashboard Experience**:
   - **Centre Overview Banner**: Centre name, active counters count, waiting count, processing count, completed count today.
   - **Counters Grid**: Displays Counter 1, Counter 2, Counter 3 with currently assigned farmer, current token, and quick action buttons (`COMPLETE`, `CANCEL`).
   - **Main Queue Control Table**: List of waiting farmers with token, farmer name, crop, booking time slot.
   - **Action Bar**: Big primary `[ CALL NEXT FARMER ]` button.
   - **Procurement Recording Modal**: Triggered when transitioning from `PROCESSING` to `COMPLETED` — input accepted quantity, rate per kg, auto-calculate total amount.
   - **Payment Quick Trigger**: One-click toggle from `Payment Processing` to `✅ Paid`.
4. **District / Admin Dashboard**:
   - High-level KPIs: Total farmers served today, currently waiting across district, average wait time, total procurement tonnage, total payments disbursed.
   - Workload comparison chart across all 4 procurement centres.
   - Hourly arrival vs procurement throughput chart.
   - Payment settlement percentage donut chart.
   - Interactive district procurement map with live workload badges.

### 4. Demo & Seed Data (`backend/app/seed.py`)
- Automatically populates on first start:
  - 4 Procurement Centres (Haripur, Bagnan, Uluberia, Amta) with active counters.
  - 40+ realistic demo farmers.
  - Live queue state in Haripur Centre: 1-2 processing, 14 waiting (including Token `A127`), 8 completed today.
  - Pre-generated slots for Paddy, Wheat, Mustard, and Jute.

---

## Verification Plan

### Automated Verification
1. Backend test suite (`pytest`) to test transactional `call_next_farmer` logic (ensuring zero double-allocation).
2. API endpoint tests for slot booking, token generation, queue status changes, and analytics aggregation.
3. Frontend build check (`npm run build`) to ensure TypeScript & bundle compilation clean.

### Manual Verification & Demo Flow Walkthrough
1. **Farmer Booking Flow**: Log in as farmer -> select recommended centre (Haripur) -> book slot -> verify token `A127` created.
2. **Live Queue Synchronization Flow**: Open Farmer view (Token A127) in one window and Haripur Operator view in another window -> Click `CALL NEXT` / `COMPLETE` on Operator view -> Verify Farmer UI instantly updates token count, farmers ahead, and estimated wait without browser refresh.
3. **Notification Verification**: Advance queue until Token A127 is 2 entries away -> Verify turn approaching alert pops up -> Call Token A127 -> Verify turn call notification with counter number display.
4. **Procurement & Payment Verification**: Complete procurement for Token A127 -> Enter 242 kg @ ₹23/kg -> Verify total ₹5,566 -> Click `Process Payment` -> Click `Mark Paid` -> Verify instant update on farmer receipt view.
5. **District Analytics Verification**: View district overview metrics, charts, and workload map.

---

## Implementation Steps

1. **Setup Workspace**: Create backend FastAPI directory structure & frontend Vite project in workspace root.
2. **Backend Engine**: Database models, SQLite setup, API endpoints, transactional locking service, SSE/WebSocket queue event manager, seed script.
3. **Frontend Architecture**: React components, Tailwind styling system, Lucide icons, Leaflet map component, Recharts analytics components, SSE/WS hook.
4. **Farmer Components**: Discovery list, Smart recommendation, Slot booking modal, Live Queue card, Procurement & Payment status tracker, History.
5. **Operator Components**: Centre stats header, Active counters list, Action bar (`CALL NEXT`), Queue management table, Procurement modal, Payment status toggle.
6. **Admin Components**: District KPIs, Workload comparison charts, Centre status map, Tonnage summary.
7. **Role Switcher & Interactive Demo Toolbar**: Seamless switching between Farmer, Operator, Admin, and Live side-by-side demo mode.
8. **End-to-End Verification**: Test full PRD hackathon scenario script and polish UI animations and status indicators.
