"""
KrishiConnect Automatic Gradewise Pricing Engine Verification Suite
Validates:
1. Exact statutory base MSP rates across all 7 supported commodities.
2. Statutory grade multipliers: Grade A (1.00), Grade B (0.98), Grade C (0.90), Rejected (0.0).
3. Automatic price deduction calculations for Grade B (2% reduction per FCI value cut schedule).
4. Automatic price deduction calculations for Grade C (10% reduction per Mandi courtyard grace protocol).
5. Spoilage zero-rate enforcement for Rejected produce.
6. Integration with compute_quality_grade function.
"""
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from app.pricing import (
    STATUTORY_BASE_MSP,
    GRADE_PRICE_CONFIG,
    calculate_gradewise_price,
    get_base_msp
)
from app.api.queue import compute_quality_grade


def test_gradewise_pricing_engine():
    print("=" * 70)
    print("🌾 KRISHICONNECT AUTOMATIC GRADEWISE PRICING VERIFICATION")
    print("=" * 70)

    # 1. Verify Base MSP Rates
    print("\n1️⃣  Testing Statutory Base MSP Registry...")
    expected_rates = {
        "Paddy": 23.00,
        "Wheat": 22.75,
        "Mustard": 59.50,
        "Jute": 53.35,
        "Maize": 22.25,
        "Potato": 10.25,
        "Onion": 18.25,
    }
    for crop, expected_rate in expected_rates.items():
        rate = get_base_msp(crop)
        assert rate == expected_rate, f"Expected {crop} base MSP {expected_rate}, got {rate}"
        print(f"   ✓ {crop:<8}: Base MSP = ₹{rate:.2f}/kg (₹{rate*100:,.0f}/quintal)")

    # 2. Verify Grade Pricing Multipliers & Value Cuts
    print("\n2️⃣  Testing Statutory Grade Multipliers & Value Cut Percentages...")
    assert GRADE_PRICE_CONFIG["Grade A"]["multiplier"] == 1.00
    assert GRADE_PRICE_CONFIG["Grade A"]["discount_percent"] == 0.0
    print("   ✓ Grade A (FAQ Standard): Multiplier=1.00, Value Cut=0.0% (100% MSP payout)")

    assert GRADE_PRICE_CONFIG["Grade B"]["multiplier"] == 0.98
    assert GRADE_PRICE_CONFIG["Grade B"]["discount_percent"] == 2.0
    print("   ✓ Grade B (Permissible Standard): Multiplier=0.98, Value Cut=2.0% (FCI Value Cut)")

    assert GRADE_PRICE_CONFIG["Grade C"]["multiplier"] == 0.90
    assert GRADE_PRICE_CONFIG["Grade C"]["discount_percent"] == 10.0
    print("   ✓ Grade C (Sun-Drying / Marginal): Multiplier=0.90, Value Cut=10.0% (WBAMB Grace)")

    assert GRADE_PRICE_CONFIG["Rejected"]["multiplier"] == 0.0
    assert GRADE_PRICE_CONFIG["Rejected"]["discount_percent"] == 100.0
    print("   ✓ Rejected (Spoilage Hazard): Multiplier=0.00, Payout=₹0.00 (Safety Block)")

    # 3. Test Gradewise Price Calculations across crops
    print("\n3️⃣  Testing Crop-by-Crop Gradewise Price Calculations...")
    for crop, base_msp in expected_rates.items():
        # Grade A: 100%
        p_a = calculate_gradewise_price(crop, "Grade A")
        assert p_a["base_rate_per_kg"] == base_msp
        assert p_a["effective_rate_per_kg"] == base_msp
        assert p_a["discount_percentage"] == 0.0
        assert p_a["deduction_per_kg"] == 0.0

        # Grade B: 98% (2% automatic reduction)
        p_b = calculate_gradewise_price(crop, "Grade B")
        expected_b_rate = round(base_msp * 0.98, 2)
        assert p_b["base_rate_per_kg"] == base_msp
        assert p_b["effective_rate_per_kg"] == expected_b_rate
        assert p_b["discount_percentage"] == 2.0
        assert p_b["deduction_per_kg"] == round(base_msp - expected_b_rate, 2)

        # Grade C: 90% (10% automatic reduction)
        p_c = calculate_gradewise_price(crop, "Grade C")
        expected_c_rate = round(base_msp * 0.90, 2)
        assert p_c["base_rate_per_kg"] == base_msp
        assert p_c["effective_rate_per_kg"] == expected_c_rate
        assert p_c["discount_percentage"] == 10.0

        # Rejected: 0
        p_rej = calculate_gradewise_price(crop, "Rejected")
        assert p_rej["effective_rate_per_kg"] == 0.0

        print(f"   ✓ {crop:<8}: Grade A=₹{p_a['effective_rate_per_kg']:.2f}/kg | Grade B=₹{p_b['effective_rate_per_kg']:.2f}/kg (-2%: -₹{p_b['deduction_per_kg']:.2f}) | Grade C=₹{p_c['effective_rate_per_kg']:.2f}/kg (-10%)")

    # 4. Detailed Validation for Key Benchmark: Paddy (Dhan)
    print("\n4️⃣  Detailed Validation for Mandi Flagship Crop: Paddy (Dhan)...")
    paddy_a = calculate_gradewise_price("Paddy", "Grade A")
    assert paddy_a["effective_rate_per_kg"] == 23.00
    paddy_b = calculate_gradewise_price("Paddy", "Grade B")
    assert paddy_b["effective_rate_per_kg"] == 22.54  # 23.00 * 0.98 = 22.54
    assert paddy_b["deduction_per_kg"] == 0.46
    paddy_c = calculate_gradewise_price("Paddy", "Grade C")
    assert paddy_c["effective_rate_per_kg"] == 20.70  # 23.00 * 0.90 = 20.70
    assert paddy_c["deduction_per_kg"] == 2.30

    print(f"   ✓ Paddy Grade A: ₹{paddy_a['effective_rate_per_kg']:.2f}/kg (100% of ₹23.00)")
    print(f"   ✓ Paddy Grade B: ₹{paddy_b['effective_rate_per_kg']:.2f}/kg (98% of ₹23.00, deduction ₹0.46/kg)")
    print(f"   ✓ Paddy Grade C: ₹{paddy_c['effective_rate_per_kg']:.2f}/kg (90% of ₹23.00, deduction ₹2.30/kg)")

    # 5. Integration with Assayer Grading Function
    print("\n5️⃣  Testing Quality Assay -> Automatic Gradewise Pricing Pipeline...")
    # FAQ Sample -> Grade A -> 100%
    grade_a, dec_a, mult_a, _ = compute_quality_grade("Paddy", moisture=13.5, chaff=0.5, damaged=0.0)
    assert grade_a == "Grade A"
    assert mult_a == 1.00
    price_a = calculate_gradewise_price("Paddy", grade_a)
    assert price_a["effective_rate_per_kg"] == 23.00
    print(f"   ✓ Moisture 13.5% (FAQ) -> {grade_a} -> Rate=₹{price_a['effective_rate_per_kg']:.2f}/kg (Full MSP)")

    # Permissible Sample -> Grade B -> 98%
    grade_b, dec_b, mult_b, _ = compute_quality_grade("Paddy", moisture=15.8, chaff=1.8, damaged=1.2)
    assert grade_b == "Grade B"
    assert mult_b == 0.98
    price_b = calculate_gradewise_price("Paddy", grade_b)
    assert price_b["effective_rate_per_kg"] == 22.54
    print(f"   ✓ Moisture 15.8% (Permissible) -> {grade_b} -> Rate=₹{price_b['effective_rate_per_kg']:.2f}/kg (Automatic 2% Value Cut)")

    # Marginal Sample -> Grade C -> 90%
    grade_c, dec_c, mult_c, _ = compute_quality_grade("Paddy", moisture=18.5, chaff=1.0, damaged=1.0)
    assert grade_c == "Grade C"
    assert mult_c == 0.90
    price_c = calculate_gradewise_price("Paddy", grade_c)
    assert price_c["effective_rate_per_kg"] == 20.70
    print(f"   ✓ Moisture 18.5% (Marginal) -> {grade_c} -> Rate=₹{price_c['effective_rate_per_kg']:.2f}/kg (Automatic 10% Value Cut)")

    # Spoilage Sample -> Rejected -> ₹0
    grade_rej, dec_rej, mult_rej, _ = compute_quality_grade("Paddy", moisture=22.0, chaff=1.0, damaged=1.0)
    assert grade_rej == "Rejected"
    assert mult_rej == 0.0
    price_rej = calculate_gradewise_price("Paddy", grade_rej)
    assert price_rej["effective_rate_per_kg"] == 0.0
    print(f"   ✓ Moisture 22.0% (Spoilage) -> {grade_rej} -> Rate=₹{price_rej['effective_rate_per_kg']:.2f}/kg (Safety Rejection)")

    print("\n" + "=" * 70)
    print("🎉 ALL GRADEWISE PRICING TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 70)


if __name__ == "__main__":
    test_gradewise_pricing_engine()
