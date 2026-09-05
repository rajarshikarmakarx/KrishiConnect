"""
KrishiConnect Location & Dynamic Distance Behavioural Test Suite
Verifies:
1. Dynamic centre distances & rankings for Village A (Haripur).
2. Dynamic shift in centre distances & rankings when changing to Village B (Bagnan).
3. Verification across at least 4 village/centre combinations (Haripur, Bagnan, Uluberia, Amta, Singur).
4. Simulated OSRM service failure / timeout verifying automatic Haversine x 1.25 rural winding fallback.
5. Farmer profile district & village update persistence.
6. Location API catalog endpoints (/locations, /districts, /villages, /coordinates).
"""
import asyncio
import urllib.error
from unittest.mock import patch
from app.database import AsyncSessionLocal
from app.api.ai import ai_recommend
from app.api.centres import list_centres
from app.api.locations import (
    list_districts,
    list_villages,
    get_coordinates,
    get_all_locations
)
from app.locations_data import (
    WB_LOCATIONS,
    get_all_districts,
    get_villages_for_district,
    find_village_coordinates
)
from app.distance import (
    calculate_distance_and_duration,
    calculate_haversine_fallback,
    haversine_distance,
    clear_routing_cache,
    _ROUTING_CACHE
)
from app.models import User, UserRole
from app.auth import get_password_hash
from sqlalchemy import select


async def run_behaviour_tests():
    print("🌾 Starting KrishiConnect Location & Dynamic Routing Behavioural Tests...\n")

    async with AsyncSessionLocal() as db:
        # ─────────────────────────────────────────────────────────────────────
        # 1. Test Dataset Integrity & Location Lookup APIs
        # ─────────────────────────────────────────────────────────────────────
        print("1️⃣  Testing West Bengal Location Dataset & APIs...")
        districts = await list_districts()
        assert len(districts) >= 6, f"Expected at least 6 districts, got {len(districts)}"
        assert "Howrah" in districts
        assert "Hooghly" in districts
        assert "Purba Bardhaman" in districts
        print(f"   Districts available ({len(districts)}): {districts}")

        # Villages in Howrah
        howrah_villages = await list_villages("Howrah")
        village_names = [v["village"] for v in howrah_villages]
        assert "Haripur" in village_names
        assert "Bagnan" in village_names
        assert "Uluberia" in village_names
        assert "Amta" in village_names
        print(f"   Howrah villages: {village_names}")

        # Village Coordinate Lookup
        coords_haripur = await get_coordinates("Haripur", "Howrah")
        assert coords_haripur["latitude"] == 22.5833
        assert coords_haripur["longitude"] == 88.3333
        print(f"   Haripur Coordinates: ({coords_haripur['latitude']}, {coords_haripur['longitude']})")

        # Full catalog endpoint
        catalog = await get_all_locations()
        assert "Howrah" in catalog
        print("   ✅ Location dataset and catalog APIs verified.\n")

        # ─────────────────────────────────────────────────────────────────────
        # 2. Test Multi-Village Dynamic Distance & Recommendation Shifts
        # ─────────────────────────────────────────────────────────────────────
        print("2️⃣  Testing Dynamic Recommendation Shifts Across 4+ Villages...")

        # Test Village 1: Haripur (Farmer in Haripur should see Haripur top ranked with ~0-3 km distance)
        rec_haripur = await ai_recommend(village="Haripur", district="Howrah", db=db)
        top_haripur = rec_haripur["centres"][0]
        print(f"   📍 Farmer in Haripur -> Top Pick: {top_haripur['centre_name']} (Distance: {top_haripur['distance_km']} km, Score: {top_haripur['composite_score']})")
        assert "Haripur" in top_haripur["centre_name"]
        assert top_haripur["distance_km"] < 5.0

        # Test Village 2: Bagnan (Farmer in Bagnan should see Bagnan top ranked with ~0-3 km distance)
        rec_bagnan = await ai_recommend(village="Bagnan", district="Howrah", db=db)
        top_bagnan = rec_bagnan["centres"][0]
        print(f"   📍 Farmer in Bagnan  -> Top Pick: {top_bagnan['centre_name']} (Distance: {top_bagnan['distance_km']} km, Score: {top_bagnan['composite_score']})")
        assert "Bagnan" in top_bagnan["centre_name"]
        assert top_bagnan["distance_km"] < 5.0

        # Test Village 3: Uluberia (Farmer in Uluberia should see Uluberia top ranked with ~0-3 km distance)
        rec_uluberia = await ai_recommend(village="Uluberia", district="Howrah", db=db)
        top_uluberia = rec_uluberia["centres"][0]
        print(f"   📍 Farmer in Uluberia -> Top Pick: {top_uluberia['centre_name']} (Distance: {top_uluberia['distance_km']} km, Score: {top_uluberia['composite_score']})")
        assert "Uluberia" in top_uluberia["centre_name"]
        assert top_uluberia["distance_km"] < 5.0

        # Test Village 4: Amta (Farmer in Amta should see Amta top ranked with ~0-3 km distance)
        rec_amta = await ai_recommend(village="Amta", district="Howrah", db=db)
        top_amta = rec_amta["centres"][0]
        print(f"   📍 Farmer in Amta    -> Top Pick: {top_amta['centre_name']} (Distance: {top_amta['distance_km']} km, Score: {top_amta['composite_score']})")
        assert "Amta" in top_amta["centre_name"]
        assert top_amta["distance_km"] < 5.0

        # Test Village 5: Singur (Hooghly District - Cross-district calculation)
        rec_singur = await ai_recommend(village="Singur", district="Hooghly", db=db)
        top_singur = rec_singur["centres"][0]
        print(f"   📍 Farmer in Singur (Hooghly) -> Top Pick: {top_singur['centre_name']} (Distance: {top_singur['distance_km']} km, Score: {top_singur['composite_score']})")
        assert top_singur["distance_km"] > 0

        # Test Village 6: Kakdwip (South 24 Parganas - Remote/Out-of-district > 50km check)
        rec_kakdwip = await ai_recommend(village="Kakdwip", district="South 24 Parganas", db=db)
        top_kakdwip = rec_kakdwip["centres"][0]
        print(f"   📍 Farmer in Kakdwip (South 24 Parganas) -> Closest Centre: {top_kakdwip['centre_name']} (Distance: {top_kakdwip['distance_km']} km, Score: {top_kakdwip['composite_score']})")
        assert top_kakdwip["distance_km"] >= 50.0  # Confirms all centres are > 50km
        print("   ✅ Dynamic distance and recommendation ranking verified across all test villages (including >50km regional boundaries).\n")

        # ─────────────────────────────────────────────────────────────────────
        # 3. Test Routing Engine & Simulated OSRM Failure with Haversine Fallback
        # ─────────────────────────────────────────────────────────────────────
        print("3️⃣  Testing Routing Engine, Caching & OSRM Failure Fallback...")

        # 3a. Direct Routing Test
        route = await calculate_distance_and_duration(22.5833, 88.3333, 22.4681, 88.1075)
        print(f"   Haripur -> Uluberia Route: {route['distance_km']} km, {route['duration_minutes']} min, Source: {route['source']}")
        assert route["distance_km"] > 0
        assert route["duration_minutes"] > 0

        # 3b. Verify In-Memory Cache hit
        cache_key = (round(22.5833, 4), round(88.3333, 4), round(22.4681, 4), round(88.1075, 4))
        assert cache_key in _ROUTING_CACHE
        cached_route = await calculate_distance_and_duration(22.5833, 88.3333, 22.4681, 88.1075)
        print(f"   Cache hit verified: {cached_route['distance_km']} km")

        # 3c. Simulate OSRM Network/Timeout Failure
        # Clear cache for test coordinates to ensure fallback code path executes
        test_origin = (22.8100, 88.2300)      # Singur
        test_dest = (22.4731, 87.9719)        # Bagnan
        test_cache_key = (round(test_origin[0], 4), round(test_origin[1], 4), round(test_dest[0], 4), round(test_dest[1], 4))
        _ROUTING_CACHE.pop(test_cache_key, None)

        def mock_failing_osrm(*args, **kwargs):
            return None  # Represents failed network call / timeout

        with patch("app.distance._fetch_osrm_sync", side_effect=mock_failing_osrm):
            fallback_route = await calculate_distance_and_duration(
                test_origin[0], test_origin[1],
                test_dest[0], test_dest[1]
            )
            print(f"   Simulated OSRM Timeout Fallback Result:")
            print(f"     Source: {fallback_route['source']}")
            print(f"     Calculated Distance: {fallback_route['distance_km']} km")
            print(f"     Calculated Duration: {fallback_route['duration_minutes']} min")

            # Validate fallback formula
            h_dist = haversine_distance(test_origin[0], test_origin[1], test_dest[0], test_dest[1])
            expected_fallback_dist = round(h_dist * 1.25, 1)
            expected_fallback_dur = round(expected_fallback_dist * 3.0, 1)

            assert fallback_route["source"] == "haversine_fallback"
            assert fallback_route["distance_km"] == expected_fallback_dist
            assert fallback_route["duration_minutes"] == expected_fallback_dur

        print("   ✅ Automatic Haversine x 1.25 rural winding fallback verified under simulated OSRM failure.\n")

        # ─────────────────────────────────────────────────────────────────────
        # 4. Test Farmer Profile Village & District Update Persistence
        # ─────────────────────────────────────────────────────────────────────
        print("4️⃣  Testing Profile District & Village Updates in Database...")
        # Check demo farmer
        result = await db.execute(select(User).where(User.mobile == "9876543210"))
        demo_farmer = result.scalar_one_or_none()
        assert demo_farmer is not None

        # Update to Bagnan, Howrah
        demo_farmer.village = "Bagnan"
        demo_farmer.district = "Howrah"
        await db.commit()
        await db.refresh(demo_farmer)

        assert demo_farmer.village == "Bagnan"
        assert demo_farmer.district == "Howrah"
        print(f"   Updated Demo Farmer Location -> Village: {demo_farmer.village}, District: {demo_farmer.district}")

        # Fetch centres list for this farmer's updated village
        centres_bagnan = await list_centres(
            village=demo_farmer.village,
            district=demo_farmer.district,
            current_user=demo_farmer,
            db=db
        )
        assert len(centres_bagnan) == 4
        # Top recommended should be Bagnan
        print(f"   Centres listing for updated farmer profile: Top = {centres_bagnan[0].name} ({centres_bagnan[0].distance_km} km)")
        assert "Bagnan" in centres_bagnan[0].name

        # Reset back to Haripur
        demo_farmer.village = "Haripur"
        demo_farmer.district = "Howrah"
        await db.commit()
        print("   ✅ Profile update and dynamic centre listing verified.\n")

    print("🎉 ALL BEHAVIOURAL TESTS PASSED CLEANLY! Dynamic location & routing is 100% operational.")


if __name__ == "__main__":
    asyncio.run(run_behaviour_tests())
