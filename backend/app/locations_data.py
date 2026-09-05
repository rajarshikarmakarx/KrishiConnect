"""
Curated West Bengal Geographic Dataset
Agricultural districts, sub-divisions/blocks, and villages with latitude and longitude coordinates.
Used for dynamic distance calculation and intelligent centre recommendations.
"""
from typing import Dict, List, Optional, Any

WB_LOCATIONS: Dict[str, List[Dict[str, Any]]] = {
    "Howrah": [
        {"village": "Haripur", "latitude": 22.5833, "longitude": 88.3333},
        {"village": "Bagnan", "latitude": 22.4731, "longitude": 87.9719},
        {"village": "Uluberia", "latitude": 22.4681, "longitude": 88.1075},
        {"village": "Amta", "latitude": 22.5961, "longitude": 87.9791},
        {"village": "Shyampur", "latitude": 22.3333, "longitude": 88.0167},
        {"village": "Domjur", "latitude": 22.6394, "longitude": 88.2217},
        {"village": "Panchla", "latitude": 22.5400, "longitude": 88.1400},
        {"village": "Jagatballavpur", "latitude": 22.6800, "longitude": 88.1000},
        {"village": "Sankrail", "latitude": 22.5694, "longitude": 88.2417},
        {"village": "Bally", "latitude": 22.6500, "longitude": 88.3400},
    ],
    "Hooghly": [
        {"village": "Singur", "latitude": 22.8100, "longitude": 88.2300},
        {"village": "Tarakeswar", "latitude": 22.8900, "longitude": 88.0200},
        {"village": "Pandua", "latitude": 23.0800, "longitude": 88.2800},
        {"village": "Polba", "latitude": 22.9600, "longitude": 88.3000},
        {"village": "Arambagh", "latitude": 22.8800, "longitude": 87.7800},
        {"village": "Chinsurah", "latitude": 22.9000, "longitude": 88.3900},
        {"village": "Chandannagar", "latitude": 22.8700, "longitude": 88.3700},
        {"village": "Serampore", "latitude": 22.7500, "longitude": 88.3400},
        {"village": "Haripal", "latitude": 22.8300, "longitude": 88.1200},
        {"village": "Balagarh", "latitude": 23.1200, "longitude": 88.4600},
    ],
    "Purba Bardhaman": [
        {"village": "Memari", "latitude": 23.1800, "longitude": 88.1200},
        {"village": "Kalna", "latitude": 23.2200, "longitude": 88.3700},
        {"village": "Katwa", "latitude": 23.6400, "longitude": 88.1300},
        {"village": "Galsi", "latitude": 23.3300, "longitude": 87.6900},
        {"village": "Jamalpur", "latitude": 23.0500, "longitude": 88.0000},
        {"village": "Raina", "latitude": 23.0800, "longitude": 87.9000},
        {"village": "Bardhaman Sadar", "latitude": 23.2400, "longitude": 87.8600},
        {"village": "Monteswar", "latitude": 23.4200, "longitude": 88.1100},
        {"village": "Bhatar", "latitude": 23.4200, "longitude": 87.9100},
    ],
    "Nadia": [
        {"village": "Krishnanagar", "latitude": 23.4000, "longitude": 88.5000},
        {"village": "Ranaghat", "latitude": 23.1800, "longitude": 88.5800},
        {"village": "Shantipur", "latitude": 23.2500, "longitude": 88.4300},
        {"village": "Chakdaha", "latitude": 23.0800, "longitude": 88.5200},
        {"village": "Nakashipara", "latitude": 23.5800, "longitude": 88.3500},
        {"village": "Tehatta", "latitude": 23.7500, "longitude": 88.5200},
        {"village": "Kalyani", "latitude": 22.9750, "longitude": 88.4344},
        {"village": "Chapra", "latitude": 23.5300, "longitude": 88.5500},
        {"village": "Karimpur", "latitude": 23.9700, "longitude": 88.6200},
    ],
    "North 24 Parganas": [
        {"village": "Barasat", "latitude": 22.7200, "longitude": 88.4800},
        {"village": "Basirhat", "latitude": 22.6600, "longitude": 88.8900},
        {"village": "Habra", "latitude": 22.8300, "longitude": 88.6300},
        {"village": "Bongaon", "latitude": 23.0400, "longitude": 88.8200},
        {"village": "Deganga", "latitude": 22.7000, "longitude": 88.6300},
        {"village": "Amdanga", "latitude": 22.8100, "longitude": 88.5200},
        {"village": "Gaighata", "latitude": 22.9300, "longitude": 88.7300},
        {"village": "Swarupnagar", "latitude": 22.8300, "longitude": 88.8700},
        {"village": "Baduria", "latitude": 22.7400, "longitude": 88.7900},
    ],
    "South 24 Parganas": [
        {"village": "Baruipur", "latitude": 22.3600, "longitude": 88.4300},
        {"village": "Diamond Harbour", "latitude": 22.1900, "longitude": 88.1900},
        {"village": "Canning", "latitude": 22.3100, "longitude": 88.6600},
        {"village": "Kakdwip", "latitude": 21.8800, "longitude": 88.1900},
        {"village": "Joynagar", "latitude": 22.1700, "longitude": 88.4200},
        {"village": "Gosaba", "latitude": 22.1600, "longitude": 88.8000},
        {"village": "Sonarpur", "latitude": 22.4400, "longitude": 88.4300},
        {"village": "Amtala", "latitude": 22.3700, "longitude": 88.2600},
        {"village": "Kulpi", "latitude": 22.0800, "longitude": 88.2400},
    ]
}


def get_all_districts() -> List[str]:
    """Return list of all supported West Bengal districts."""
    return list(WB_LOCATIONS.keys())


def get_villages_for_district(district: str) -> List[Dict[str, Any]]:
    """Return all villages/blocks under a specific district."""
    for dist_name, villages in WB_LOCATIONS.items():
        if dist_name.lower() == district.strip().lower():
            return villages
    return []


def find_village_coordinates(village: Optional[str] = None, district: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Look up coordinates for a given village/location name.
    If district is provided, searches that district first.
    Performs case-insensitive, fuzzy, and substring matching.
    Handles interchangeable village/district inputs (e.g. Kakdwip entered as district).
    """
    clean_v = village.strip().lower() if isinstance(village, str) and village.strip() else None
    clean_d = district.strip().lower() if isinstance(district, str) and district.strip() else None

    if not clean_v and not clean_d:
        return None

    # Check if district is actually a known village name (e.g. user entered "Kakdwip" as district)
    if clean_d:
        for dist_name, villages in WB_LOCATIONS.items():
            for item in villages:
                if item["village"].lower() == clean_d:
                    # If village is not provided or district is an explicit village match
                    if not clean_v or clean_v in ["haripur", "default", "none"] or item["village"].lower() == clean_d:
                        return {
                            "district": dist_name,
                            "village": item["village"],
                            "latitude": item["latitude"],
                            "longitude": item["longitude"]
                        }

    # 1. Search village in specified district if given
    if clean_v and clean_d:
        for dist_name, villages in WB_LOCATIONS.items():
            if dist_name.lower() == clean_d:
                for item in villages:
                    if item["village"].lower() == clean_v or clean_v in item["village"].lower() or item["village"].lower() in clean_v:
                        return {
                            "district": dist_name,
                            "village": item["village"],
                            "latitude": item["latitude"],
                            "longitude": item["longitude"]
                        }

    # 2. Search village exact match across all districts
    if clean_v:
        for dist_name, villages in WB_LOCATIONS.items():
            for item in villages:
                if item["village"].lower() == clean_v:
                    return {
                        "district": dist_name,
                        "village": item["village"],
                        "latitude": item["latitude"],
                        "longitude": item["longitude"]
                    }

    # 3. Check if village itself is a district name (e.g. user entered "South 24 Parganas" as village)
    if clean_v:
        for dist_name, villages in WB_LOCATIONS.items():
            if dist_name.lower() == clean_v or clean_v in dist_name.lower():
                item = villages[0]
                return {
                    "district": dist_name,
                    "village": item["village"],
                    "latitude": item["latitude"],
                    "longitude": item["longitude"]
                }

    # 4. Check if district is a district name (when village not found or not given)
    if clean_d:
        for dist_name, villages in WB_LOCATIONS.items():
            if dist_name.lower() == clean_d or clean_d in dist_name.lower() or dist_name.lower() in clean_d:
                item = villages[0]
                return {
                    "district": dist_name,
                    "village": item["village"],
                    "latitude": item["latitude"],
                    "longitude": item["longitude"]
                }

    # 5. Substring match across all districts for village or district
    search_term = clean_v or clean_d
    if search_term:
        for dist_name, villages in WB_LOCATIONS.items():
            for item in villages:
                if search_term in item["village"].lower() or item["village"].lower() in search_term:
                    return {
                        "district": dist_name,
                        "village": item["village"],
                        "latitude": item["latitude"],
                        "longitude": item["longitude"]
                    }

    return None
