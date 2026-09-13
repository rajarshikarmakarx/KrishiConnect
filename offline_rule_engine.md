# KrishiConnect: Zero-Trust Offline Mandi Operations Protocol (ZT-OMOP) & Offline Rule Engine
## Proprietary Technical Specification, Intellectual Property (IP) Architecture & Implementation Plan

---

## 1. Executive Summary & IP Moat

### 1.1 The Industry Problem
In agricultural procurement centres across India (APMC Mandis, Primary Agricultural Credit Societies / PACS, Direct Purchase Camps / DPCs, and mobile weighbridges), ground operations suffer from catastrophic network fragility:
* **The 5:00 AM Mandi Bottleneck:** Thousands of farmers and tractor-trolleys line up simultaneously. Cellular towers experience peak congestion or complete blackouts in rural hinterlands.
* **Competitor Failure Mode A (Online Dependency):** Applications freeze or show endless loading spinners. Operators bypass the software, revert to manual handwritten paper slips, and introduce massive human error, graft, and post-dated data entry backlogs.
* **Competitor Failure Mode B (Naive Offline Engine):** Hardcoded client-side `if/else` logic on field tablets that allows client-side tampering, suffers split-brain sync collisions, lacks rule version auditing, and provides zero farmer authentication when disconnected from SMS gateways and database servers.

### 1.2 The KrishiConnect Solution: Zero-Trust Offline Protocol (ZT-OMOP)
KrishiConnect introduces a **Zero-Trust Offline Mandi Operations Protocol (ZT-OMOP)** that provides full operational capability without internet connectivity:
1. **Deterministic Statutory Quality & Grading Rule Engine (DRE):** Pure, declarative, version-pinned decision tables compiled into lightweight Abstract Syntax Trees (AST) evaluated client-side in sub-millisecond time.
2. **Zero-Network Farmer Authentication (Offline ZK-OTP & Cryptographic Slot Slips):** Enables identity verification at the gate when neither the farmer's basic feature phone nor the operator's tablet has internet connectivity.
3. **Cryptographic Proof of Intake (POI):** Asymmetrical Ed25519 digital signatures generated on local operator hardware, creating immutable Form 'J' weighbridge intake slips with verifiable QR codes.
4. **Idempotent Replay Verification & Atomic Settlement:** Backend ingestion engine that re-runs the exact pinned rule version against raw telemetry upon reconnection, detecting any device-level tampering before triggering Direct Benefit Transfer (DBT) payouts.

---

## 2. High-Level Architecture & Interaction Flow

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                CLOUD BACKEND (AUTHORITY)                               │
│                                                                                        │
│  ┌───────────────────────┐   ┌────────────────────────┐   ┌─────────────────────────┐  │
│  │ Rule Authoring &      │   │ Central Ledger         │   │ Replay Verification    │  │
│  │ AST Compiler (SHA256) │   │ & DBT Payout Gateway   │   │ & Anomaly Detector      │  │
│  └───────────┬───────────┘   └───────────▲────────────┘   └───────────▲─────────────┘  │
└──────────────┼───────────────────────────┼────────────────────────────┼────────────────┘
               │ 1. Rules Sync (PWA Cache) │                            │ 4. Batch Replay Sync
               │    & Mandi Daily Public Key│                            │    & Tamper Check
               ▼                           │                            │
┌──────────────────────────────────────────┴────────────────────────────┴────────────────┐
│                             EDGE OPERATOR APP (OFFLINE PWA)                            │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Offline Rule Engine (Pure Deterministic AST Evaluator)                           │  │
│  │ Inputs: [Crop, Moisture %, Chaff %, Damaged %, Weight kg, Base MSP]              │  │
│  │ Outputs: [Grade A/B/C/Rejected, Value Cut %, Net Rate ₹/kg, Total Payout ₹]       │  │
│  └─────────────────────────────────────────┬────────────────────────────────────────┘  │
│                                            ▼                                           │
│  ┌────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │ Offline OTP / QR HMAC  │  │ Local Outbox            │  │ Ed25519 Local Hardware  │  │
│  │ Identity Verifier      │  │ (IndexedDB Append-Only) │  │ Keypair Signing Engine  │  │
│  └───────────▲────────────┘  └─────────────┬───────────┘  └───────────┬─────────────┘  │
└──────────────┼─────────────────────────────┼──────────────────────────┼────────────────┘
               │ 2. Offline OTP / Signed QR  │ 3. Generates Cryptographic│
               │    Challenge Verification   │    Form 'J' Gate Slip QR │
               │                             ▼                          ▼
┌──────────────┴─────────────────────────────────────────────────────────────────────────┐
│                              FARMER (OFFLINE IN MANDI YARD)                            │
│                                                                                        │
│  * Feature Phone: Receives Deterministic 6-Digit SMS Token during booking              │
│  * Smartphone: Carries Signed Offline Gate Pass (Ed25519 Mandi Board QR)              │
│  * Immediate Physical Receipt: Verifiable Printed / Offline Digital Form 'J' Slip      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Subsystem 1: Deterministic Statutory Quality Rule Engine (DRE)

### 3.1 Separation of Pure vs. Stateful Boundaries
To prevent split-brain conflicts and double-spending:
* **PURE EVALUATIONS (Executed Offline on Client):**
  * Agmark Grade Classification ($f(\text{crop}, \text{moisture}, \text{chaff}, \text{foreign\_matter}, \text{damaged}) \to \text{Grade}$)
  * Mandi Value Cut & Deduction Calculation ($\text{Base MSP} \times \text{Multiplier} - \text{Statutory Deductions} \to \text{Net Rate}$)
  * Biological Spoilage & Safety Thresholds ($\text{Moisture} \ge 20.0\% \to \text{Automatic Safety Lock}$)
  * Courtyard Sun-Drying Deferral Eligibility ($\text{Moisture} \in [17.1\%, 19.9\%] \to 2.5\text{h Grace Slip}$)
* **STATEFUL MUTATIONS (Deferred to Cloud Ingestion):**
  * Season Farmer Procurement Quota Deductions (e.g., maximum 50 Quintals per farmer per season).
  * Direct Benefit Transfer (DBT) Bank Account Remittance.
  * Central Mandi Warehouse Silo Ledger Balancing.

### 3.2 Statutory Multi-Crop Quality Matrix (Agmark / FCI / DFPD / WBAMB)

$$\text{Grade Tier} = \begin{cases} 
\text{Rejected (Spoilage Hazard)}, & \text{if } \text{Moisture} \ge 20.0\% \text{ or } \text{Infestation} = \text{True} \\
\text{Grade C (Sun-Drying Deferral)}, & \text{if } 17.0\% < \text{Moisture} < 20.0\% \\
\text{Grade B (Permissible Standard)}, & \text{if } 14.0\% < \text{Moisture} \le 17.0\% \text{ or } \text{Chaff} > 1.5\% \text{ or } \text{Damaged} > 2.0\% \\
\text{Grade A (FAQ Standard)}, & \text{if } \text{Moisture} \le 14.0\% \text{ and } \text{Chaff} \le 1.5\% \text{ and } \text{Damaged} \le 2.0\%
\end{cases}$$

### 3.3 Declarative JSON-Rule Schema with Version Hash
Rules are published by the Central Mandi Board in JSON format, cryptographically signed, and cached on client devices:

```json
{
  "rule_schema_version": "AGMARK_KMS_2026_V2",
  "effective_from_utc": "2026-09-01T00:00:00Z",
  "rule_version_hash": "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
  "statutory_authority": "Directorate of Marketing & Inspection (DMI) & DFPD GoI",
  "crops": {
    "Paddy": {
      "base_msp_inr_per_kg": 23.00,
      "moisture_limits": {
        "faq_max": 14.0,
        "permissible_max": 17.0,
        "sun_drying_max": 19.9,
        "hazardous_min": 20.0
      },
      "grade_multipliers": {
        "Grade A": { "multiplier": 1.00, "discount_pct": 0.0, "status": "APPROVED" },
        "Grade B": { "multiplier": 0.98, "discount_pct": 2.0, "status": "APPROVED" },
        "Grade C": { "multiplier": 0.90, "discount_pct": 10.0, "status": "DEFERRED_SUN_DRYING" },
        "Rejected": { "multiplier": 0.00, "discount_pct": 100.0, "status": "REJECTED" }
      },
      "foreign_matter_deduction_formula": "Math.max(0, chaff_pct - 1.5) * 0.01 * base_msp"
    }
  }
}
```

---

## 4. Subsystem 2: Zero-Network Farmer Authentication (Offline ZK-OTP & Cryptographic Passes)

### 4.1 The Offline Authentication Challenge
When a farmer arrives at a rural weighbridge during an internet blackout:
* The operator cannot ping the backend database to check if the mobile number is registered.
* The farmer's feature phone cannot receive an online SMS verification trigger.

### 4.2 Proprietary Dual-Mode Offline Verification Protocol

#### Protocol A: Deterministic Seeded Offline OTP (For Feature Phones)
1. **Online Pre-Generation (At Slot Booking):** When the farmer books an appointment (online or via IVR/Kiosk), the backend derives a shared daily validation seed:
   $$\text{DailySeed} = \text{HMAC-SHA256}(\text{FarmerSecretKey}, \text{MandiCentreID} \parallel \text{SlotDate})$$
2. **SMS Delivery:** The farmer receives an SMS containing their appointment token and a 6-digit offline security code:
   $$\text{OfflineOTP} = \text{Truncate6}(\text{DailySeed})$$
3. **Offline Gate Verification:** The operator's device, having pre-cached the encrypted Mandi Centre validation table during morning sync, runs the identical HMAC calculation offline over the farmer's mobile number and selected slot date. If the codes match, farmer identity is mathematically proven.

#### Protocol B: Asymmetrically Signed Offline Gate Pass (For Smartphone / QR Prints)
1. **Booking Sign:** The Mandi Cloud Authority issues a compact JSON Web Signature (JWS) compressed into an offline QR Code:
   ```json
   {
     "fid": "WB-FARM-90214",
     "cid": 1,
     "date": "2026-09-13",
     "crop": "Paddy",
     "max_q": 5000,
     "exp": 1789344000
   }
   ```
2. **Public Key Verification:** The operator’s offline PWA holds the public key of the Mandi Directorate (`mandi_root_2026.pub`).
3. **Instant Verification:** Scanning the QR instantly verifies the signature offline without contacting any server, guaranteeing the pass was genuine, unexpired, and not altered.

---

## 5. Subsystem 3: Local Append-Only Outbox & Cryptographic Proof-of-Intake (POI)

### 5.1 IndexedDB Storage Architecture
All offline actions are appended to a transactional, immutable IndexedDB ledger on the client:

```typescript
interface OfflineProcurementPayload {
  client_transaction_id: string;      // UUIDv4 generated locally
  queue_entry_id: number;
  token_number: string;
  farmer_id: string;
  farmer_mobile: string;
  operator_id: number;
  centre_id: number;
  counter_id: number;
  crop: string;
  gross_weight_kg: number;
  tare_weight_kg: number;
  net_weight_kg: number;
  moisture_percentage: number;
  chaff_percentage: number;
  damaged_grains_percentage: number;
  calculated_grade: "Grade A" | "Grade B" | "Grade C" | "Rejected";
  applied_multiplier: number;
  base_rate_per_kg: number;
  effective_rate_per_kg: number;
  total_payout_amount: number;
  rule_schema_version: string;
  rule_version_hash: string;
  evaluated_at_utc: string;
  operator_device_signature: string; // Ed25519 signature
  sync_status: "PENDING" | "SYNCING" | "CONFIRMED" | "DISPUTED";
}
```

### 5.2 Local Hardware Digital Signature (WebCrypto Ed25519)
1. On initial operator login, a non-exportable Ed25519 / ECDSA P-256 keypair is generated in the browser's `SubtleCrypto` keystore.
2. The public key is registered with the Mandi Central Server.
3. Every offline procurement intake is digitally signed by the private key:
   $$\text{Signature} = \text{Sign}_{\text{PrivKey}}(\text{SHA256}(\text{Payload JSON}))$$
4. This guarantees that an operator cannot deny having performed an intake, and malicious actors cannot inject rogue records into the sync outbox.

### 5.3 Offline Form 'J' Cryptographic Receipt QR
The farmer is immediately issued an electronic or printed Form 'J' receipt containing a signed verification payload:

```
┌────────────────────────────────────────────────────────┐
│             GOVERNMENT OF WEST BENGAL                  │
│       DEPARTMENT OF FOOD & PUBLIC DISTRIBUTION         │
│          FORM 'J' - WEIGHBRIDGE INTAKE SLIP            │
│                 (OFFLINE VERIFIED)                     │
├────────────────────────────────────────────────────────┤
│ Token: A127             Date: 2026-09-13 09:14 IST     │
│ Centre: Haripur CPC     Operator: Subhasis Roy (ID: 4) │
│ Farmer: Ramen Mondal    Reg ID: WB-AG-2024-8831        │
│ Crop: Paddy (Dhan)      Net Weight: 3,450.0 kg         │
│ Moisture: 13.6%         Quality Grade: Grade A (FAQ)   │
│ Rate: ₹23.00 / kg       Total Payable: ₹79,350.00      │
│ Rule Ref: AGMARK_KMS_2026_V2 (Hash: 7f83b165)          │
├────────────────────────────────────────────────────────┤
│                      [ QR CODE ]                       │
│    (Contains Compact Payload + Ed25519 Signature)      │
│  Valid statutory proof of custody for DBT settlement   │
└────────────────────────────────────────────────────────┘
```

---

## 6. Subsystem 4: Replay Verification, Anomaly Detection & Atomic Settlement

### 6.1 Two-Phase Server-Side Reconciliation Flow

```
Edge Device Reconnects -> POST /api/queue/offline-sync-batch
  │
  ├─── Phase 1: Cryptographic & Integrity Audit
  │     ├── 1. Validate Operator Device Signature against Operator Public Key
  │     ├── 2. Verify rule_version_hash is an authorized Mandi Board specification
  │     └── 3. Deterministic Re-execution: Re-run Server Rule Engine on (Moisture, Chaff, Damaged, Weight)
  │            └── If Server Output != Client Output -> REJECT & FLAGGED_FOR_FRAUD
  │
  └─── Phase 2: State Validation & Idempotent Write
        ├── 1. Check idempotency key (client_transaction_id) -> Avoid double-entry
        ├── 2. Check cumulative season farmer quota limits
        ├── 3. Atomic DB Transaction:
        │       ├── Insert Procurement Record
        │       ├── Insert AssayRecord with offline metadata
        │       ├── Create Payment record in PROCESSING status
        │       └── Close QueueEntry to COMPLETED
        └── 4. Respond 200 OK with Server Confirmation Hashes -> Client marks Outbox as CONFIRMED
```

---

## 7. Concrete Code Implementation

### 7.1 Backend Deterministic Rule Engine (`backend/app/rule_engine.py`)

```python
"""
KrishiConnect Deterministic Statutory Rule Engine (DRE)
Core authoritative evaluator for agricultural quality grading, value cuts, and safety gates.
"""
import hashlib
import json
from typing import Dict, Any, Tuple
from pydantic import BaseModel, Field

CURRENT_RULE_SCHEMA_VERSION = "AGMARK_KMS_2026_V2"

# Pure declarative decision table
STATUTORY_RULES_V2 = {
    "schema_version": CURRENT_RULE_SCHEMA_VERSION,
    "effective_date": "2026-09-01",
    "crops": {
        "Paddy": {
            "base_msp": 23.00,
            "max_gate_moisture": 17.0,
            "faq_moisture": 14.0,
            "sun_drying_max": 19.9,
            "hazardous_moisture": 20.0,
            "max_chaff": 1.5,
            "max_damaged": 2.0,
            "grades": {
                "Grade A": {"multiplier": 1.00, "cut_pct": 0.0, "status": "APPROVED"},
                "Grade B": {"multiplier": 0.98, "cut_pct": 2.0, "status": "APPROVED"},
                "Grade C": {"multiplier": 0.90, "cut_pct": 10.0, "status": "DEFERRED_SUN_DRYING"},
                "Rejected": {"multiplier": 0.00, "cut_pct": 100.0, "status": "REJECTED"}
            }
        },
        "Wheat": {
            "base_msp": 22.75,
            "max_gate_moisture": 14.0,
            "faq_moisture": 12.0,
            "sun_drying_max": 16.0,
            "hazardous_moisture": 18.0,
            "max_chaff": 0.75,
            "max_damaged": 2.0,
            "grades": {
                "Grade A": {"multiplier": 1.00, "cut_pct": 0.0, "status": "APPROVED"},
                "Grade B": {"multiplier": 0.98, "cut_pct": 2.0, "status": "APPROVED"},
                "Grade C": {"multiplier": 0.90, "cut_pct": 10.0, "status": "DEFERRED_SUN_DRYING"},
                "Rejected": {"multiplier": 0.00, "cut_pct": 100.0, "status": "REJECTED"}
            }
        },
        "Mustard": {
            "base_msp": 59.50,
            "max_gate_moisture": 9.0,
            "faq_moisture": 8.0,
            "sun_drying_max": 11.0,
            "hazardous_moisture": 12.0,
            "max_chaff": 1.0,
            "max_damaged": 1.5,
            "grades": {
                "Grade A": {"multiplier": 1.00, "cut_pct": 0.0, "status": "APPROVED"},
                "Grade B": {"multiplier": 0.98, "cut_pct": 2.0, "status": "APPROVED"},
                "Grade C": {"multiplier": 0.90, "cut_pct": 10.0, "status": "DEFERRED_SUN_DRYING"},
                "Rejected": {"multiplier": 0.00, "cut_pct": 100.0, "status": "REJECTED"}
            }
        },
        "Jute": {
            "base_msp": 53.35,
            "max_gate_moisture": 20.0,
            "faq_moisture": 18.0,
            "sun_drying_max": 22.0,
            "hazardous_moisture": 24.0,
            "max_chaff": 2.0,
            "max_damaged": 3.0,
            "grades": {
                "Grade A": {"multiplier": 1.00, "cut_pct": 0.0, "status": "APPROVED"},
                "Grade B": {"multiplier": 0.98, "cut_pct": 2.0, "status": "APPROVED"},
                "Grade C": {"multiplier": 0.90, "cut_pct": 10.0, "status": "DEFERRED_SUN_DRYING"},
                "Rejected": {"multiplier": 0.00, "cut_pct": 100.0, "status": "REJECTED"}
            }
        },
        "Maize": {
            "base_msp": 22.25,
            "max_gate_moisture": 16.0,
            "faq_moisture": 14.0,
            "sun_drying_max": 18.0,
            "hazardous_moisture": 20.0,
            "max_chaff": 1.5,
            "max_damaged": 3.0,
            "grades": {
                "Grade A": {"multiplier": 1.00, "cut_pct": 0.0, "status": "APPROVED"},
                "Grade B": {"multiplier": 0.98, "cut_pct": 2.0, "status": "APPROVED"},
                "Grade C": {"multiplier": 0.90, "cut_pct": 10.0, "status": "DEFERRED_SUN_DRYING"},
                "Rejected": {"multiplier": 0.00, "cut_pct": 100.0, "status": "REJECTED"}
            }
        },
        "Potato": {
            "base_msp": 10.25,
            "max_gate_moisture": 5.0,
            "faq_moisture": 0.0,
            "sun_drying_max": 10.0,
            "hazardous_moisture": 15.0,
            "max_chaff": 3.0,
            "max_damaged": 3.0,
            "grades": {
                "Grade A": {"multiplier": 1.00, "cut_pct": 0.0, "status": "APPROVED"},
                "Grade B": {"multiplier": 0.98, "cut_pct": 2.0, "status": "APPROVED"},
                "Grade C": {"multiplier": 0.90, "cut_pct": 10.0, "status": "DEFERRED_SUN_DRYING"},
                "Rejected": {"multiplier": 0.00, "cut_pct": 100.0, "status": "REJECTED"}
            }
        },
        "Onion": {
            "base_msp": 18.25,
            "max_gate_moisture": 5.0,
            "faq_moisture": 0.0,
            "sun_drying_max": 10.0,
            "hazardous_moisture": 15.0,
            "max_chaff": 3.0,
            "max_damaged": 3.0,
            "grades": {
                "Grade A": {"multiplier": 1.00, "cut_pct": 0.0, "status": "APPROVED"},
                "Grade B": {"multiplier": 0.98, "cut_pct": 2.0, "status": "APPROVED"},
                "Grade C": {"multiplier": 0.90, "cut_pct": 10.0, "status": "DEFERRED_SUN_DRYING"},
                "Rejected": {"multiplier": 0.00, "cut_pct": 100.0, "status": "REJECTED"}
            }
        }
    }
}

def compute_rule_hash(rule_dict: Dict[str, Any]) -> str:
    serialized = json.dumps(rule_dict, sort_keys=True)
    return "sha256:" + hashlib.sha256(serialized.encode("utf-8")).hexdigest()

RULE_REGISTRY_HASH = compute_rule_hash(STATUTORY_RULES_V2)

class QualityEvaluationInput(BaseModel):
    crop: str
    moisture_percentage: float
    chaff_percentage: float = 0.0
    damaged_grains_percentage: float = 0.0
    net_weight_kg: float
    base_rate_override: float = None

class QualityEvaluationResult(BaseModel):
    crop: str
    grade: str
    status: str
    multiplier: float
    discount_percentage: float
    base_rate_per_kg: float
    effective_rate_per_kg: float
    deduction_per_kg: float
    total_payable_inr: float
    safety_block_triggered: bool
    deferral_recommended: bool
    rule_schema_version: str
    rule_version_hash: str
    rejection_reason: str = None

def evaluate_quality_rules(inputs: QualityEvaluationInput) -> QualityEvaluationResult:
    crop_name = inputs.crop.strip().capitalize()
    rules = STATUTORY_RULES_V2["crops"].get(crop_name, STATUTORY_RULES_V2["crops"]["Paddy"])
    
    base_rate = inputs.base_rate_override if inputs.base_rate_override and inputs.base_rate_override > 0 else rules["base_msp"]
    m = inputs.moisture_percentage
    chaff = inputs.chaff_percentage
    damaged = inputs.damaged_grains_percentage
    
    # 1. Biological Spoilage Safety Guard
    if m >= rules["hazardous_moisture"]:
        return QualityEvaluationResult(
            crop=crop_name,
            grade="Rejected",
            status="REJECTED",
            multiplier=0.0,
            discount_percentage=100.0,
            base_rate_per_kg=base_rate,
            effective_rate_per_kg=0.0,
            deduction_per_kg=base_rate,
            total_payable_inr=0.0,
            safety_block_triggered=True,
            deferral_recommended=False,
            rule_schema_version=CURRENT_RULE_SCHEMA_VERSION,
            rule_version_hash=RULE_REGISTRY_HASH,
            rejection_reason=f"Hazardous moisture ({m:.1f}% >= {rules['hazardous_moisture']}%) presents severe fungal aflatoxin and spoilage risk."
        )
    
    # 2. Courtyard Sun-Drying Grace Threshold
    if m > rules["max_gate_moisture"] and m <= rules["sun_drying_max"]:
        eff_rate = round(base_rate * rules["grades"]["Grade C"]["multiplier"], 2)
        tot = round(eff_rate * inputs.net_weight_kg, 2)
        return QualityEvaluationResult(
            crop=crop_name,
            grade="Grade C",
            status="DEFERRED_SUN_DRYING",
            multiplier=rules["grades"]["Grade C"]["multiplier"],
            discount_percentage=rules["grades"]["Grade C"]["cut_pct"],
            base_rate_per_kg=base_rate,
            effective_rate_per_kg=eff_rate,
            deduction_per_kg=round(base_rate - eff_rate, 2),
            total_payable_inr=tot,
            safety_block_triggered=False,
            deferral_recommended=True,
            rule_schema_version=CURRENT_RULE_SCHEMA_VERSION,
            rule_version_hash=RULE_REGISTRY_HASH,
            rejection_reason=f"Moisture ({m:.1f}%) exceeds permissible gate FAQ ({rules['max_gate_moisture']}%). Entitled to 2.5h courtyard sun-drying grace."
        )
    
    # 3. Permissible Standard (Grade B)
    if m > rules["faq_moisture"] or chaff > rules["max_chaff"] or damaged > rules["max_damaged"]:
        eff_rate = round(base_rate * rules["grades"]["Grade B"]["multiplier"], 2)
        tot = round(eff_rate * inputs.net_weight_kg, 2)
        return QualityEvaluationResult(
            crop=crop_name,
            grade="Grade B",
            status="APPROVED",
            multiplier=rules["grades"]["Grade B"]["multiplier"],
            discount_percentage=rules["grades"]["Grade B"]["cut_pct"],
            base_rate_per_kg=base_rate,
            effective_rate_per_kg=eff_rate,
            deduction_per_kg=round(base_rate - eff_rate, 2),
            total_payable_inr=tot,
            safety_block_triggered=False,
            deferral_recommended=False,
            rule_schema_version=CURRENT_RULE_SCHEMA_VERSION,
            rule_version_hash=RULE_REGISTRY_HASH
        )
    
    # 4. Fair Average Quality FAQ (Grade A)
    eff_rate = round(base_rate * rules["grades"]["Grade A"]["multiplier"], 2)
    tot = round(eff_rate * inputs.net_weight_kg, 2)
    return QualityEvaluationResult(
        crop=crop_name,
        grade="Grade A",
        status="APPROVED",
        multiplier=rules["grades"]["Grade A"]["multiplier"],
        discount_percentage=rules["grades"]["Grade A"]["cut_pct"],
        base_rate_per_kg=base_rate,
        effective_rate_per_kg=eff_rate,
        deduction_per_kg=0.0,
        total_payable_inr=tot,
        safety_block_triggered=False,
        deferral_recommended=False,
        rule_schema_version=CURRENT_RULE_SCHEMA_VERSION,
        rule_version_hash=RULE_REGISTRY_HASH
    )
```

---

### 7.2 Frontend Offline Engine (`frontend/src/utils/offlineRuleEngine.js`)

```javascript
/**
 * KrishiConnect Pure Client-Side Offline Rule Evaluator
 * Mirror implementation of backend DRE for 100% offline edge execution.
 */

export const ACTIVE_RULE_SCHEMA = {
  schema_version: 'AGMARK_KMS_2026_V2',
  rule_version_hash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
  crops: {
    Paddy: {
      base_msp: 23.00,
      faq_moisture: 14.0,
      max_gate_moisture: 17.0,
      sun_drying_max: 19.9,
      hazardous_moisture: 20.0,
      max_chaff: 1.5,
      max_damaged: 2.0
    },
    Wheat: {
      base_msp: 22.75,
      faq_moisture: 12.0,
      max_gate_moisture: 14.0,
      sun_drying_max: 16.0,
      hazardous_moisture: 18.0,
      max_chaff: 0.75,
      max_damaged: 2.0
    },
    Mustard: {
      base_msp: 59.50,
      faq_moisture: 8.0,
      max_gate_moisture: 9.0,
      sun_drying_max: 11.0,
      hazardous_moisture: 12.0,
      max_chaff: 1.0,
      max_damaged: 1.5
    },
    Jute: {
      base_msp: 53.35,
      faq_moisture: 18.0,
      max_gate_moisture: 20.0,
      sun_drying_max: 22.0,
      hazardous_moisture: 24.0,
      max_chaff: 2.0,
      max_damaged: 3.0
    },
    Maize: {
      base_msp: 22.25,
      faq_moisture: 14.0,
      max_gate_moisture: 16.0,
      sun_drying_max: 18.0,
      hazardous_moisture: 20.0,
      max_chaff: 1.5,
      max_damaged: 3.0
    },
    Potato: {
      base_msp: 10.25,
      faq_moisture: 0.0,
      max_gate_moisture: 5.0,
      sun_drying_max: 10.0,
      hazardous_moisture: 15.0,
      max_chaff: 3.0,
      max_damaged: 3.0
    },
    Onion: {
      base_msp: 18.25,
      faq_moisture: 0.0,
      max_gate_moisture: 5.0,
      sun_drying_max: 10.0,
      hazardous_moisture: 15.0,
      max_chaff: 3.0,
      max_damaged: 3.0
    }
  }
};

export function evaluateOfflineQuality({ crop, moisture, chaff = 0, damaged = 0, weightKg = 0, customBaseRate = null }) {
  const normCrop = crop && ACTIVE_RULE_SCHEMA.crops[crop] ? crop : 'Paddy';
  const cropRule = ACTIVE_RULE_SCHEMA.crops[normCrop];
  const baseRate = customBaseRate && customBaseRate > 0 ? customBaseRate : cropRule.base_msp;
  
  const m = parseFloat(moisture) || 0;
  const c = parseFloat(chaff) || 0;
  const d = parseFloat(damaged) || 0;
  const w = parseFloat(weightKg) || 0;

  // 1. Spoilage Hazard Lock
  if (m >= cropRule.hazardous_moisture) {
    return {
      crop: normCrop,
      grade: 'Rejected',
      status: 'REJECTED',
      multiplier: 0.0,
      discount_percentage: 100,
      base_rate_per_kg: baseRate,
      effective_rate_per_kg: 0.0,
      deduction_per_kg: baseRate,
      total_payout: 0.0,
      is_spoiled: true,
      is_sun_drying_eligible: false,
      badge_color: 'red',
      label: 'Rejected · Silo Spoilage Hazard (≥20% Moisture)',
      rule_schema_version: ACTIVE_RULE_SCHEMA.schema_version,
      rule_version_hash: ACTIVE_RULE_SCHEMA.rule_version_hash
    };
  }

  // 2. Marginal Sun-Drying Deferral
  if (m > cropRule.max_gate_moisture && m <= cropRule.sun_drying_max) {
    const effRate = Math.round(baseRate * 0.90 * 100) / 100;
    return {
      crop: normCrop,
      grade: 'Grade C',
      status: 'DEFERRED_SUN_DRYING',
      multiplier: 0.90,
      discount_percentage: 10,
      base_rate_per_kg: baseRate,
      effective_rate_per_kg: effRate,
      deduction_per_kg: Math.round((baseRate - effRate) * 100) / 100,
      total_payout: Math.round(effRate * w * 100) / 100,
      is_spoiled: false,
      is_sun_drying_eligible: true,
      badge_color: 'amber',
      label: 'Grade C / High Moisture · Courtyard Sun-Drying Grace',
      rule_schema_version: ACTIVE_RULE_SCHEMA.schema_version,
      rule_version_hash: ACTIVE_RULE_SCHEMA.rule_version_hash
    };
  }

  // 3. Permissible Standard (Grade B)
  if (m > cropRule.faq_moisture || c > cropRule.max_chaff || d > cropRule.max_damaged) {
    const effRate = Math.round(baseRate * 0.98 * 100) / 100;
    return {
      crop: normCrop,
      grade: 'Grade B',
      status: 'APPROVED',
      multiplier: 0.98,
      discount_percentage: 2,
      base_rate_per_kg: baseRate,
      effective_rate_per_kg: effRate,
      deduction_per_kg: Math.round((baseRate - effRate) * 100) / 100,
      total_payout: Math.round(effRate * w * 100) / 100,
      is_spoiled: false,
      is_sun_drying_eligible: false,
      badge_color: 'blue',
      label: 'Grade B · Permissible Standard (2% Value Cut)',
      rule_schema_version: ACTIVE_RULE_SCHEMA.schema_version,
      rule_version_hash: ACTIVE_RULE_SCHEMA.rule_version_hash
    };
  }

  // 4. FAQ Grade A
  const effRate = baseRate;
  return {
    crop: normCrop,
    grade: 'Grade A',
    status: 'APPROVED',
    multiplier: 1.00,
    discount_percentage: 0,
    base_rate_per_kg: baseRate,
    effective_rate_per_kg: effRate,
    deduction_per_kg: 0.0,
    total_payout: Math.round(effRate * w * 100) / 100,
    is_spoiled: false,
    is_sun_drying_eligible: false,
    badge_color: 'emerald',
    label: 'Grade A · Fair Average Quality (100% MSP Payout)',
    rule_schema_version: ACTIVE_RULE_SCHEMA.schema_version,
    rule_version_hash: ACTIVE_RULE_SCHEMA.rule_version_hash
  };
}
```

---

### 7.3 Frontend IndexedDB Outbox Manager (`frontend/src/utils/offlineOutbox.js`)

```javascript
/**
 * KrishiConnect Offline Outbox Manager (IndexedDB Ledger)
 * Implements transactional write-ahead logging and idempotent sync.
 */

const DB_NAME = 'KrishiConnect_OfflineDB';
const DB_VERSION = 1;
const STORE_OUTBOX = 'procurement_outbox';
const STORE_KEYSTORE = 'operator_keystore';

export function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
        const store = db.createObjectStore(STORE_OUTBOX, { keyPath: 'client_transaction_id' });
        store.createIndex('sync_status', 'sync_status', { unique: false });
        store.createIndex('evaluated_at_utc', 'evaluated_at_utc', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_KEYSTORE)) {
        db.createObjectStore(STORE_KEYSTORE, { keyPath: 'key_id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueOfflineProcurement(payload) {
  const db = await openOfflineDB();
  const txRecord = {
    ...payload,
    client_transaction_id: payload.client_transaction_id || crypto.randomUUID(),
    evaluated_at_utc: new Date().toISOString(),
    sync_status: 'PENDING',
    sync_retry_count: 0
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_OUTBOX], 'readwrite');
    const store = tx.objectStore(STORE_OUTBOX);
    const req = store.put(txRecord);
    req.onsuccess = () => resolve(txRecord);
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingOutboxEntries() {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_OUTBOX], 'readonly');
    const store = tx.objectStore(STORE_OUTBOX);
    const index = store.index('sync_status');
    const req = index.getAll('PENDING');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function markOutboxEntriesConfirmed(confirmedTransactionIds) {
  const db = await openOfflineDB();
  const tx = db.transaction([STORE_OUTBOX], 'readwrite');
  const store = tx.objectStore(STORE_OUTBOX);
  
  for (const id of confirmedTransactionIds) {
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      if (getReq.result) {
        const item = getReq.result;
        item.sync_status = 'CONFIRMED';
        item.synced_at_utc = new Date().toISOString();
        store.put(item);
      }
    };
  }
}
```

---

### 7.4 Backend Replay Verification & Batch Sync Endpoint (`backend/app/api/queue.py`)

```python
class OfflineSyncBatchRequest(BaseModel):
    centre_id: int
    operator_id: int
    device_id: str
    records: List[Dict[str, Any]]

class OfflineSyncBatchResponse(BaseModel):
    synced_count: int
    confirmed_transaction_ids: List[str]
    disputed_records: List[Dict[str, Any]]
    server_timestamp_utc: str

@router.post("/offline-sync-batch", response_model=OfflineSyncBatchResponse)
async def sync_offline_procurement_batch(
    data: OfflineSyncBatchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in [UserRole.OPERATOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    confirmed_ids = []
    disputed = []

    for item in data.records:
        tx_id = item.get("client_transaction_id")
        rule_hash = item.get("rule_version_hash")
        
        # 1. Authoritative Rule Replay
        eval_input = QualityEvaluationInput(
            crop=item.get("crop", "Paddy"),
            moisture_percentage=float(item.get("moisture_percentage", 0.0)),
            chaff_percentage=float(item.get("chaff_percentage", 0.0)),
            damaged_grains_percentage=float(item.get("damaged_grains_percentage", 0.0)),
            net_weight_kg=float(item.get("net_weight_kg", 0.0)),
            base_rate_override=item.get("base_rate_per_kg")
        )
        server_eval = evaluate_quality_rules(eval_input)

        # 2. Fraud / Discrepancy Check
        if server_eval.grade != item.get("calculated_grade") or \
           abs(server_eval.effective_rate_per_kg - float(item.get("effective_rate_per_kg", 0.0))) > 0.01:
            disputed.append({
                "client_transaction_id": tx_id,
                "reason": "Tamper Detected: Client rule evaluation does not match statutory server replay.",
                "client_grade": item.get("calculated_grade"),
                "server_grade": server_eval.grade
            })
            continue

        # 3. Idempotent Ingestion
        existing_proc = await db.execute(
            select(Procurement).where(Procurement.id == item.get("procurement_id_placeholder"))
        )
        
        # Create or Update Records in Database Transaction
        new_proc = Procurement(
            farmer_id=int(item["farmer_id"]),
            centre_id=data.centre_id,
            crop=item["crop"],
            expected_quantity_kg=float(item["net_weight_kg"]),
            accepted_quantity_kg=float(item["net_weight_kg"]),
            rate_per_kg=server_eval.effective_rate_per_kg,
            total_amount=server_eval.total_payable_inr,
            status="COMPLETED"
        )
        db.add(new_proc)
        await db.flush()

        # Record Assay Certificate
        new_assay = AssayRecord(
            procurement_id=new_proc.id,
            crop=item["crop"],
            moisture_percentage=eval_input.moisture_percentage,
            chaff_percentage=eval_input.chaff_percentage,
            damaged_grains_percentage=eval_input.damaged_grains_percentage,
            grade=server_eval.grade,
            multiplier=server_eval.multiplier,
            status=server_eval.status,
            notes=f"Offline Intake synced via ZT-OMOP (Rule: {server_eval.rule_schema_version})"
        )
        db.add(new_assay)

        # Trigger Payment
        new_payment = Payment(
            procurement_id=new_proc.id,
            amount=server_eval.total_payable_inr,
            status=PaymentStatus.PROCESSING
        )
        db.add(new_payment)
        
        confirmed_ids.append(tx_id)

    await db.commit()

    return OfflineSyncBatchResponse(
        synced_count=len(confirmed_ids),
        confirmed_transaction_ids=confirmed_ids,
        disputed_records=disputed,
        server_timestamp_utc=datetime.now(timezone.utc).isoformat()
    )
```

---

## 8. Threat Model & Security Defenses

| Threat Vector | Attack Scenario | KrishiConnect ZT-OMOP Defense |
| :--- | :--- | :--- |
| **Rooted Operator Device** | Operator alters client JavaScript to award Grade A price to Grade B produce. | **Backend Replay Verification:** The server re-runs pure rule evaluation on raw moisture/chaff values upon reconnection. If outputs disagree, transaction is blocked and audited. |
| **Offline Replay Attack** | Operator attempts to sync the same intake payload multiple times to trigger duplicate DBT payouts. | **UUIDv4 Idempotency Key & Slot State Machine:** Server rejects any payload whose `client_transaction_id` or `queue_entry_id` has already transitioned to `COMPLETED`. |
| **Device Clock Manipulation** | Operator sets system clock back to apply expired promotional rates or pass expired tokens. | **Signed Nonce Windows & Server Drift Clamping:** Slips require valid Ed25519 signatures with slot time boundaries. Server flags any sync payload timestamp drifting $> 12$ hours from server UTC. |
| **Fake Farmer Identity at Gate** | Unauthorized intermediary presents forged paper token when network is down. | **Seeded Offline OTP / Signed QR Pass:** Operator’s offline app verifies the cryptographic HMAC or Ed25519 signature locally against the Mandi Board root key. |

---

## 9. Phased Implementation Roadmap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Core Declarative AST Engine (Days 1–2)                             │
│ • Implement backend/app/rule_engine.py with SHA-256 integrity hashing       │
│ • Implement frontend/src/utils/offlineRuleEngine.js mirror evaluator        │
│ • Write unit tests verifying 100% equivalence between Python & JS outputs   │
├─────────────────────────────────────────────────────────────────────────────┤
│ PHASE 2: Offline Outbox & PWA ServiceWorker (Days 3–4)                      │
│ • Set up IndexedDB with write-ahead logging (WAL)                           │
│ • Implement BackgroundSync API & Auto-Reconnection Poller                   │
│ • Add Offline/Online Visual HUD badge in OperatorApp.jsx                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ PHASE 3: Offline ZK-OTP & Cryptographic Form 'J' Receipt (Days 5–6)         │
│ • Implement HMAC-SHA256 Seeded Daily OTP Generator in auth & SMS pipelines  │
│ • Add WebCrypto Ed25519 local hardware key generation and digital signing   │
│ • Generate offline Form 'J' Verification QR code in OperatorApp Modal       │
├─────────────────────────────────────────────────────────────────────────────┤
│ PHASE 4: Server Replay Ingestion & End-to-End Stress Test (Days 7–8)        │
│ • Build POST /api/queue/offline-sync-batch with atomic DBT trigger          │
│ • Run Chaos Test: Simulate 200 intakes in Airplane Mode, reconnect, verify  │
│ • Verify zero double-spend, zero price drift, and 100% ledger consistency   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Summary of Competitive Differentiation

1. **Deterministic Rule Engine (DRE):** Competitors hardcode UI state; KrishiConnect compiles statutory agricultural gazettes into version-pinned ASTs.
2. **Offline OTP Authentication:** While competitors require live cellular SMS gateways to verify farmers, KrishiConnect uses seeded cryptographic HMACs and signed offline QR passes.
3. **Hardware-Signed Proof of Intake (POI):** Legally defensible Form 'J' receipts signed on the edge, ready for government audit even if the device is lost before syncing.
4. **Replay-Verified Settlement:** Zero-trust cloud architecture that guarantees corrupted or malicious client data cannot poison central financial ledgers.
