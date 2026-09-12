"""
Dynamic Geographic Distance & Road Routing Engine (Redis Accelerated)
Calculates driving distance and travel duration between geographic coordinates.
Attempts OSRM driving route with short timeout (~1.8s) and multi-tier Redis + in-memory caching.
Automatically falls back to Haversine * 1.25 winding factor at 20 km/h (3.0 min/km)
farm transit speed if OSRM is unreachable, times out, or fails.
"""
import math
import json
import asyncio
import urllib.request
import urllib.error
from typing import Dict, Any, Tuple, Optional
from app.redis_client import redis_manager

# In-memory routing cache fallback: (lat1, lon1, lat2, lon2) -> {"distance_km": float, "duration_minutes": float, "source": str}
_ROUTING_CACHE: Dict[Tuple[float, float, float, float], Dict[str, Any]] = {}

# Constants
EARTH_RADIUS_KM = 6371.0
RURAL_WINDING_FACTOR = 1.25
FARM_TRANSIT_MIN_PER_KM = 3.0  # 20 km/h loaded tractor/tempo transport = 3.0 mins/km
GEO_CACHE_TTL_SECONDS = 86400 * 7  # 7 days


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate straight-line Haversine distance in kilometers."""
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_KM * c


def calculate_haversine_fallback(lat1: float, lon1: float, lat2: float, lon2: float) -> Dict[str, Any]:
    """
    Fallback road distance and duration calculation.
    Road distance = Haversine * 1.25 winding factor
    Duration = Road distance * 3.0 min/km (20 km/h agricultural transit speed)
    """
    straight_km = haversine_distance(lat1, lon1, lat2, lon2)
    if straight_km < 0.05:
        return {
            "distance_km": 0.0,
            "duration_minutes": 0.0,
            "source": "haversine_fallback"
        }

    road_km = round(straight_km * RURAL_WINDING_FACTOR, 1)
    duration_mins = round(road_km * FARM_TRANSIT_MIN_PER_KM, 1)
    return {
        "distance_km": road_km,
        "duration_minutes": duration_mins,
        "source": "haversine_fallback"
    }


def _fetch_osrm_sync(lat1: float, lon1: float, lat2: float, lon2: float, timeout_seconds: float) -> Optional[Dict[str, Any]]:
    """Synchronous network call to public OSRM driving routing service."""
    url = f"http://router.project-osrm.org/route/v1/driving/{lon1:.6f},{lat1:.6f};{lon2:.6f},{lat2:.6f}?overview=false"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "KrishiConnect-Routing/1.0 (Agricultural-Procurement-Platform)"}
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout_seconds) as response:
            if response.status == 200:
                data = json.loads(response.read().decode("utf-8"))
                if data.get("code") == "Ok" and data.get("routes"):
                    route = data["routes"][0]
                    distance_km = round(route["distance"] / 1000.0, 1)
                    calc_duration = max(round(route["duration"] / 60.0, 1), round(distance_km * FARM_TRANSIT_MIN_PER_KM, 1))
                    return {
                        "distance_km": distance_km,
                        "duration_minutes": calc_duration,
                        "source": "osrm"
                    }
    except Exception:
        pass
    return None


async def calculate_distance_and_duration(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
    timeout_seconds: float = 1.8,
    force_fallback: bool = False
) -> Dict[str, Any]:
    """
    Calculate road distance (km) and travel duration (minutes) between two points.
    First checks Redis cache, then in-memory cache, then attempts OSRM routing,
    with transparent fallback to Haversine * 1.25.
    """
    # Identical or near-identical coordinates
    if abs(lat1 - lat2) < 0.0001 and abs(lon1 - lon2) < 0.0001:
        return {
            "distance_km": 0.0,
            "duration_minutes": 0.0,
            "source": "exact_match"
        }

    mem_key = (round(lat1, 4), round(lon1, 4), round(lat2, 4), round(lon2, 4))
    redis_key = f"geo:route:{round(lat1, 4)}:{round(lon1, 4)}:{round(lat2, 4)}:{round(lon2, 4)}"

    # 1. Check Redis Cache
    if not force_fallback and redis_manager.is_available:
        cached_redis = await redis_manager.get_json(redis_key)
        if cached_redis:
            cached_redis["source"] = "redis_cache"
            return cached_redis

    # 2. Check local memory cache
    if not force_fallback and mem_key in _ROUTING_CACHE:
        cached = _ROUTING_CACHE[mem_key].copy()
        cached["source"] = "cache"
        return cached

    if force_fallback:
        result = calculate_haversine_fallback(lat1, lon1, lat2, lon2)
        _ROUTING_CACHE[mem_key] = result
        if redis_manager.is_available:
            await redis_manager.set_json(redis_key, result, expire_seconds=GEO_CACHE_TTL_SECONDS)
        return result

    try:
        osrm_result = await asyncio.to_thread(
            _fetch_osrm_sync, lat1, lon1, lat2, lon2, timeout_seconds
        )
        if osrm_result is not None:
            _ROUTING_CACHE[mem_key] = osrm_result
            if redis_manager.is_available:
                await redis_manager.set_json(redis_key, osrm_result, expire_seconds=GEO_CACHE_TTL_SECONDS)
            return osrm_result
    except Exception:
        pass

    # Fallback
    fallback_result = calculate_haversine_fallback(lat1, lon1, lat2, lon2)
    _ROUTING_CACHE[mem_key] = fallback_result
    if redis_manager.is_available:
        await redis_manager.set_json(redis_key, fallback_result, expire_seconds=GEO_CACHE_TTL_SECONDS)
    return fallback_result


def clear_routing_cache():
    """Clear in-memory routing cache (used for testing)."""
    _ROUTING_CACHE.clear()
