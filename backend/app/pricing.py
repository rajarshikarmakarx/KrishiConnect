"""
KrishiConnect Automatic Gradewise Pricing Module
Implements statutory quality assaying price determination based on:
- Directorate of Marketing & Inspection (DMI), Ministry of Agriculture & Farmers Welfare, GoI
- Food Corporation of India (FCI) Mandi Procurement Value Cut Schedules
- West Bengal Agricultural Produce Marketing (Regulation) Act & WBAMB Norms
- Commission for Agricultural Costs and Prices (CACP) Kharif 2025-26 Gazette
"""
from typing import Dict, Any, Optional

# Statutory Base MSP Rates (Kharif 2025-26 & RMS 2026-27 Gazetted Rates in ₹/kg)
STATUTORY_BASE_MSP: Dict[str, float] = {
    "Paddy": 23.00,
    "Wheat": 22.75,
    "Mustard": 59.50,
    "Jute": 53.35,
    "Maize": 22.25,
    "Potato": 10.25,
    "Onion": 18.25,
}

# Statutory Grade Pricing Configuration
GRADE_PRICE_CONFIG: Dict[str, Dict[str, Any]] = {
    "Grade A": {
        "multiplier": 1.00,
        "discount_percent": 0.0,
        "label": "Grade A (FAQ Standard)",
        "status": "APPROVED",
        "badge_color": "emerald",
        "description": "Fair Average Quality (FAQ) certified produce. Entitled to 100% statutory MSP floor price without deductions.",
        "statutory_reference": "DFPD Uniform FAQ Standard & CACP Gazette"
    },
    "Grade B": {
        "multiplier": 0.98,
        "discount_percent": 2.0,
        "label": "Grade B (Permissible Standard)",
        "status": "APPROVED",
        "badge_color": "blue",
        "description": "Permissible quality produce within statutory tolerance limits. Accepted with 2% value cut adjustment.",
        "statutory_reference": "FCI Quality Control Manual & Mandi Value Cut Schedule"
    },
    "Grade C": {
        "multiplier": 0.90,
        "discount_percent": 10.0,
        "label": "Grade C (Sun-Drying / Marginal)",
        "status": "DEFERRED_SUN_DRYING",
        "badge_color": "amber",
        "description": "Marginal high-moisture lot. Entitled to 2.5h yard drying or 10% value cut adjustment if admitted.",
        "statutory_reference": "WBAMB Mandi Courtyard Sun-Drying Grace Guidelines"
    },
    "Rejected": {
        "multiplier": 0.0,
        "discount_percent": 100.0,
        "label": "Rejected (Spoilage Hazard)",
        "status": "REJECTED",
        "badge_color": "red",
        "description": "Excessive moisture (≥20%) presenting fungal aflatoxin rot hazard. Intake blocked by safety guards.",
        "statutory_reference": "FSSAI & WDRA Scientific Grain Storage Norms"
    }
}


def get_base_msp(crop: str) -> float:
    """Returns statutory base MSP for a crop, defaulting to Paddy if unlisted."""
    return STATUTORY_BASE_MSP.get(crop, 23.00)


def calculate_gradewise_price(crop: str, grade: str, base_rate: Optional[float] = None) -> Dict[str, Any]:
    """
    Computes statutory gradewise price details:
    - base_rate: official statutory MSP floor price (or override base rate if provided)
    - grade: "Grade A", "Grade B", "Grade C", or "Rejected"
    - multiplier: 1.0 for Grade A, 0.98 for Grade B (2% reduction), 0.90 for Grade C (10% reduction), 0 for Rejected
    - effective_rate: base_rate * multiplier rounded to 2 decimal places
    - discount_percent: 0.0, 2.0, 10.0, or 100.0
    - discount_amount_per_kg: reduction in ₹/kg
    """
    norm_crop = crop.strip().capitalize() if crop else "Paddy"
    base = float(base_rate) if base_rate is not None and base_rate > 0 else get_base_msp(norm_crop)

    config = GRADE_PRICE_CONFIG.get(grade, GRADE_PRICE_CONFIG["Grade A"])
    multiplier = config["multiplier"]
    discount_pct = config["discount_percent"]

    if grade == "Rejected":
        effective = 0.0
        deduction = base
    else:
        effective = round(base * multiplier, 2)
        deduction = round(base - effective, 2)

    return {
        "crop": norm_crop,
        "grade": grade,
        "base_rate_per_kg": round(base, 2),
        "effective_rate_per_kg": effective,
        "multiplier": multiplier,
        "discount_percentage": discount_pct,
        "deduction_per_kg": deduction,
        "label": config["label"],
        "status": config["status"],
        "badge_color": config["badge_color"],
        "description": config["description"],
        "statutory_reference": config["statutory_reference"]
    }
