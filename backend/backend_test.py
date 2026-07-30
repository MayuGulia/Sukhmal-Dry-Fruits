"""
Sukhmal Dry Fruits Korner - Phase 2 Backend Testing
Tests all customer-facing APIs: catalog, checkout, tracking, contact, enquiry
"""
import requests
import sys
import json
import hmac
import hashlib
from datetime import datetime

# Backend URL from frontend/.env
BACKEND_URL = "https://nut-korner.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"
WEBHOOK_SECRET = "dev-webhook-secret"

class BackendTester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{API_BASE}{endpoint}"
        self.tests_run += 1
        print(f"\n🔍 Test {self.tests_run}: {name}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers or {}, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers or {}, timeout=10)
            
            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ PASS - Status: {response.status_code}")
                try:
                    resp_data = response.json()
                    print(f"   Response: {json.dumps(resp_data, indent=2)[:200]}")
                except:
                    pass
                return True, response
            else:
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "got": response.status_code,
                    "endpoint": endpoint
                })
                print(f"❌ FAIL - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.text[:200]}")
                except:
                    pass
                return False, response
                
        except Exception as e:
            self.failed_tests.append({
                "test": name,
                "error": str(e),
                "endpoint": endpoint
            })
            print(f"❌ FAIL - Error: {str(e)}")
            return False, None

    def sign_webhook(self, body_bytes):
        """Sign webhook payload with HMAC-SHA256"""
        return hmac.new(WEBHOOK_SECRET.encode(), body_bytes, hashlib.sha256).hexdigest()

def main():
    tester = BackendTester()
    
    print("=" * 70)
    print("SUKHMAL DRY FRUITS KORNER - PHASE 2 BACKEND TESTS")
    print("=" * 70)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Testing started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    # ========== HEALTH CHECK ==========
    print("\n" + "=" * 70)
    print("SECTION 1: HEALTH CHECK")
    print("=" * 70)
    
    tester.test(
        "Health check - GET /api/",
        "GET", "/", 200
    )

    # ========== CATALOG APIs ==========
    print("\n" + "=" * 70)
    print("SECTION 2: CATALOG APIs (Real Catalog - 85 Products, 7 Categories, 9 Hampers)")
    print("=" * 70)
    
    # Seed catalog first (idempotent)
    tester.test(
        "Seed catalog - POST /api/seed/catalog",
        "POST", "/seed/catalog", 200
    )
    
    # Test categories
    success, resp = tester.test(
        "List categories - GET /api/catalog/categories (expect 7)",
        "GET", "/catalog/categories", 200
    )
    if success and resp:
        data = resp.json()
        if len(data) == 7:
            print(f"   ✓ Got 7 categories: {', '.join([c['name'] for c in data])}")
        else:
            print(f"   ⚠ Expected 7 categories, got {len(data)}")
    
    # Test all products
    success, resp = tester.test(
        "List all products - GET /api/catalog/products (expect 85)",
        "GET", "/catalog/products", 200
    )
    if success and resp:
        data = resp.json()
        if len(data) == 85:
            print(f"   ✓ Got 85 products")
        else:
            print(f"   ⚠ Expected 85 products, got {len(data)}")
    
    # Test category filter
    success, resp = tester.test(
        "List products by category - GET /api/catalog/products?category=nuts (expect 28)",
        "GET", "/catalog/products?category=nuts", 200
    )
    if success and resp:
        data = resp.json()
        if len(data) == 28:
            print(f"   ✓ Got 28 products in 'nuts' category")
        else:
            print(f"   ⚠ Expected 28 products in 'nuts', got {len(data)}")
    
    # Test bestseller filter
    success, resp = tester.test(
        "List bestsellers - GET /api/catalog/products?bestseller=true&limit=6",
        "GET", "/catalog/products?bestseller=true&limit=6", 200
    )
    if success and resp:
        data = resp.json()
        if len(data) <= 6 and all(p.get('bestseller') for p in data):
            print(f"   ✓ Got {len(data)} bestseller products")
        else:
            print(f"   ⚠ Bestseller filter issue: got {len(data)} products")
    
    # Test search
    success, resp = tester.test(
        "Search products - GET /api/catalog/products?q=kaju (cashew search)",
        "GET", "/catalog/products?q=kaju", 200
    )
    if success and resp:
        data = resp.json()
        if len(data) > 0:
            print(f"   ✓ Search 'kaju' returned {len(data)} products")
        else:
            print(f"   ⚠ Search 'kaju' returned no products")
    
    # Test sort
    success, resp = tester.test(
        "Sort products - GET /api/catalog/products?sort=price-asc&limit=10",
        "GET", "/catalog/products?sort=price-asc&limit=10", 200
    )
    if success and resp:
        data = resp.json()
        if len(data) > 0:
            prices = [p['price'] for p in data]
            if prices == sorted(prices):
                print(f"   ✓ Products sorted by price ascending: {prices[:3]}...")
            else:
                print(f"   ⚠ Sort not working correctly")
    
    # Test product detail
    success, resp = tester.test(
        "Get product by slug - GET /api/catalog/product/kaju-320-n",
        "GET", "/catalog/product/kaju-320-n", 200
    )
    if success and resp:
        data = resp.json()
        required_fields = ['description', 'highlights', 'allergen_info', 'variants', 'images']
        missing = [f for f in required_fields if f not in data]
        if not missing:
            print(f"   ✓ Product has all required fields: {', '.join(required_fields)}")
            print(f"   ✓ Variants: {len(data['variants'])}, Images: {len(data['images'])}")
        else:
            print(f"   ⚠ Missing fields: {missing}")
    
    tester.test(
        "Get non-existent product - GET /api/catalog/product/nonexistent",
        "GET", "/catalog/product/nonexistent", 404
    )
    
    # Test hampers
    success, resp = tester.test(
        "List hampers - GET /api/catalog/hampers (expect 9)",
        "GET", "/catalog/hampers", 200
    )
    if success and resp:
        data = resp.json()
        if len(data) == 9:
            print(f"   ✓ Got 9 hampers")
        else:
            print(f"   ⚠ Expected 9 hampers, got {len(data)}")
    
    # Test hamper detail
    success, resp = tester.test(
        "Get hamper by slug - GET /api/catalog/hamper/royal-gold-hamper",
        "GET", "/catalog/hamper/royal-gold-hamper", 200
    )
    if success and resp:
        data = resp.json()
        required_fields = ['tier', 'tags', 'contents', 'description']
        missing = [f for f in required_fields if f not in data]
        if not missing:
            print(f"   ✓ Hamper has all required fields")
        else:
            print(f"   ⚠ Missing fields: {missing}")

    # ========== CHECKOUT APIs ==========
    print("\n" + "=" * 70)
    print("SECTION 3: CHECKOUT APIs")
    print("=" * 70)
    
    # Pincode checks
    success, resp = tester.test(
        "Check serviceable pincode - GET /api/checkout/pincode/110006",
        "GET", "/checkout/pincode/110006", 200
    )
    if success and resp:
        data = resp.json()
        if data.get('ok') == True and 'eta' in data:
            print("   ✓ Pincode 110006 is serviceable with ETA")
        else:
            print("   ⚠ Response format unexpected")
    
    success, resp = tester.test(
        "Check unserviceable pincode - GET /api/checkout/pincode/110099",
        "GET", "/checkout/pincode/110099", 200
    )
    if success and resp:
        data = resp.json()
        if data.get('ok') == False:
            print("   ✓ Pincode 110099 correctly marked as unserviceable")
        else:
            print("   ⚠ Expected ok:false for unserviceable pincode")
    
    # Coupon validation
    success, resp = tester.test(
        "Valid coupon WELCOME10 - POST /api/checkout/coupon",
        "POST", "/checkout/coupon", 200,
        data={"code": "WELCOME10", "subtotal": 1000}
    )
    if success and resp:
        data = resp.json()
        if data.get('ok') == True and data.get('discount') == 100:
            print("   ✓ WELCOME10 applied 10% discount correctly")
        else:
            print(f"   ⚠ Expected discount 100, got {data.get('discount')}")
    
    success, resp = tester.test(
        "Coupon below minimum - POST /api/checkout/coupon",
        "POST", "/checkout/coupon", 200,
        data={"code": "FESTIVE500", "subtotal": 500}
    )
    if success and resp:
        data = resp.json()
        if data.get('ok') == False:
            print("   ✓ FESTIVE500 correctly rejected for subtotal below ₹1,500")
        else:
            print("   ⚠ Expected ok:false for below-minimum order")
    
    success, resp = tester.test(
        "Valid coupon FESTIVE500 - POST /api/checkout/coupon",
        "POST", "/checkout/coupon", 200,
        data={"code": "FESTIVE500", "subtotal": 2000}
    )
    if success and resp:
        data = resp.json()
        if data.get('ok') == True and data.get('discount') == 500:
            print("   ✓ FESTIVE500 applied ₹500 discount correctly")
    
    tester.test(
        "Invalid coupon - POST /api/checkout/coupon",
        "POST", "/checkout/coupon", 200,
        data={"code": "INVALID", "subtotal": 1000}
    )

    # ========== TRACKING API ==========
    print("\n" + "=" * 70)
    print("SECTION 4: TRACKING API")
    print("=" * 70)
    
    success, resp = tester.test(
        "Track order - GET /api/tracking/ord_abc123def456",
        "GET", "/tracking/ord_abc123def456", 200
    )
    if success and resp:
        data = resp.json()
        if 'timeline' in data and isinstance(data['timeline'], list):
            print(f"   ✓ Timeline has {len(data['timeline'])} events")

    # ========== CONTACT & ENQUIRY APIs ==========
    print("\n" + "=" * 70)
    print("SECTION 5: CONTACT & ENQUIRY APIs")
    print("=" * 70)
    
    tester.test(
        "Contact without consent - POST /api/contact",
        "POST", "/contact", 400,
        data={
            "first": "Test",
            "last": "User",
            "email": "test@example.com",
            "message": "Test message",
            "consent": False
        }
    )
    
    tester.test(
        "Contact with consent - POST /api/contact",
        "POST", "/contact", 200,
        data={
            "first": "Test",
            "last": "User",
            "email": "test@example.com",
            "phone": "9876543210",
            "subject": "Product Inquiry",
            "query_type": "General",
            "message": "I want to know about bulk orders",
            "consent": True
        }
    )
    
    tester.test(
        "Bulk enquiry - POST /api/enquiry/bulk",
        "POST", "/enquiry/bulk", 200,
        data={
            "name": "Corporate Client",
            "phone": "9876543210",
            "email": "corporate@example.com",
            "occasion": "Wedding",
            "qty": "500 hampers",
            "notes": "Need custom branding"
        }
    )

    # ========== PHASE 1 POC TESTS ==========
    print("\n" + "=" * 70)
    print("SECTION 6: PHASE 1 POC - PAYMENT CORE")
    print("=" * 70)
    
    # Create a test product
    import uuid
    product_id = f"test_prod_{uuid.uuid4().hex[:8]}"
    tester.test(
        "Create test product - POST /api/poc/product",
        "POST", "/poc/product", 200,
        data={
            "id": product_id,
            "name": "Test Almonds",
            "price": 499.0,
            "stock": 10
        }
    )
    
    # Create order (idempotent)
    idempotency_key = f"test_idem_{uuid.uuid4().hex[:10]}"
    success, resp = tester.test(
        "Create order - POST /api/poc/order",
        "POST", "/poc/order", 200,
        data={
            "idempotency_key": idempotency_key,
            "items": [{"product_id": product_id, "qty": 2, "unit_price": 0}]
        }
    )
    
    order_id = None
    if success and resp:
        data = resp.json()
        order_id = data.get('order', {}).get('id')
        if data.get('idempotent') == False:
            print(f"   ✓ New order created: {order_id}")
    
    # Test idempotency
    if order_id:
        success, resp = tester.test(
            "Idempotent order creation - POST /api/poc/order (same key)",
            "POST", "/poc/order", 200,
            data={
                "idempotency_key": idempotency_key,
                "items": [{"product_id": product_id, "qty": 2, "unit_price": 0}]
            }
        )
        if success and resp:
            data = resp.json()
            if data.get('idempotent') == True and data.get('order', {}).get('id') == order_id:
                print("   ✓ Idempotency working - same order returned")
    
    # Test webhook without signature
    if order_id:
        event_payload = {
            "event_id": f"evt_{uuid.uuid4().hex[:10]}",
            "event": "payment.captured",
            "order_id": order_id,
            "payment_id": f"pay_{uuid.uuid4().hex[:10]}"
        }
        
        tester.test(
            "Webhook without signature - POST /api/poc/webhook",
            "POST", "/poc/webhook", 401,
            data=event_payload,
            headers={"X-Signature": "INVALID"}
        )
        
        # Test webhook with valid signature
        payload_bytes = json.dumps(event_payload).encode()
        valid_sig = tester.sign_webhook(payload_bytes)
        
        success, resp = tester.test(
            "Webhook with valid signature - POST /api/poc/webhook",
            "POST", "/poc/webhook", 200,
            data=event_payload,
            headers={"X-Signature": valid_sig, "Content-Type": "application/json"}
        )
        if success and resp:
            data = resp.json()
            if data.get('status') == 'confirmed':
                print("   ✓ Order confirmed via webhook")

    # ========== SUMMARY ==========
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    print(f"Total Tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {len(tester.failed_tests)}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.failed_tests:
        print("\n❌ FAILED TESTS:")
        for fail in tester.failed_tests:
            print(f"  - {fail['test']}")
            if 'error' in fail:
                print(f"    Error: {fail['error']}")
            else:
                print(f"    Expected: {fail['expected']}, Got: {fail['got']}")
    
    print("=" * 70)
    
    return 0 if len(tester.failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
