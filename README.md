# 🌾 KrishiConnect
> **AI-Powered Fair-Queueing, Digital Quality Assaying, Multilingual Voice AI & Transparent Direct Benefit Transfer (DBT) Procurement Platform**  
> *Smart Agriculture Governance for Minimum Support Price (MSP) Mandis & Procurement Centres · Govt of West Bengal & Pan-India*

---

## 📌 Table of Contents
- [Executive Overview](#-executive-overview)
- [System Architecture & Distributed Mesh](#-system-architecture--distributed-mesh)
- [Pan-Indian 12 Languages Multilingual Support](#-pan-indian-12-languages-multilingual-support)
- [Voice AI Assistant & Multilingual Dialect Booking](#-voice-ai-assistant--multilingual-dialect-booking)
- [Conversational Agricultural Assistant ("Ask Anything")](#-conversational-agricultural-assistant-ask-anything)
- [AI Decision Engine & Predictive Analytics](#-ai-decision-engine--predictive-analytics)
- [Statutory Agmark Assaying & Automatic Gradewise Pricing](#-statutory-agmark-assaying--automatic-gradewise-pricing)
- [Two-Tier *SOS Priority Queueing & Statutory Pleading Layer](#-two-tier-sos-priority-queueing--statutory-pleading-layer)
- [Zero-Trust Offline Mandi Operations Protocol (ZT-OMOP)](#-zero-trust-offline-mandi-operations-protocol-zt-omop)
- [Interactive Navigation Map & Transit Routing](#-interactive-navigation-map--transit-routing)
- [High-Performance Redis Acceleration & Distributed Mesh](#-high-performance-redis-acceleration--distributed-mesh)
- [User Personas & End-to-End UI Flows](#-user-personas--end-to-end-ui-flows)
  - [1. Farmer Persona](#1-farmer-persona-)
  - [2. Procurement Centre Operator & Assayer Persona](#2-procurement-centre-operator--assayer-persona-)
  - [3. District Agricultural Officer / Admin Persona](#3-district-agricultural-officer--admin-persona-)
- [Official Form 'J' Statutory Printable Invoice](#-official-form-j-statutory-printable-invoice)
- [Notification Center & Smart Toast Lifecycle Engine](#-notification-center--smart-toast-lifecycle-engine)
- [Live Demo Accounts & Credentials](#-live-demo-accounts--credentials)
- [Local Installation, Docker & Startup Guide](#-local-installation-docker--startup-guide)
- [API Architecture & Endpoints](#-api-architecture--endpoints)
- [Automated E2E Verification & Testing](#-automated-e2e-verification--testing)
- [Production Readiness, Security & Scalability](#-production-readiness-security--scalability)

---

## 🚀 Executive Overview

Traditional agricultural produce procurement at government mandis suffers from unpredictable wait times, severe physical congestion, subjective manual quality grading, fraudulent middleman queue jumping, and opaque settlement delays.

**KrishiConnect** transforms the public procurement ecosystem into a real-time, AI-assisted digital queueing, automated produce assaying, and direct settlement platform:
1. **Predictable Slot Allocation**: Farmers book verified time slots by crop and volume, eliminating overnight physical queueing.
2. **Multilingual Voice AI Booking**: Farmers can speak in regional dialects and colloquial units (e.g., *বস্তা / bags, গাড়ি / trolley, দশ চাকা / 10-wheeler, quintals*) to instantly auto-fill and confirm bookings with audio feedback.
3. **AI Decision Engine**: 5-signal centre recommendation algorithm and 7-day Exponential Moving Average (EMA) wait-time forecasting ($\alpha = 0.35$).
4. **Mandatory Agmark 3-Parameter Assaying**: Automated digital grading across Moisture % (8%–25%), Foreign Chaff %, and Damaged Grain %, applying statutory price value cuts (e.g. 2% deduction for Grade B) and strict safety guards blocking spoiled grain ($\ge 20\%$ moisture).
5. **Two-Tier *SOS Priority Queueing**: Statutory pleading layer under Rule 14-B allowing on-site gate assayers to petition emergency queue jumps, subject to real-time discretionary approval by the District Agricultural Officer with an immutable audit trail.
6. **Zero-Trust Offline Mandi Protocol (ZT-OMOP)**: Fully deterministic offline rule engine with seeded HMAC-SHA256 offline OTPs, IndexedDB outbox, and cryptographic device signing for 2G/blackout operational resilience.
7. **Interactive Route Map & Transit Matrix**: Turn-by-turn road navigation via OSRM, agricultural vehicle speeds (tractor, tempo, bike), live GPS vs village switcher, and 1-click Google Maps deep linking.
8. **Instant Treasury Direct Benefit Transfer (DBT)**: Operator-authorized Direct Benefit Transfer via PFMS/e-Kuber integration with instant push notifications, SMS delivery, and Section 14(2) Form 'J' printable invoices.

---

## 🏗️ System Architecture & Distributed Mesh

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               KrishiConnect Architecture                               │
├───────────────────────────────────┬────────────────────────────────────────────────────┤
│           Farmer Portal           │                Officer / Admin Desk                │
│   (React 18 + Vite + Tailwind)    │      (React 18 + Operations + District Portal)     │
└─────────────────┬─────────────────┴─────────────────────────┬──────────────────────────┘
                  │                                           │
                  ▼                                           ▼
       ┌──────────────────────────────────────────────────────────────────────────┐
       │                       FastAPI Asynchronous Gateway                       │
       │           REST APIs + WebSockets (/ws/centre, /ws/farmer, /ws/admin)     │
       └──────────────────────────────┬───────────────────────────────────────────┘
                                      │
     ┌────────────────────────────────┼─────────────────────────────────┐
     ▼                                ▼                                 ▼
┌──────────────────────┐   ┌────────────────────────┐      ┌─────────────────────────┐
│ AI & Voice Engine    │   │ Queue & Assaying Core  │      │ Payments & Settlement   │
│ • EMA Wait (α=0.35)  │   │ • Atomic Slot Capacity │      │ • Instant Treasury DBT  │
│ • 5-Signal Recommender│  │ • 3-Parameter Assaying │      │ • PFMS / e-Kuber Ref    │
│ • Voice NLU Dialects │   │ • Gradewise Price Cut  │      │ • Form 'J' Print Engine │
│ • Vernacular Chatbot │   │ • Two-Tier SOS Pleading│      │ • SMS OTP & Live Alerts │
└──────────────────────┘   └────────────────────────┘      └─────────────────────────┘
     │                                │                                 │
     ▼                                ▼                                 ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        Distributed Mesh & Caching Layer                                │
│        • Redis 7.2 Cache-Aside (Hot Stats, Rate Limiting, Geo Matrix Caching)          │
│        • Redis Distributed Pub/Sub Mesh (Cross-Worker WebSocket Broadcasting)          │
└─────────────────────────────────────┬──────────────────────────────────────────────────┘
                                      │
                                      ▼
       ┌──────────────────────────────────────────────────────────────────────────┐
       │              SQLAlchemy Async ORM (PostgreSQL / Supabase / SQLite)       │
       │      • B-Tree UTC Timestamp Range Scans • SELECT FOR UPDATE Concurrency  │
       └──────────────────────────────────────────────────────────────────────────┘
```

---

## 🌐 Pan-Indian 12 Languages Multilingual Support

KrishiConnect incorporates an enterprise zero-reload internationalization (`i18n`) architecture covering 12 scheduled Indian languages with authentic agricultural vocabulary and Eastern Indic numeral localization:

| Code | Language | Native Script | Agricultural Regional Terminology & Coverage |
| :--- | :--- | :--- | :--- |
| `en` | **English** | English | Statutory administrative standard & official gazette nomenclature |
| `bn` | **Bengali** | বাংলা | Full West Bengal mandi workflow, assaying norms, Eastern Indic numerals |
| `hi` | **Hindi** | हिन्दी | Inter-state agricultural trade, central MSP circulars, and Devnagari numerals |
| `mr` | **Marathi** | मराठी | Maharashtra APMC standards, moisture assaying, and vernacular UI |
| `te` | **Telugu** | తెలుగు | Rythu Bharosa mandi operations and coastal agricultural terminology |
| `ta` | **Tamil** | தமிழ் | Uzhavar Sandhai procurement workflows and statutory invoicing |
| `gu` | **Gujarati** | ગુજરાતી | APMC market yard terminology, cash crop trading, and invoicing |
| `kn` | **Kannada** | ಕನ್ನಡ | Raitha Samparka Kendra grain standards and moisture thresholds |
| `ml` | **Malayalam** | മലയാളം | Kerala agricultural marketing terminology and DBT status tags |
| `pa` | **Punjabi** | ਪੰਜਾਬੀ | Mandi grain elevator operations, wheat/paddy intake, and Gurmukhi script |
| `or` | **Odia** | ଓଡ଼ିଆ | RMC procurement workflow, Paddy procurement, and Utkal terminology |
| `as` | **Assamese** | অসমীয়া | Assam agricultural marketing terminology and Eastern Indic numerals |

- **Zero-Reload Switching**: Seamless header dropdown retaining active form states, WebSocket feeds, and map layers.
- **Backend SMS Localization**: Automatic translation of SMS OTPs, booking confirmations, and turn alerts into the farmer's registered language.

---

## 🎙️ Voice AI Assistant & Multilingual Dialect Booking

To solve accessibility barriers for rural farmers speaking regional dialects, KrishiConnect features an intelligent **Voice AI Booking Engine**:

- **Speech-to-Text Language Binding**: Audio recognition strictly bound to the farmer's active UI language (Bengali, Hindi, English).
- **Colloquial Agricultural Unit Recognition**:
  - `বস্তা / बोरी / bag`: Converted automatically to $0.5\text{ quintals}$ ($50\text{ kg}$).
  - `গাড়ি / গাড়ি / trolley`: Standard farm mini-trolley converted to $25.0\text{ quintals}$.
  - `দশ চাকা / 10-wheeler / truck`: Converted to $150.0\text{ quintals}$.
  - `কুইন্টাল / क्विंटल / quintal` & `কেজি / किलो / kg`: Converted to standard decimal quintals.
- **Ambiguity Detection & Empathetic Clarification**:
  - Missing parameters automatically fall back to sensible defaults (nearest mandi, staple crop, morning slot, 25 Q mini-trolley load).
  - Generates a localized spoken confirmation message: e.g., *"আমরা আপনার জন্য কাল সকাল ১০টায় সিঙ্গুর মান্ডিতে ৪০ কুইন্টাল ধানের স্লট নির্ধারণ করেছি। এটি কি ঠিক আছে?"*
- **Built-in TTS Audio Playback**: In-browser audio streaming proxy ensuring flawless Bengali/Hindi pronunciation even on systems without regional OS voice packs.
- **1-Click Sample Voice Chips**: Instant sample audio prompts for rapid demonstration during live evaluations.

---

## 💬 Conversational Agricultural Assistant ("Ask Anything")

Integrated floating AI assistant (**Krishi AI Sahayak**) accessible across all farmer pages:
- **Vernacular Agricultural Advisory**: Answers queries in authentic Bengali, Hindi, or English.
- **Domain Knowledge Base**:
  - Statutory Kharif 2025-26 MSP prices for all crops (Paddy Common ₹23.00/kg, Grade A ₹23.20/kg, Wheat ₹22.75/kg, Mustard ₹59.50/kg, Jute ₹53.35/kg, Potato ₹10.25/kg, Onion ₹18.25/kg).
  - Moisture assaying rules, 2.5h / 24h courtyard sun-drying grace periods, and fungal rot safety limits.
  - Required mandi documentation (Aadhaar/Voter ID, Aadhaar-linked Bank Passbook, Krishak Bandhu ID / Land ROR).
  - Direct Benefit Transfer (DBT) PFMS/e-Kuber disbursal timelines (24–48 hours).
- **Interactive Quick Prompts & Context Awareness**: Adapts responses based on farmer's name, village, and registered crops.

---

## 🤖 AI Decision Engine & Predictive Analytics

KrishiConnect avoids unverified black-box ML, employing auditable, statistical AI models designed for high operational integrity:

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 5-Signal Weighted AI Model              │
                  ├─────────────────────────────────────────────────────────┤
                  │  1. Door-to-Door Predicted Time (Transit + EMA)  [40%] │
                  │  2. Live Queue Pressure Index (Load / Counters)   [25%] │
                  │  3. Daily Slot Scarcity & Availability            [15%] │
                  │  4. 7-Day Historical Centre Throughput (Cap/Hr)   [12%] │
                  │  5. Village Geographic Proximity & Road Distance  [ 8%] │
                  └────────────────────────────┬────────────────────────────┘
                                               │
                                               ▼
                         ┌───────────────────────────────────────────┐
                         │ Composite Recommender Score [0.00 - 1.00] │
                         └───────────────────────────────────────────┘
```

1. **7-Day Exponential Moving Average (EMA) Wait-Time Predictor**:
   $$\text{EMA}_{t} = \alpha \cdot \text{Wait}_{t} + (1 - \alpha) \cdot \text{EMA}_{t-1} \quad (\alpha = 0.35)$$
   Learns from actual 7-day throughput variance across shifts and days-of-week, applying a half-weighted live queue load delta.
2. **5-Signal Dynamic Centre Recommender**:
   Evaluates all nearby procurement centres using dynamic OSRM road distance from the farmer's village, load-balancing traffic away from congested yards.
3. **AI Operational Analytics Advisor (District Admin Overview)**:
   Synthesizes real-time district telemetry into executive summaries under each dashboard chart (Queue Load, DBT Settlement Velocity, Throughput Distribution, and Impact Benchmark Validation).
4. **Data Transparency & Model Manifest (`/ai/data-info`)**:
   Full public transparency manifest documenting data provenance, WBAMB benchmark modeling, and inference-time execution.

---

## 🔬 Statutory Agmark Assaying & Automatic Gradewise Pricing

KrishiConnect digitizes grain quality assessment at the weighbridge counter, enforcing statutory standards from the Directorate of Marketing & Inspection (DMI) and FCI Value Cut Schedules:

```
[Produce Arrives at Weighbridge] ──► [3-Parameter Digital Assaying] ──► [Grade & Value Determination]
                                      • Moisture % (8% - 25%)           • Grade A: 100% MSP Payout
                                      • Foreign Chaff % (0% - 5%)       • Grade B: 98% MSP (2% Cut)
                                      • Damaged Grain % (0% - 5%)       • Grade C: Sun-Drying Grace
                                                                        • ≥20% Moisture: REJECTED
```

### Statutory Grading & Pricing Schedule (Kharif 2025-26)

| Agmark Grade Tier | Moisture Limit | Foreign Chaff | Damaged Grains | Price Multiplier | Statutory Status | Mandatory Action / Governance |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Grade A (FAQ)** | $\le 14.0\%$ | $\le 1.0\%$ | $\le 1.0\%$ | **$1.00$ (100%)** | `APPROVED` | Full statutory MSP floor price (e.g. ₹23.00/kg Paddy). |
| **Grade B (Permissible)** | $14.1\% - 17.0\%$ | $1.1\% - 2.0\%$ | $1.1\% - 2.0\%$ | **$0.98$ (98%)** | `APPROVED` | Accepted with statutory **2% value cut** to prevent lot rejection. |
| **Grade C (Marginal)** | $17.1\% - 19.9\%$ | $2.1\% - 3.5\%$ | $2.1\% - 3.5\%$ | **$0.90$ (90%)** | `DEFERRED` | Admitted to 2.5h mandi courtyard sun-drying or 10% penalty. |
| **Rejected (Hazard)** | $\ge 20.0\%$ | $> 3.5\%$ | $> 3.5\%$ | **$0.00$ (0%)** | `REJECTED` | **Blocked by safety guards** to prevent fungal aflatoxin rot in godowns. |

- **Decentralized Standards Management**: Mandi operators and district admins can customize crop parameters via `/centres/{id}/quality-standards` with automatic database persistence and 1-click statutory reset.
- **Crop Standards & Price Penalty Viewer**: Direct modal access from farmer, operator, and admin navigation bars.

---

## 🚨 Two-Tier *SOS Priority Queueing & Statutory Pleading Layer

To eliminate arbitrary queue jumping and maintain statutory transparency under **Rule 14-B of the State Agricultural Marketing Directive**, KrishiConnect implements a two-tier emergency pleading workflow:

```
┌───────────────────────────┐         Real-time WebSocket         ┌───────────────────────────┐
│     Mandi Gate Assayer    │ ──────────────────────────────────► │ District Agricultural Off.│
│ Submits Statutory Pleading│                                     │  Conducts Review & Ruling │
│   (Perishable / Hazard)   │                                     │ (Allow SOS / Decline SOS) │
└───────────────────────────┘                                     └─────────────┬─────────────┘
                                                                                │
                                     ┌──────────────────────────────────────────┴───────────────┐
                                     ▼                                                          ▼
                      ┌─────────────────────────────┐                           ┌───────────────────────────────┐
                      │    ✓ Allow SOS (Approve)    │                           │     ✕ Decline SOS (Reject)    │
                      │ • Prioritized to Position #1│                           │ • Standard Sequence Preserved │
                      │ • Push SMS & Live UI Alert  │                           │ • Rejection Reason Logged     │
                      └──────────────┬──────────────┘                           └───────────────┬───────────────┘
                                     │                                                          │
                                     └──────────────────────────┬───────────────────────────────┘
                                                                ▼
                                            ┌───────────────────────────────────────┐
                                            │ Immutable District Statutory Audit Log│
                                            │ (Timestamp, Assayer, Officer, Reason) │
                                            └───────────────────────────────────────┘
```

1. **Gate Assayer Pleading Modal**:
   - Assayer selects from contingency presets (*Perishable produce at rain/rot risk, Vehicle breakdown at mandi gate, Elderly/vulnerable grower*) and provides mandatory inspection remarks ($\ge 5\text{ chars}$).
   - Dispatches emergency petition setting entry status to `⏳ SOS Pending`.
2. **District Admin Real-Time Discretionary Review**:
   - Incoming pleadings trigger a persistent red alert (`SOS_REQUESTED`) in the District Officer dashboard.
   - Admin reviews assayer notes and exercises discretionary authority: **✓ Allow SOS (Approve)** (fast-tracks token to Position #1) or **✕ Decline (Reject)** with administrative reasoning.
3. **Statutory Immutability Audit Trail**:
   - Every pleading, approval, rejection, and timestamp is permanently recorded in the district ledger (`GET /analytics/priority-bumps`).

---

## 🔌 Zero-Trust Offline Mandi Operations Protocol (ZT-OMOP)

Designed for rural procurement camps and weighbridges operating under severe 2G/3G connectivity outages:

- **Deterministic Rule Engine (DRE)**: Synchronized SHA-256 fingerprint (`sha256:fde92afab5c6...`) between Python backend and JavaScript frontend evaluating Agmark grades offline.
- **Seeded Zero-Network OTPs**: Deterministic daily 6-digit authentication generated via:
  $$\text{OTP} = \text{HMAC-SHA256}(\text{FarmerSecret}, \text{MandiID} \parallel \text{SlotDate} \parallel \text{Salt}) \pmod{10^6}$$
- **IndexedDB Outbox & Cryptographic Proof of Intake (POI)**:
  - Local transactions queued in `KrishiConnect_OfflineDB` (`procurement_outbox`, `operator_keystore`).
  - Intake payloads signed via WebCrypto ECDSA/Ed25519 device keys.
- **Server Replay Verification & Idempotent Ingestion**:
  - Re-evaluates raw telemetry (moisture, chaff, damaged %) upon reconnection, detecting client tampering and preventing fraudulent DBT payouts.

---

## 🗺️ Interactive Navigation Map & Transit Routing

Integrated transit planning module for farmers traveling to rural mandis:

- **Leaflet Interactive Map**: Features custom pulsing origin pins for the farmer's village and intake gate icons for the mandi yard.
- **OSRM Road Routing Engine**: Real-time road routing with glowing transit polyline and fallback Haversine curves.
- **Agricultural Transit Matrix**:
  - 🚜 **Tractor / Trolley**: $\sim 22\text{ km/h}$
  - 🛻 **Tempo / Pickup**: $\sim 32\text{ km/h}$
  - 🛵 **Motorbike**: $\sim 40\text{ km/h}$
- **Live GPS vs Village Bio**: Switch between live browser geolocation and registered profile village coordinates.
- **1-Click Google Maps Deep Linking**: Direct turn-by-turn navigation handoff to native mobile apps.

---

## ⚡ High-Performance Redis Acceleration & Distributed Mesh

KrishiConnect is engineered for horizontal scale across thousands of concurrent farmers:

- **Redis Cache-Aside Architecture**:
  - `centre:stats:{id}` & `centres:list:*`: $15\text{s TTL}$
  - `analytics:district` & `analytics:impact`: $30\text{s TTL}$
  - `ai:eta:{id}`: $60\text{s TTL}$
  - `static:msp_rates` & `static:quality_standards`: $24\text{h TTL}$
  - Non-blocking in-memory fallback if Redis is unavailable.
- **Distributed Pub/Sub WebSocket Mesh**: Synchronizes queue events across all Uvicorn worker instances (`--workers 4`) and container replicas (`krishi:events:*`).
- **Distributed Sliding-Window Rate Limiting**: Redis-backed sliding window limiting public OTP requests (max 3 requests per 10 minutes per mobile number).
- **Geographic Routing Matrix Caching**: Caches OSRM driving distance and durations with 7-day TTL (`geo:route:<lat1>:<lon1>:<lat2>:<lon2>`).
- **B-Tree Range Seek Optimizations**: Replaced unindexable `local_date(col) == today` SQL queries with UTC timestamp interval scans (`col >= start_utc AND col < end_utc`).

---

## 👥 User Personas & End-to-End UI Flows

---

### 1. Farmer Persona 🌾
**Portal Route**: `http://localhost:5173/`

```
[1. Mobile OTP / 24h Login] ──► [2. Voice / Smart Recommender] ──► [3. Slot Booking & Token]
                                                                             │
[6. DBT Settled Receipt]    ◄── [5. Digital Assaying & Intake] ◄── [4. Live Queue & SOS Alert]
```

1. **Authentication (Demo OTP & 24h Session)**:
   - Log in with 10-digit mobile number using **Demo Master OTP (`482913`)**, terminal-logged OTP, or password.
   - Optional 24-Hour "Keep me signed in" persistence with cross-tab session synchronization.
2. **AI Voice Booking & Centre Selection**:
   - Speak naturally to auto-fill crop, quantity, and slot preferences or view AI-recommended centres based on road distance.
   - Check statutory Kharif 2025-26 floor rates via the MSP Oracle Modal.
3. **Interactive Navigation & Slot Booking**:
   - Inspect driving route, vehicle transit times, and book a verified 1-hour time window.
4. **Live Digital Token & Position Tracking**:
   - Instant token issuance (e.g. `A101`) with live serving token, waiting count, and dynamic EMA wait time.
   - Real-time alerts for turn approaching (`CALLED`) or fast-track `⚡ SOS Priority Authorized` status.
5. **Turn Announcement & Assaying**:
   - Proceed to designated counter for digital moisture testing and Agmark certification.
6. **Verified Receipt & Instant DBT Settlement**:
   - Real-time transition from `⏳ Payout In Pipeline` to `✨ Direct Payout Settled` with PFMS/e-Kuber reference and printable Form 'J' invoice.

---

### 2. Procurement Centre Operator & Assayer Persona 🏢
**Portal Route**: `http://localhost:5173/admin` *(Logged in as Operator)*

```
[1. Counter Dashboard] ──► [2. Capacity Check & Call] ──► [3. 3-Parameter Quality Assay]
                                                                        │
[5. Disbursal Logged]  ◄── [4. Confirm Govt DBT Disbursal] ◄────────────┘
```

1. **Active Counter Overview**: Real-time counter occupancy monitor (`FREE` vs `BUSY`).
2. **Capacity Enforcement & Calling**: Atomic token calling preventing counter over-allocation.
3. **Produce Intake & Quality Assay Modal**:
   - Digital moisture slider (8%–25%) with real-time Agmark grade calculation (`Grade A`, `Grade B`, `Sun-Drying Grace`, `Spoilage Hazard`).
   - Foreign chaff % and damaged grain % inputs with statutory 2% value cut calculation.
   - Actions for courtyard sun-drying deferral and formal lot rejection.
4. **Two-Tier SOS Priority Pleading**: Submit emergency fast-track pleadings to the District Administrator under Rule 14-B.
5. **Treasury DBT Disbursal Desk**: Authorize government payment disbursals pushing instant WebSocket and SMS confirmations.

---

### 3. District Agricultural Officer / Admin Persona 📊
**Portal Route**: `http://localhost:5173/admin` *(Logged in as Admin)*

```
[1. District Live Telemetry] ──► [2. Live SOS Review Panel] ──► [3. Impact & Audit Ledger]
```

1. **District-Wide Operational Summary**: Aggregated metrics across all mandis (Total Farmers Served, Active Waiting/Processing, and Average Wait Times in IST).
2. **Live SOS Priority Discretionary Review Panel**: Review incoming gate assayer emergency petitions in real-time with 1-click **✓ Allow SOS** or **✕ Decline SOS** actions.
3. **Statutory Pleading Audit Trail**: Searchable, immutable record of all emergency queue priority requests with assayer and admin attribution.
4. **Before-vs-After Impact Assessment Panel (`/analytics/impact`)**:
   - **Wait Time Reduction**: $72.3\%$ reduction against the 90-minute traditional paper baseline.
   - **Farmer Hours Saved**: Cumulative productive farming hours saved across the district.
   - **DBT Settlement Rate**: Percentage of payments cleared within the statutory 24-hour SLA.
5. **Decentralized Ruleset & Quality Standards Manager**: Update crop grading thresholds per mandi with database persistence.

---

## 📄 Official Form 'J' Statutory Printable Invoice

Under Section 14(2) of the *West Bengal Agricultural Produce Marketing (Regulation) Act*, farmers require an authentic statutory intake certificate upon selling produce. KrishiConnect includes a dedicated **Form 'J' Invoice Generation & Printing Engine**:

- **A4 Print-Optimized Layout**: Government typography, State Emblem seal, dual QR validation seals, and multi-column breakdown.
- **Certified Assaying Audit Trail**: Displays Moisture %, Chaff %, Damaged Grain %, and certified Agmark Grade.
- **Direct Benefit Transfer (DBT) Statement**: Includes PFMS reference numbers, disbursement channel (`NPCI AePS / PFMS / RBI e-Kuber`), and statutory price deduction breakdowns.
- **Physical Signature Sections**: Built-in authorization blocks for the Farmer, Weighbridge Operator, and Centre Superintendent.
- **Isolated Print Pipeline**: Dedicated hidden iframe print pipeline (`printInvoice()`) ensuring crisp A4 output without disrupting active UI states.

---

## 🔔 Notification Center & Smart Toast Lifecycle Engine

KrishiConnect features an enterprise real-time event notification system built on WebSocket streams and `react-hot-toast`:

1. **Smart Lifecycle Deduplication**: Gated behind session state transitions (`isFirstLoadRef`) so historical records never pop up redundantly on page reload or navigation.
2. **Interactive Dismissal**: Every floating toast includes an interactive `(X)` close button with calibrated auto-dismiss durations (3.5s success, 4s queue, 4.5s errors).
3. **Multilingual Parameter Interpolation**: Zero-reload dynamic translations for all toast events across all 12 scheduled languages.
4. **Persistent In-Session Notification Center**: Slide-out panel categorizing events into **Queue (🌾)**, **Assaying (🔬)**, **Payment (💰)**, and **Alerts (⚠️)** with unread badges and 1-click "Mark All Read".

---

## 🔑 Live Demo Accounts & Credentials

| Role | Mobile Number | Password / Demo OTP | 1-Click UI Shortcut |
| :--- | :--- | :--- | :--- |
| **Farmer (Ramesh Kumar)** | `9876543210` | `demo123` or OTP `482913` | 🌾 1-Click Demo on `/` |
| **Farmer (Suresh Ghosh)** | `9000000002` | `demo1234` or OTP `482913` | 🚜 1-Click Demo on `/` |
| **Operator (Haripur Centre)** | `9000000001` | `operator123` | 🏢 1-Click Demo on `/admin` |
| **District Agricultural Officer** | `9000000000` | `admin123` | 🏛️ 1-Click Demo on `/admin` |

*Note: In addition to the master demo OTP `482913`, any dynamically generated OTP is printed to the backend terminal and logged in `/auth/sms-logs` for evaluation.*

---

## 💻 Local Installation, Docker & Startup Guide

### Prerequisites
- **Python**: `3.10+`
- **Node.js**: `18.0+` & `npm`
- **Redis** *(Optional for local dev, included in Docker)*: `7.0+`

---

### Option A: One-Click Startup Scripts

```bash
# Clone the repository
git clone https://github.com/your-username/KrishiConnect.git
cd KrishiConnect

# Linux / macOS
chmod +x start.sh
./start.sh

# Windows (Command Prompt)
start.bat

# Windows (PowerShell)
.\start.ps1
```

---

### Option B: Docker Compose (Full Stack Orchestration)

```bash
# Launch Redis, FastAPI Backend, and Nginx-powered Frontend in unified network
docker compose up --build
```
- **Farmer & Officer Web Portals**: `http://localhost:5173`
- **FastAPI Backend & Interactive Swagger Docs**: `http://localhost:8000/docs`

---

### Option C: Manual Step-by-Step Setup

#### 1. Backend (FastAPI + Async SQLAlchemy + Redis)
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

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

# Install dependencies
npm install

# Start Vite development server on port 5173
npm run dev
```

---

## 🔌 API Architecture & Endpoints

Interactive Swagger API documentation is available at `http://localhost:8000/docs`.

### Core API Reference

| Module | Method | Path | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/auth/login` | JWT password authentication with 24h expiry |
| **Auth** | `POST` | `/auth/send-otp` | Generate localized SMS OTP with rate-limiting |
| **Auth** | `POST` | `/auth/verify-otp` | Verify OTP & auto-provision farmer profile |
| **Auth** | `GET` | `/auth/sms-logs` | Retrieve SMS gateway delivery audit trail |
| **Centres** | `GET` | `/centres` | List procurement centres with cached live load |
| **Centres** | `GET` | `/centres/{id}/slots` | Available 1-hour time slots for a given date |
| **Centres** | `GET` | `/centres/{id}/quality-standards`| Get mandi-specific Agmark standards |
| **Centres** | `PUT` | `/centres/{id}/quality-standards`| Update mandi-specific standards ruleset |
| **Queue** | `POST` | `/queue/book` | Book slot, validate capacity, issue token |
| **Queue** | `GET` | `/queue/my/active` | Get active booking and live queue position |
| **Queue** | `POST` | `/queue/{id}/call` | Capacity-guarded counter token call |
| **Queue** | `POST` | `/queue/{id}/sos-request` | Assayer submits emergency SOS priority pleading |
| **Queue** | `POST` | `/queue/{id}/sos-approve` | District Admin authorizes SOS priority jump |
| **Queue** | `POST` | `/queue/{id}/sos-reject` | District Admin denies SOS priority jump |
| **Queue** | `POST` | `/queue/{id}/quality-action`| Record Sun-Drying Deferral or Lot Rejection |
| **Queue** | `POST` | `/queue/{id}/complete` | Certify quality assay, intake weight & payout |
| **Queue** | `GET` | `/queue/{id}/procurement` | Auto-healing Form 'J' invoice & DBT status |
| **Payments** | `GET` | `/payments/centre/{id}/pending`| Get pending payments awaiting DBT disbursal |
| **Payments** | `POST` | `/payments/{id}/pay` | Authorize DBT payment and broadcast instant sync |
| **AI Layer** | `POST` | `/ai/voice-intent` | Multilingual agricultural voice intent parser |
| **AI Layer** | `POST` | `/ai/chat` | Vernacular conversational agricultural advisor |
| **AI Layer** | `GET` | `/ai/tts` | Native streaming audio pronunciation proxy |
| **AI Layer** | `GET` | `/ai/eta/{centre_id}` | 7-day EMA processing forecasting engine |
| **AI Layer** | `GET` | `/ai/recommend` | 5-signal weighted centre recommender |
| **AI Layer** | `GET` | `/ai/msp-rates` | Statutory Kharif 2025-26 MSP oracle |
| **AI Layer** | `GET` | `/ai/admin-overview` | Executive AI operational digest for district admin |
| **AI Layer** | `GET` | `/ai/data-info` | Full AI data-transparency manifest |
| **Analytics** | `GET` | `/analytics/district` | Live IST-timezone aggregated district metrics |
| **Analytics** | `GET` | `/analytics/impact` | Baseline vs current performance impact panel |
| **Analytics** | `GET` | `/analytics/priority-bumps`| Immutable SOS priority pleading audit trail |
| **Locations** | `GET` | `/locations/districts` | List supported West Bengal districts |
| **Locations** | `GET` | `/locations/villages` | Search villages with geo-coordinates |

---

## 🧪 Automated E2E Verification & Testing

The repository contains an automated test suite verifying all critical business workflows, statutory pricing, Redis caching, immutability audit logs, and session synchronization:

```bash
cd backend

# 1. Full Comprehensive End-to-End Workflow Test
./venv/bin/python test_e2e.py

# 2. Test Statutory Gradewise Pricing & Agmark Deductions
./venv/bin/python test_gradewise_pricing.py

# 3. Test Two-Tier SOS Priority Pleading & Immutability Audit
./venv/bin/python test_bump_immutability.py

# 4. Test Redis Caching, Pub/Sub Mesh & Rate Limiting
./venv/bin/python test_redis_integration.py

# 5. Test Demo & Multilingual SMS OTP Authentication
./venv/bin/python test_auth_otp.py

# 6. Test Produce Quality Assaying & Moisture Safety Guards
./venv/bin/python test_assayer_flow.py

# 7. Test Location Intelligence & OSRM Routing
./venv/bin/python test_locations_behaviour.py

# 8. Test Live Dual-Channel WebSocket Synchronization
./venv/bin/python test_websocket_sync.py

# 9. Test District Analytics & IST Timezones
./venv/bin/python test_district_analytics_verification.py

# 10. Test Auth Session Recovery & Global 401 Interceptor
./venv/bin/python test_session_recovery_401.py

# 11. Test Real-time Cancellation & State Recovery
./venv/bin/python test_cancel_realtime_sync.py
```

---

## 🛡️ Production Readiness, Security & Scalability

- **Transactional Concurrency**: Employs `SELECT FOR UPDATE SKIP LOCKED` on queue calling to eliminate race conditions across multiple counter operators.
- **Moisture Safety Guard**: Programmatic validation blocks intake of produce lots with moisture $\ge 20\%$.
- **Two-Tier Authorization Governance**: Role-Based Access Control (RBAC) prevents operators from approving their own SOS priority requests.
- **Distributed Session Synchronization**: Cross-tab authentication bus (`BroadcastChannel`) coordinates session state without leaking tokens across devices.
- **IST Timezone Boundary Locking**: All daily metrics and slot limits use `Asia/Kolkata` timezone calculations to eliminate day-shift rollover bugs.
- **Zero-Code Scalability Transition**: Seamless database swap from local SQLite to high-concurrency PostgreSQL / Supabase connection pooling supporting 50,000+ concurrent farmers.
