"""
KrishiConnect Locations Router
Provides curated West Bengal agricultural districts, villages, and coordinates.
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from app.locations_data import (
    WB_LOCATIONS,
    get_all_districts,
    get_villages_for_district,
    find_village_coordinates
)

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("/districts", response_model=List[str])
async def list_districts():
    """Get list of all supported West Bengal districts."""
    return get_all_districts()


@router.get("/villages")
async def list_villages(district: Optional[str] = Query(None, description="Filter villages by district name")):
    """Get list of villages/blocks. If district is specified, returns villages for that district."""
    if district:
        villages = get_villages_for_district(district)
        if not villages:
            raise HTTPException(status_code=404, detail=f"District '{district}' not found or has no villages listed")
        return villages

    # Return flattened list across all districts
    all_villages = []
    for dist_name, v_list in WB_LOCATIONS.items():
        for v in v_list:
            all_villages.append({
                "district": dist_name,
                "village": v["village"],
                "latitude": v["latitude"],
                "longitude": v["longitude"]
            })
    return all_villages


@router.get("/coordinates")
async def get_coordinates(
    village: str = Query(..., description="Village or block name"),
    district: Optional[str] = Query(None, description="Optional district name for disambiguation")
):
    """Get geographic coordinates for a given village/location."""
    coords = find_village_coordinates(village, district)
    if not coords:
        raise HTTPException(
            status_code=404,
            detail=f"Location '{village}' not found in curated West Bengal dataset"
        )
    return coords


@router.get("")
async def get_all_locations():
    """Get complete curated West Bengal geographic dataset mapped by district."""
    return WB_LOCATIONS
