# 🌾 KrishiConnect
> **AI-Powered Fair-Queueing, Digital Quality Assaying & Transparent Direct Benefit Transfer (DBT) Procurement Platform**  
> *Smart Agriculture Governance for Minimum Support Price (MSP) Centres · Govt of West Bengal*

---

## 📌 Table of Contents
- [Executive Overview](#-executive-overview)
- [Key Architectural Highlights](#-key-architectural-highlights)
- [User Personas & End-to-End UI Flows](#-user-personas--end-to-end-ui-flows)
  - [1. Farmer Persona](#1-farmer-persona-)
  - [2. Procurement Centre Operator & Assayer Persona](#2-procurement-centre-operator--assayer-persona-)
  - [3. District Agricultural Officer / Admin Persona](#3-district-agricultural-officer--admin-persona-)
- [Live Demo Accounts & Credentials](#-live-demo-accounts--credentials)
- [Local Installation & Setup](#-local-installation--setup)
- [API Architecture & Endpoints](#-api-architecture--endpoints)
- [Automated E2E Verification & Testing](#-automated-e2e-verification--testing)
- [Production Readiness & Scalability](#-production-readiness--scalability)

---

## 🚀 Executive Overview

Traditional agricultural produce procurement at government mandis suffers from unpredictable wait times, physical congestion, opaque manual quality grading, and delays in payment disbursement.

**KrishiConnect** replaces physical queues with a real-time, AI-assisted digital queueing, digital produce assaying, and direct settlement platform:
1. **Predictable Slot Allocation**: Farmers book verified time slots by crop and quantity.
2. **AI-Driven Decision Engine**: 5-signal centre recommendation algorithm and 7-day Exponential Moving Average (EMA) wait-time forecasting.
3. **Produce Quality Assaying & Safety Guards**: Mandatory Agmark grading based on digital moisture testing (8%–25%), foreign chaff %, and damaged grains %, with strict safety guards preventing procurement of spoiled produce (moisture ≥ 20%).
4. **In-Session Persistent Notification Center**: Real-time event notifications with category icons (Queue 🌾, Assaying 🔬, Payment 💰, Alert ⚠️) and unread counters across all dashboards.
5. **Demo Mobile OTP Authentication**: Fast mobile login (`123456`) with automatic farmer profile provisioning.
6. **Instant Treasury DBT Disbursal**: Operator-authorized Direct Benefit Transfer (DBT) with instant WebSocket push notifications to farmers.

---

## 🏗️ Key Architectural Highlights

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KrishiConnect Architecture                      │
├───────────────────────────────────┬────────────────────────────────────┤
│           Farmer Portal           │         Officer / Admin Desk       │
│        (React 18 + Vite)          │         (React 18 + Tailwind)      │
└─────────────────┬─────────────────┴──────────────────┬─────────────────┘
                  │                                    │
                  ▼                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │             FastAPI Asynchronous Gateway                │
       │    REST Endpoints + WebSockets (/ws/centre, /ws/farmer) │
       └────────────────────────────┬────────────────────────────┘
                                    │
     ┌──────────────────────────────┼──────────────────────────────┐
     ▼                              ▼                              ▼
┌──────────────┐          ┌────────────────────┐         ┌────────────────────┐
│ AI Engine    │          │ Queue & Assaying   │         │ Payments & DBT     │
│ • EMA Wait   │          │ • Capacity Guards  │         │ • Live Disbursal   │
│ • Recommender│          │ • Agmark Standards │         │ • PFMS / e-Kuber   │
│ • MSP Oracle │          │ • Moisture Safety  │         │ • Impact Analytics │
└──────────────┘          └────────────────────┘         └────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │       SQLAlchemy Async DB (Supabase Postgres / SQLite)  │
       └─────────────────────────────────────────────────────────┘
```

- **Dual-Channel WebSocket Synchronization**: Heartbeat-stabilized WebSocket channels for both procurement centres and private farmer notifications.
- **Fail-Safe & Auto-Healing Endpoints**: Procurement invoice routes auto-generate statutory MSP defaults on-the-fly, preventing 404s and client loading hangs.
- **Strict Concurrency & Safety Guards**: Atomic counter validation prevents farmer status transitions when counters are occupied, and safety checks block spoiled produce.
- **In-Session Notification Center**: Deduplicated event ingestion across WebSocket reconnects with read/unread tracking.

---

## 👥 User Personas & End-to-End UI Flows

---

### 1. Farmer Persona 🌾
**Portal Route**: `http://localhost:5173/`

#### UI Journey & Step-by-Step Flow:
```
[1. Mobile OTP / Password Login] ──► [2. Smart Centre Recommender] ──► [3. Slot Booking]
                                                                              │
[6. DBT Settled Receipt] ◄── [5. Digital Assaying & Intake] ◄── [4. Live Queue & Turn Alert]
```

1. **Authentication (Demo OTP & Password)**:
   - Log in using 10-digit mobile number with **Demo OTP (`123456`)**, standard password, or register a new profile.
2. **AI Centre Recommender & MSP Guide**:
   - Evaluates available centres across 5 weighted signals (Queue Pressure, Transit Time, Slot Availability, Throughput, Village Proximity).
   - View statutory Kharif 2025-26 rates via the **MSP Oracle Modal** (e.g. Paddy at ₹23.00/kg).
3. **Slot Booking**:
   - Select a centre, pick an available 1-hour time window, enter crop type, and provide estimated weight (e.g. `250 kg`).
4. **Live Digital Token & Queue Tracking**:
   - Instant token issuance (e.g. `A101`).
   - Live dashboard displays current serving token, number of farmers ahead, and dynamic EMA wait-time estimate.
5. **Turn Announcement (`CALLED`) & Digital Assaying**:
   - Farmer proceeds to the designated counter.
   - Produce is evaluated for moisture and impurities:
     - **Grade A (FAQ Standard)**: Moisture ≤ 14.0% $\rightarrow$ 100% MSP rate.
     - **Grade B (Permissible Standard)**: Moisture 14.1%–17.0% $\rightarrow$ 98% rate.
     - **Grade C (Sun-Drying Grace)**: Moisture 17.1%–19.9% $\rightarrow$ 2.5-hour mandi courtyard drying grace period.
     - **Lot Rejection**: Moisture ≥ 20.0% $\rightarrow$ Blocked to prevent aflatoxin/rot contamination in public godowns.
6. **Verified Receipt & Real-time DBT Confirmation**:
   - Displays accepted weight, Agmark Quality Certificate, verified MSP rate, and total settlement amount.
   - Status updates in real-time from `⏳ Payout In Pipeline` to `✨ Direct Payout Settled` with official Government DBT Reference ID (`WB-DBT-2025-XXXXXX`).

---

### 2. Procurement Centre Operator & Assayer Persona 🏢
**Portal Route**: `http://localhost:5173/admin` *(Logged in as Operator)*

#### UI Journey & Step-by-Step Flow:
```
[1. Counter Dashboard] ──► [2. Capacity Check & Call] ──► [3. Produce Quality Assay Modal]
                                                                        │
[5. Disbursal Logged]  ◄── [4. Confirm Govt Payment Disbursal] ◄────────┘
```

1. **Active Counter Overview**:
   - Displays real-time status of all centre counters (`FREE` vs `BUSY`) and currently served tokens.
2. **Capacity Enforcement & Calling**:
   - Operators call the next farmer in FIFO order or call a specific waiting token.
3. **Produce Intake & Quality Assay Modal**:
   - Interactive digital moisture slider (8%–25%) with real-time Agmark grade indicator (`Grade A`, `Grade B`, `Sun-Drying Grace`, `Spoilage Hazard`).
   - Inputs for foreign chaff % and damaged grain %.
   - One-click actions for **Mandi Sun-Drying Grace (2.5h)** and **Formal Lot Rejection**.
4. **Weighbridge & Payout Calculation**:
   - Record net accepted weight, sync with statutory MSP rate, and certify intake.
5. **Govt Direct Benefit Transfer (DBT) Disbursal Desk**:
   - Authorize instant DBT payment, writing treasury reference and notifying the farmer in real time.

---

### 3. District Agricultural Officer / Admin Persona 📊
**Portal Route**: `http://localhost:5173/admin` *(Logged in as Admin)*

#### UI Journey & Capabilities:
1. **District-Wide Operational Summary**:
   - Aggregated metrics across all procurement centres: Total Farmers Served, Real-time Waiting/Processing counts, and Average Wait Times (computed in IST).
2. **Before-vs-After Impact Assessment Panel (`/analytics/impact`)**:
   - Baseline comparison against the 90-minute traditional paper queue benchmark:
     - **Wait Time Reduction**: ~72% reduction measured.
     - **Farmer Hours Saved**: Cumulative hours saved across district farmers.
     - **DBT Settlement Rate**: Percentage of procurements paid within the statutory 24-hour SLA.
3. **AI & Data Transparency Manifest (`/ai/manifest`)**:
   - Inspects AI model training metadata, features, and synthetic training parameters.
4. **Live In-Session Notification Center**:
   - Alerts for centre congestion spikes, daily milestones, and payment batches.

---

## 🔑 Live Demo Accounts & Credentials

| Role | Mobile Number | Password / Demo OTP | 1-Click UI Shortcut |
| :--- | :--- | :--- | :--- |
| **Farmer (Ramesh Kumar)** | `9876543210` | `demo123` or OTP `123456` | 🌾 1-Click Demo on `/` |
| **Farmer (Suresh Ghosh)** | `9000000002` | `demo1234` or OTP `123456`| 🚜 1-Click Demo on `/` |
| **Operator (Haripur Centre)** | `9000000001` | `operator123` | 🏢 1-Click Demo on `/admin` |
| **District Agricultural Officer** | `9000000000` | `admin123` | 🏛️ 1-Click Demo on `/admin` |

---

## 💻 Local Installation & Setup

### Prerequisites
- **Python**: `3.10+`
- **Node.js**: `18.0+` & `npm`

### Quick Start (All-in-One Script)
```bash
# Clone the repository
git clone https://github.com/your-username/KrishiConnect.git
cd KrishiConnect

# Grant execution rights and launch both backend & frontend
chmod +x start.sh
./start.sh
```

---

### Manual Step-by-Step Setup

#### 1. Backend (FastAPI + Async SQLAlchemy)
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Reset and seed database with 30-day AI history and clean demo state
python -m app.seed --reset

# Start FastAPI server on port 8000
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend (React + Vite + Tailwind CSS)
```bash
cd frontend

# Install packages
npm install

# Start Vite development server on port 5173
npm run dev
```

---

## 🔌 API Architecture & Endpoints

Interactive Swagger API documentation is available at `http://localhost:8000/docs`.

### Core Endpoints

| Category | Method | Path | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/auth/login` | JWT password authentication |
| **Auth** | `POST` | `/auth/send-otp` | Generate demo OTP (master code `123456`) |
| **Auth** | `POST` | `/auth/verify-otp` | Verify OTP & auto-provision farmer account |
| **Auth** | `POST` | `/auth/register` | Farmer profile registration |
| **Centres** | `GET` | `/centres` | List procurement centres with live waiting counts |
| **Centres** | `GET` | `/centres/{id}/slots` | Available 1-hour time slots for a given date |
| **Queue** | `POST` | `/queue/book` | Book slot, validate capacity, issue digital token |
| **Queue** | `GET` | `/queue/my/active` | Get active booking and live position in queue |
| **Queue** | `POST` | `/queue/{id}/call` | Operator calls specific token (guarded by counter capacity) |
| **Queue** | `POST` | `/queue/{id}/quality-action` | Record Sun-Drying Deferral or Formal Lot Rejection |
| **Queue** | `POST` | `/queue/{id}/complete` | Atomically certifiy quality assay, intake weight & payout |
| **Queue** | `GET` | `/queue/{id}/procurement` | Auto-healing procurement invoice and DBT status |
| **Payments**| `GET` | `/payments/centre/{id}/pending`| Get pending payments awaiting DBT disbursal |
| **Payments**| `POST` | `/payments/{id}/pay` | Authorize DBT payment and broadcast instant sync |
| **AI Layer**| `GET` | `/ai/eta/{centre_id}` | 7-day EMA processing forecasting engine |
| **AI Layer**| `GET` | `/ai/recommend` | 5-factor weighted centre recommender |
| **AI Layer**| `GET` | `/ai/msp-rates` | Statutory Kharif 2025-26 MSP oracle |
| **Analytics**| `GET`| `/analytics/district` | Live IST-timezone aggregated district dashboard metrics |
| **Analytics**| `GET`| `/analytics/impact` | Baseline vs current performance impact panel |
| **Analytics**| `GET`| `/analytics/system-health` | Production scalability and database audit |

---

## 🧪 Automated E2E Verification & Testing

The repository includes a comprehensive automated test suite verifying authentication, quality assaying, safety guards, queue capacity, and analytics.

```bash
cd backend
# 1. Test Demo OTP Authentication Flow
./venv/bin/python test_auth_otp.py

# 2. Test Produce Quality Assaying & Safety Guards
./venv/bin/python test_assayer_flow.py

# 3. Test District Analytics & IST Timezones
./venv/bin/python test_district_analytics_verification.py

# 4. Full End-to-End Workflow Test
./venv/bin/python test_e2e.py
```

**Expected Test Output**:
```
🌾 Running KrishiConnect End-to-End Test Suite...
1️⃣  Testing Authentication & Users...                ✅ Auth & JWT tokens verified
2️⃣  Testing Procurement Centres...                  ✅ Live metrics verified
3️⃣  Testing Smart AI Recommender...                  ✅ Multi-signal scoring verified
4️⃣  Testing AI EMA Wait-Time Predictor...           ✅ EMA wait estimation verified
5️⃣  Testing Govt MSP Rates Oracle...                ✅ MSP Oracle verified
6️⃣  Testing AI Data-Transparency Manifest...        ✅ Data manifest verified
7️⃣  Testing Impact Analytics & System Health...     ✅ Analytics verified
8️⃣  Testing Counter Occupancy Guard & Payment...    ✅ Capacity enforcement & DBT settlement verified

🎉 ALL E2E TESTS PASSED CLEANLY! KrishiConnect is fully operational.
```

---

## 🛡️ Production Readiness & Scalability

- **Database Concurrency**: Employs `SELECT FOR UPDATE SKIP LOCKED` for transactional queue calling to eliminate race conditions.
- **Moisture Safety Guard**: Strict programmatic guard blocks intake of produce lots with moisture $\ge 20\%$.
- **WebSocket Stability**: Client hooks utilize `useRef` event callback anchors and 20-second ping/pong heartbeats to prevent churn during component re-renders.
- **IST Timezone Alignment**: Date aggregation queries computed using explicit `timezone('Asia/Kolkata', ...)` boundaries to prevent day-shift discrepancies.
- **Scalability Transition**: Zero-code database driver swap from SQLite (local development) to PostgreSQL / Supabase connection pooling for production deployments supporting 50,000+ concurrent farmers.
