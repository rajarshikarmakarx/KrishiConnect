# KrishiFlow — Product Requirements Document (PRD)

## 1. Product Overview

**Product Name:** KrishiFlow

**Tagline:** Smart Procurement & Queue Management for Farmers

KrishiFlow is a digital platform designed to reduce waiting times, congestion, uncertainty, and lack of transparency at agricultural procurement centres.

Farmers can register, choose a procurement centre, book a procurement slot, receive a queue token, monitor their live queue position, receive notifications when their turn approaches, track procurement progress, and monitor payment status.

Procurement-centre operators get a real-time dashboard to manage farmers, queues, counters, procurement, and payments.

The application should feel like a **real government/public-infrastructure product**, not a generic startup dashboard.

---

# 2. Problem

Farmers often face:

* Long waiting times at procurement centres
* Physical congestion
* No reliable information about queue status
* Uncertainty regarding when they should arrive
* Difficulty tracking procurement status
* Difficulty tracking payment status
* Lack of visibility into centre workload
* Poor coordination between farmers and procurement-centre staff

KrishiFlow solves this by digitising the complete procurement journey:

```text
Farmer Registration
        ↓
Centre Selection
        ↓
Slot Booking
        ↓
Queue Token
        ↓
Live Queue Tracking
        ↓
Procurement
        ↓
Payment
```

---

# 3. Primary Users

## 3.1 Farmer

A farmer should be able to:

* Register/login
* View nearby procurement centres
* Compare centre queues
* Select a procurement centre
* View available slots
* Book a slot
* Receive a queue token
* View current queue position
* View estimated waiting time
* Receive turn notifications
* Track procurement status
* Track payment status
* View booking/procurement history

---

## 3.2 Procurement Centre Operator

The operator should be able to:

* Login
* View centre dashboard
* View current queue
* View waiting farmers
* Call the next farmer
* Assign a farmer to a counter
* Start procurement
* Complete procurement
* Cancel/skip a queue entry
* Record quantity procured
* Record procurement rate
* Update payment status
* View daily statistics

---

## 3.3 District/Admin User

For the prototype, provide an admin dashboard capable of:

* Viewing multiple procurement centres
* Comparing centre workloads
* Viewing total farmers served
* Viewing waiting farmers
* Viewing average waiting time
* Viewing procurement volume
* Viewing payment statistics

---

# 4. Core Features

## 4.1 Farmer Registration

Farmer registration fields:

* Full name
* Mobile number
* Village
* District
* Optional farmer ID
* Password/authentication

Do not collect unnecessary personal information.

---

# 5. Procurement Centre Discovery

Farmers should see a map/list of procurement centres.

Each centre card should show:

* Centre name
* Location
* Distance
* Current waiting count
* Number of active counters
* Estimated waiting time
* Current status
* Available slots

Example:

```text
Haripur Procurement Centre

🟢 Open

👥 12 farmers waiting
🏢 3 counters active
⏱️ Estimated wait: 28 min

[ View Centre ]
```

The farmer should be able to compare centres.

---

# 6. Smart Centre Recommendation

Provide a simple recommendation system.

The recommendation should consider:

* Distance
* Queue length
* Number of active counters
* Estimated waiting time
* Centre availability

Example:

```text
Recommended Centre

Haripur Procurement Centre
12 waiting
28 min estimated wait
4.2 km away

Why?
✓ Shorter queue
✓ More active counters
✓ Lower estimated wait

[ Select Centre ]
```

This does NOT require machine learning.

A deterministic scoring/ranking system is sufficient for the MVP.

---

# 7. Slot Booking

Farmer selects:

* Procurement centre
* Date
* Time slot
* Crop
* Expected quantity

Example:

```text
Select Slot

10:00 AM – 11:00 AM
18 slots available

11:00 AM – 12:00 PM
7 slots available

12:00 PM – 1:00 PM
FULL
```

After successful booking, generate a unique queue token.

Example:

```text
TOKEN

A127

Haripur Procurement Centre
10:00 AM – 11:00 AM
```

---

# 8. Queue System

The queue is the core feature of KrishiFlow.

Queue states:

```text
WAITING
CALLED
PROCESSING
COMPLETED
CANCELLED
```

State flow:

```text
BOOKED
   ↓
WAITING
   ↓
CALLED
   ↓
PROCESSING
   ↓
COMPLETED
```

Cancellation may occur from:

```text
WAITING → CANCELLED
CALLED → CANCELLED
```

---

# 9. Real-Time Queue Management

The queue must update in real time.

Use:

**PostgreSQL/Supabase as the source of truth.**

Use:

**Supabase Realtime for live updates.**

The frontend must NOT continuously poll the backend every few seconds.

Architecture:

```text
                 PostgreSQL
                     │
                     │ database change
                     ▼
             Supabase Realtime
                     │
              ┌──────┴──────┐
              ▼             ▼
          Farmer UI      Operator UI
```

When an operator changes queue status:

```text
A121 → COMPLETED
```

all relevant connected clients should receive the update automatically.

The UI should update without a browser refresh.

---

# 10. Realtime Implementation Pattern

Realtime events should be treated as a trigger that the queue has changed.

Recommended flow:

```text
Operator clicks COMPLETE
        ↓
FastAPI validates operation
        ↓
PostgreSQL transaction
        ↓
Queue status changes
        ↓
Supabase Realtime emits event
        ↓
React receives event
        ↓
React fetches latest queue state
        ↓
Queue position/ETA recalculated
        ↓
UI updates
```

Do NOT make the frontend the source of truth.

---

# 11. Queue Position

For every farmer, display:

* Their token
* Current token
* Number of people ahead
* Estimated waiting time

Example:

```text
Your Token

A127

Currently Serving

A122

👥 4 farmers ahead

⏱️ Estimated wait

~28 minutes

🟢 LIVE
```

Queue position should be derived from the current database state.

Do not permanently store queue position as the primary source of truth.

---

# 12. Estimated Waiting Time

For MVP, use:

```text
ETA ≈
people ahead × average processing time
÷ active counters
```

Example:

```text
8 people ahead
7 min average processing time
2 active counters

ETA ≈ 28 minutes
```

The system should dynamically update ETA as the queue changes.

Later this can be replaced with a predictive model, but ML is NOT required for the MVP.

---

# 13. Operator Dashboard

The operator dashboard is one of the most important screens.

Display:

```text
PROCUREMENT CENTRE
Haripur Centre

Waiting       17
Processing     3
Completed     84
Cancelled      2
```

Queue:

```text
TOKEN    FARMER       STATUS       COUNTER

A121     Farmer 1     PROCESSING   Counter 1
A122     Farmer 2     PROCESSING   Counter 2
A123     Farmer 3     WAITING      —
A124     Farmer 4     WAITING      —
A125     Farmer 5     WAITING      —
```

Actions:

```text
[ CALL NEXT ]

[ START PROCESSING ]

[ COMPLETE ]

[ CANCEL ]
```

---

# 14. Call Next

When the operator clicks:

```text
CALL NEXT
```

the backend must:

1. Find the earliest eligible WAITING queue entry
2. Lock it transactionally
3. Change its status to CALLED
4. Assign an available counter if applicable
5. Commit the transaction
6. Trigger realtime update

Use PostgreSQL transactions/row locking to prevent two operators from selecting the same farmer simultaneously.

Conceptually:

```sql
SELECT ...
FROM queue_entries
WHERE status = 'WAITING'
ORDER BY created_at
LIMIT 1
FOR UPDATE SKIP LOCKED;
```

Do not implement queue allocation entirely in frontend JavaScript.

---

# 15. Multiple Counters

A procurement centre can have multiple counters.

Example:

```text
Counter 1 → A121
Counter 2 → A122
Counter 3 → A123
```

The dashboard should show the current farmer at each counter.

Example:

```text
COUNTER 1
A121
Processing

COUNTER 2
A122
Processing

COUNTER 3
A123
Processing
```

---

# 16. Farmer Notifications

When the farmer approaches their turn, show an in-app notification.

Example:

```text
🔔 Your turn is approaching

Token A127

Only 2 farmers are ahead of you.

Please prepare to proceed to the procurement counter.
```

When called:

```text
🔔 Your turn!

Token A127

Please proceed to Counter 2.
```

For the MVP, in-app notifications/toasts are sufficient.

SMS integration can be added later.

---

# 17. Procurement Workflow

Once a farmer reaches the counter:

```text
CALLED
   ↓
PROCESSING
   ↓
COMPLETED
```

The operator records:

* Crop
* Expected quantity
* Accepted quantity
* Procurement rate
* Total amount

Example:

```text
Procurement

Crop: Paddy

Expected:
250 kg

Accepted:
242 kg

Rate:
₹23/kg

Total:
₹5,566
```

---

# 18. Payment Tracking

After procurement completion:

```text
Payment Status

₹5,566

⏳ Processing
```

Then:

```text
Payment Status

₹5,566

✅ Paid
```

For the prototype, payment can be simulated.

Do not integrate real banking/payment infrastructure unless specifically required.

---

# 19. Farmer History

Farmer dashboard should include:

```text
My Procurement History

31 Aug 2026
Haripur Centre
Paddy
242 kg
₹5,566
✅ Paid

25 Aug 2026
Bagnan Centre
Paddy
180 kg
₹4,140
✅ Paid
```

---

# 20. Admin Analytics

Provide a dashboard with:

### Today's Overview

```text
Farmers served       126
Currently waiting     17
Processing             3
Average wait          24 min
Total quantity      4.2 tons
Total procurement ₹96,400
```

Charts:

* Farmers served by hour
* Average waiting time
* Procurement quantity by crop
* Centre workload
* Payment status
* Queue length over time

Keep charts simple and readable.

---

# 21. Map

Include a map/list view showing procurement centres.

Each centre marker/card should display:

```text
Haripur Centre
12 waiting
28 min wait
```

The map is primarily for discovery and comparison.

---

# 22. User Experience

The interface should be:

* Clean
* Modern
* Mobile-first for farmers
* Dashboard-oriented for operators
* Accessible
* Simple enough for users with limited technical literacy

Use clear language.

Avoid overly technical terminology.

The farmer interface should prioritize:

```text
Where do I go?
When should I go?
What's my token?
How many people are ahead?
When will I be called?
Has my procurement happened?
Have I been paid?
```

---

# 23. Design Direction

Visual style:

**Government/public-service + modern fintech dashboard.**

Do NOT make it look like:

* A generic SaaS template
* A cryptocurrency dashboard
* A futuristic AI dashboard
* A dark-mode developer tool

Use:

* Clean cards
* Large readable numbers
* Clear status indicators
* Strong typography
* Simple icons
* High contrast
* Mobile-friendly layouts

Primary UI should feel trustworthy and practical.

---

# 24. Important Farmer Screen

The most important farmer screen is the live queue screen.

It should prominently display:

```text
HARIPUR PROCUREMENT CENTRE

🟢 LIVE QUEUE

YOUR TOKEN
A127

CURRENTLY SERVING
A122

4 PEOPLE AHEAD

ESTIMATED WAIT
~28 MINUTES

━━━━━━━━━━━━━━━━━━

A123   Waiting
A124   Waiting
A125   Waiting
A126   Waiting
A127   YOU

━━━━━━━━━━━━━━━━━━

🟢 Queue updates automatically
```

The user should never need to refresh manually.

---

# 25. Important Operator Screen

The operator should have:

```text
HARIPUR PROCUREMENT CENTRE

17 WAITING
3 PROCESSING
84 COMPLETED

CURRENTLY SERVING

Counter 1
A121
[ Complete ]

Counter 2
A122
[ Complete ]

Counter 3
A123
[ Complete ]

NEXT IN QUEUE

A124
A125
A126
A127

[ CALL NEXT ]
```

---

# 26. Backend API

Use FastAPI.

Suggested endpoints:

```text
POST   /auth/register
POST   /auth/login

GET    /centres
GET    /centres/{centre_id}

GET    /centres/{centre_id}/slots

POST   /queue/book

GET    /queue/{centre_id}

GET    /queue/my

POST   /queue/{queue_id}/cancel

POST   /queue/{queue_id}/call

POST   /queue/{queue_id}/start

POST   /queue/{queue_id}/complete

GET    /procurement/{id}

GET    /payments/{id}

GET    /analytics/centre/{centre_id}
GET    /analytics/district
```

Use REST for commands/data retrieval.

Use Supabase Realtime for live queue changes.

---

# 27. Database Tables

Minimum schema:

```text
users
farmers
procurement_centres
centre_counters
slots
queue_entries
procurements
payments
notifications
```

Suggested relationships:

```text
farmer
   │
   └── queue_entries
             │
             ├── procurement
             │
             └── payment

procurement_centre
   │
   ├── slots
   ├── counters
   └── queue_entries
```

---

# 28. Data Integrity

Important rules:

* A farmer cannot have two active queue entries for the same centre/date.
* A completed queue entry cannot return to WAITING.
* Only authorized operators can change queue status.
* Farmers can only cancel their own bookings.
* Operators can only manage queues for their assigned centre.
* Queue token generation must happen server-side.
* Queue allocation must use database transactions.
* Database is always the source of truth.

---

# 29. Realtime Failure Handling

The application must remain usable if realtime temporarily disconnects.

When the frontend reconnects:

```text
Reconnect
   ↓
Fetch latest queue
   ↓
Recalculate position
   ↓
Update UI
```

Display connection state:

```text
🟢 Live
```

or:

```text
🟡 Reconnecting...
```

Never permanently rely on a websocket/realtime event to maintain application state.

---

# 30. Demo Data

Create realistic seed/demo data.

Example:

### Centres

```text
Haripur Procurement Centre
Bagnan Procurement Centre
Uluberia Procurement Centre
Amta Procurement Centre
```

### Farmers

At least 30–50 demo farmers.

### Queue

Populate one centre with:

```text
1 processing
10–20 waiting
5 completed
```

This allows the realtime functionality to be demonstrated immediately.

---

# 31. Hackathon Demo Flow

The application should support this complete demonstration:

### Step 1

Farmer logs in.

### Step 2

Farmer sees nearby procurement centres.

### Step 3

Farmer chooses the recommended centre.

### Step 4

Farmer books a slot.

### Step 5

System generates:

```text
Token A127
```

### Step 6

Farmer opens live queue screen:

```text
6 people ahead
~42 minutes
🟢 LIVE
```

### Step 7

Operator opens the dashboard.

### Step 8

Operator clicks:

```text
COMPLETE A121
```

### Step 9

Without refreshing, farmer's screen changes:

```text
Current token: A122
5 people ahead
~35 minutes
```

### Step 10

Operator clicks:

```text
CALL NEXT
```

### Step 11

Farmer receives:

```text
🔔 Your turn is approaching
```

### Step 12

Operator starts procurement.

### Step 13

Operator completes procurement.

### Step 14

Farmer sees:

```text
Procurement Completed
₹5,566
Payment Processing
```

### Step 15

Payment changes to:

```text
✅ Payment Paid
```

This entire flow should work smoothly during a live hackathon demonstration.

---

# 32. Technical Constraints

For the MVP:

### Required

* React
* FastAPI
* PostgreSQL/Supabase
* Supabase Realtime
* Authentication
* Responsive UI

### Optional

* Maps
* SMS
* Push notifications
* Advanced analytics
* Predictive ETA

### NOT required

* Deep learning
* NLP
* Computer vision
* Blockchain
* Complex AI models
* Kafka
* Redis
* Microservices
* Custom WebSocket infrastructure

Prioritize reliability and polish over unnecessary technical complexity.

---

# 33. Development Priority

Build in this order:

### P0 — Must Work

1. Authentication
2. Farmer registration
3. Centre listing
4. Slot booking
5. Token generation
6. Queue database
7. Operator dashboard
8. Call next
9. Start processing
10. Complete procurement
11. Payment status

### P1 — Critical Differentiator

12. Supabase Realtime
13. Live farmer queue
14. Live operator queue
15. ETA calculation
16. Multiple counters
17. Notifications

### P2 — Competitive Features

18. Centre recommendation
19. Map
20. Analytics
21. Queue history
22. Centre comparison

### P3 — Nice-to-have

23. SMS
24. Push notifications
25. Advanced ETA prediction
26. Advanced analytics

Do NOT sacrifice P0/P1 functionality to implement P2/P3 features.

---

# 34. Code Quality Requirements

* Use modular components.
* Keep API/business logic separate from UI.
* Use environment variables for secrets.
* Never hardcode API keys.
* Use proper database constraints.
* Use transactions for queue allocation.
* Validate all backend input.
* Handle loading/error/empty states.
* Use meaningful names.
* Avoid unnecessary abstractions.
* Keep the MVP understandable to a student development team.

---

# 35. Final Product Principle

KrishiFlow should answer four questions for a farmer:

> **Where should I go?**

> **When should I go?**

> **How long will I have to wait?**

> **When will I receive my payment?**

The product's strongest differentiator is **real-time transparency throughout the procurement journey**.

The core experience must therefore be:

```text
BOOK
 ↓
TOKEN
 ↓
LIVE QUEUE
 ↓
CALL
 ↓
PROCUREMENT
 ↓
PAYMENT
```

Build this flow extremely well before adding extra features.
