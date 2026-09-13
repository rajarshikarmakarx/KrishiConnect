"""
KrishiConnect Statutory Agmark & Mandi Quality Standards
Default state-level statutory specifications (DMI / FCI / WBAMB norms)
used as the standard baseline for all procurement centres and farmers.
"""
from typing import Dict, Any
import copy

DEFAULT_STATUTORY_STANDARDS: Dict[str, Any] = {
    "season": "Kharif 2025-26 & RMS 2026-27",
    "authority": "Directorate of Marketing & Inspection (DMI) & WB State Agricultural Marketing Board",
    "jurisdiction": "West Bengal, India",
    "effective_standard": "Statutory Mandi Procurement Quality Standards & Agmark Rules",
    "infrastructure_notes": "Statutory state norms. Accommodates standard mandi drying yards and digital moisture meters.",
    "grading_tiers": [
        {
            "grade": "Grade A",
            "tier_title": "Grade I (Premium / Choice)",
            "label": "Grade A / Grade I (Premium / Choice)",
            "payout_multiplier": 1.0,
            "payout_percentage": "100%",
            "moisture_threshold": "≤ 14.0%",
            "chaff_threshold": "≤ 1.0%",
            "damaged_threshold": "≤ 1.0%",
            "foreign_matter_chaff": "Extremely Low (≤ 0.5% - 1.0%)",
            "damaged_discolored": "Negligible (≤ 1.0%)",
            "typical_market_destination": "Premium retail food, export quality, milling.",
            "status": "APPROVED",
            "color": "emerald",
            "description": "Fair Average Quality (FAQ) certified produce. Premium lot quality entitled to 100% statutory MSP floor price without deductions."
        },
        {
            "grade": "Grade B",
            "tier_title": "Grade II (Standard)",
            "label": "Grade B / Grade II (Standard)",
            "payout_multiplier": 0.98,
            "payout_percentage": "98%",
            "moisture_threshold": "14.1% - 17.0%",
            "chaff_threshold": "≤ 1.5%",
            "damaged_threshold": "≤ 3.0%",
            "foreign_matter_chaff": "Low (≤ 1.5%)",
            "damaged_discolored": "Low (≤ 2.0% - 3.0%)",
            "typical_market_destination": "Standard consumer distribution, general food processing.",
            "status": "APPROVED",
            "color": "blue",
            "description": "Permissible quality produce within statutory tolerance limits. Accepted with standard 2% moisture adjustment."
        },
        {
            "grade": "Grade C",
            "tier_title": "Grade III & IV (Utility)",
            "label": "Grade C / Grade III & IV (Utility)",
            "payout_multiplier": 0.90,
            "payout_percentage": "90%",
            "moisture_threshold": "17.1% - 19.9%",
            "chaff_threshold": "≤ 3.0%",
            "damaged_threshold": "≤ 5.0%",
            "foreign_matter_chaff": "Moderate (≤ 2.0% - 3.0%)",
            "damaged_discolored": "Moderate (≤ 4.0% - 5.0%)",
            "typical_market_destination": "Commercial blending, industrial processing.",
            "status": "DEFERRED_SUN_DRYING",
            "color": "amber",
            "description": "Marginal high moisture lot. Entitled to statutory 2.5-hour mandi courtyard sun-drying grace period before mandatory re-assaying."
        },
        {
            "grade": "Rejected",
            "tier_title": "Sample Grade / Rejected",
            "label": "Sample Grade / Rejected",
            "payout_multiplier": 0.0,
            "payout_percentage": "0%",
            "moisture_threshold": "≥ 20.0%",
            "chaff_threshold": "> 3.0%",
            "damaged_threshold": "> 5.0%",
            "foreign_matter_chaff": "High (> 3.0%)",
            "damaged_discolored": "High (> 5.0%)",
            "typical_market_destination": "Animal feed, biofuel extraction, or rejected due to toxins/odor.",
            "status": "REJECTED",
            "color": "red",
            "description": "Excessive moisture and spoilage hazard. Intake blocked by safety guards to prevent Aspergillus flavus fungal rot in central silos."
        }
    ],
    "crop_standards": [
        {
            "crop": "Paddy",
            "faq_moisture_max": 14.0,
            "permissible_moisture_max": 17.0,
            "max_foreign_chaff": 1.5,
            "max_damaged_grains": 2.0,
            "min_purity_percentage": 97.0,
            "special_parameter": "Max 3.0% immature/shrivelled grains",
            "notes": "Covers Aman, Aus, and Boro paddy. Grains must be clean, free from weeds, chaff, and mud."
        },
        {
            "crop": "Wheat",
            "faq_moisture_max": 12.0,
            "permissible_moisture_max": 12.0,
            "max_foreign_chaff": 0.75,
            "max_damaged_grains": 2.0,
            "min_purity_percentage": 98.0,
            "special_parameter": "Max 1.0% weevilled grains",
            "notes": "Sound, mature wheat kernels. Free from karnal bunt, smut, and live insect infestation."
        },
        {
            "crop": "Mustard",
            "faq_moisture_max": 8.0,
            "permissible_moisture_max": 9.0,
            "max_foreign_chaff": 2.0,
            "max_damaged_grains": 1.5,
            "min_purity_percentage": 97.0,
            "special_parameter": "Min 38.0% oil content, 0% Argemone",
            "notes": "Black and yellow mustard seeds. Thoroughly dried, zero contamination with toxic Argemone mexicana."
        },
        {
            "crop": "Jute",
            "faq_moisture_max": 18.0,
            "permissible_moisture_max": 20.0,
            "max_foreign_chaff": 1.0,
            "max_damaged_grains": 3.0,
            "min_purity_percentage": 95.0,
            "special_parameter": "TD-5 / W-5 grade tensile strength",
            "notes": "Raw tossa and white jute. Cleanly retted, free from root-cuttings, mud, and specks."
        },
        {
            "crop": "Maize",
            "faq_moisture_max": 14.0,
            "permissible_moisture_max": 16.0,
            "max_foreign_chaff": 1.5,
            "max_damaged_grains": 3.0,
            "min_purity_percentage": 97.0,
            "special_parameter": "Max 2.0% broken kernels",
            "notes": "Yellow and white corn. Free from cob particles, mold, and insect tunneling."
        },
        {
            "crop": "Potato",
            "faq_moisture_max": 0.0,
            "permissible_moisture_max": 0.0,
            "max_foreign_chaff": 1.0,
            "max_damaged_grains": 3.0,
            "min_purity_percentage": 96.0,
            "special_parameter": "Min 45 mm tuber diameter, 0% soft rot",
            "notes": "Jyoti and Chandramukhi varieties. Clean surface, firm tubers without greening or late blight."
        },
        {
            "crop": "Onion",
            "faq_moisture_max": 0.0,
            "permissible_moisture_max": 0.0,
            "max_foreign_chaff": 1.0,
            "max_damaged_grains": 2.0,
            "min_purity_percentage": 96.0,
            "special_parameter": "Neck thickness < 15 mm, 0% sprouting",
            "notes": "Sukh Sagar variety. Well-cured with intact outer papery dry skins, free from doubles and bolters."
        }
    ],
    "statutory_rules": [
        {
            "rule_id": "SEC-24A",
            "title": "Moisture Safe Storage Guard",
            "description": "Government silos strictly prohibit intake of produce with moisture ≥20.0% to prevent fungal aflatoxin contamination and grain rot."
        },
        {
            "rule_id": "SEC-18B",
            "title": "Courtyard Sun-Drying Grace Rights",
            "description": "Farmers whose lot exhibits 17.1% - 19.9% moisture are entitled by law to a 2.5-hour free mandi yard sun-drying window before any refusal."
        },
        {
            "rule_id": "SEC-12C",
            "title": "Digital Meter Calibration Standard",
            "description": "All moisture meters and weighbridges at procurement counters must be calibrated per ISO 712 and Legal Metrology standards."
        }
    ]
}


def get_default_standards() -> Dict[str, Any]:
    """Return a deep copy of the default statutory standards."""
    return copy.deepcopy(DEFAULT_STATUTORY_STANDARDS)
