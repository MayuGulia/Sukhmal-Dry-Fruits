"""Phase 1 POC test — payment webhook + atomic stock + idempotent orders.

Runs against a live backend at BACKEND_URL (defaults to REACT_APP_BACKEND_URL from frontend/.env
or http://localhost:8001). All routes prefixed with /api.

Assertions:
  1. Idempotent order creation — same idempotency key returns the same order
  2. Order stays pending; stock is NOT decremented at order-create time
  3. Frontend-only "success" cannot confirm — only signed webhook can
  4. Webhook with valid signature confirms order + decrements stock atomically
  5. Replaying the same webhook event is a no-op (no double decrement)
  6. payment.failed does not decrement stock
  7. Last-unit concurrency — 5 parallel webhooks for the same stock-1 product
     result in EXACTLY 1 confirmed + 4 failed with 409 (no overselling)
"""
import os
import sys
import json
import uuid
import hmac
import hashlib
import asyncio
from pathlib import Path

import requests

# Backend URL discovery — prefer the public preview URL so tests exercise the same
# ingress path as production. Fall back to localhost for dev.
def _discover_backend() -> str:
    env_url = os.environ.get("BACKEND_URL")
    if env_url:
        return env_url.rstrip("/")
    fe_env = Path(__file__).resolve().parents[2] / "frontend" / ".env"
    if fe_env.exists():
        for line in fe_env.read_text().splitlines():
            if line.startswith("REACT_APP_BACKEND_URL="):
                return line.split("=", 1)[1].strip().strip('"').rstrip("/")
    return "http://localhost:8001"


BACKEND = _discover_backend()
API = f"{BACKEND}/api"
WEBHOOK_SECRET = "dev-webhook-secret"  # matches server default; override via .env for prod

print(f"[cfg] backend={BACKEND}")


def _sign(body: bytes) -> str:
    return hmac.new(WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()


def _post(path: str, payload: dict, headers=None):
    r = requests.post(f"{API}{path}", json=payload, headers=headers or {}, timeout=15)
    return r


def _post_raw(path: str, raw: bytes, headers=None):
    r = requests.post(f"{API}{path}", data=raw, headers=headers or {"Content-Type": "application/json"}, timeout=15)
    return r


def _get(path: str):
    return requests.get(f"{API}{path}", timeout=15)


def seed_product(stock: int, price: float = 499.0) -> str:
    pid = f"prod_{uuid.uuid4().hex[:8]}"
    r = _post("/poc/product", {"id": pid, "name": f"Almonds {pid}", "price": price, "stock": stock})
    assert r.status_code == 200, f"seed failed {r.status_code} {r.text}"
    return pid


def test_1_idempotent_order_creation():
    pid = seed_product(stock=5)
    key = f"idem_{uuid.uuid4().hex[:10]}"
    body = {"idempotency_key": key, "items": [{"product_id": pid, "qty": 2, "unit_price": 0}]}
    r1 = _post("/poc/order", body)
    assert r1.status_code == 200, r1.text
    d1 = r1.json()
    assert d1["idempotent"] is False
    order1_id = d1["order"]["id"]

    r2 = _post("/poc/order", body)
    assert r2.status_code == 200, r2.text
    d2 = r2.json()
    assert d2["idempotent"] is True, "second submit must be idempotent"
    assert d2["order"]["id"] == order1_id, "same idempotency key must return same order id"

    # Stock must still be 5 — nothing decremented yet
    prod = _get(f"/poc/product/{pid}").json()
    assert prod["stock"] == 5, f"stock changed before webhook confirmation: {prod['stock']}"
    print("[PASS] 1. Idempotent order creation + no stock decrement pre-webhook")
    return order1_id, pid


def test_2_webhook_signature_required():
    pid = seed_product(stock=3)
    key = f"idem_{uuid.uuid4().hex[:10]}"
    r = _post("/poc/order", {"idempotency_key": key, "items": [{"product_id": pid, "qty": 1, "unit_price": 0}]})
    order_id = r.json()["order"]["id"]

    evt = {
        "event_id": f"evt_{uuid.uuid4().hex[:10]}",
        "event": "payment.captured",
        "order_id": order_id,
        "payment_id": f"pay_{uuid.uuid4().hex[:10]}",
    }
    raw = json.dumps(evt).encode()

    # Wrong signature must be rejected
    bad = _post_raw("/poc/webhook", raw, headers={"Content-Type": "application/json", "X-Signature": "WRONG"})
    assert bad.status_code == 401, f"unsigned webhook must be 401, got {bad.status_code}"

    # Order still pending, stock unchanged
    o = _get(f"/poc/order/{order_id}").json()
    assert o["status"] == "pending"
    prod = _get(f"/poc/product/{pid}").json()
    assert prod["stock"] == 3
    print("[PASS] 2. Webhook without valid signature cannot confirm order")


def test_3_webhook_captured_confirms_and_decrements():
    pid = seed_product(stock=3)
    key = f"idem_{uuid.uuid4().hex[:10]}"
    r = _post("/poc/order", {"idempotency_key": key, "items": [{"product_id": pid, "qty": 2, "unit_price": 0}]})
    order_id = r.json()["order"]["id"]

    evt = {
        "event_id": f"evt_{uuid.uuid4().hex[:10]}",
        "event": "payment.captured",
        "order_id": order_id,
        "payment_id": f"pay_{uuid.uuid4().hex[:10]}",
    }
    raw = json.dumps(evt).encode()
    r = _post_raw("/poc/webhook", raw, headers={"Content-Type": "application/json", "X-Signature": _sign(raw)})
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "confirmed"

    o = _get(f"/poc/order/{order_id}").json()
    assert o["status"] == "confirmed"
    prod = _get(f"/poc/product/{pid}").json()
    assert prod["stock"] == 1, f"expected stock 1, got {prod['stock']}"

    # Replay same event_id — must be a no-op
    r2 = _post_raw("/poc/webhook", raw, headers={"Content-Type": "application/json", "X-Signature": _sign(raw)})
    assert r2.status_code == 200
    body = r2.json()
    assert body.get("replayed") is True or body.get("terminal") is True
    prod = _get(f"/poc/product/{pid}").json()
    assert prod["stock"] == 1, f"replay decremented again! stock={prod['stock']}"
    print("[PASS] 3. Signed captured webhook confirms + atomic decrement + replay-safe")


def test_4_webhook_failed_no_decrement():
    pid = seed_product(stock=4)
    key = f"idem_{uuid.uuid4().hex[:10]}"
    r = _post("/poc/order", {"idempotency_key": key, "items": [{"product_id": pid, "qty": 2, "unit_price": 0}]})
    order_id = r.json()["order"]["id"]

    evt = {
        "event_id": f"evt_{uuid.uuid4().hex[:10]}",
        "event": "payment.failed",
        "order_id": order_id,
        "payment_id": f"pay_{uuid.uuid4().hex[:10]}",
    }
    raw = json.dumps(evt).encode()
    r = _post_raw("/poc/webhook", raw, headers={"Content-Type": "application/json", "X-Signature": _sign(raw)})
    assert r.status_code == 200 and r.json()["status"] == "payment_failed", r.text

    o = _get(f"/poc/order/{order_id}").json()
    assert o["status"] == "payment_failed"
    prod = _get(f"/poc/product/{pid}").json()
    assert prod["stock"] == 4, f"failed payment must not decrement — stock={prod['stock']}"
    print("[PASS] 4. payment.failed does not decrement stock")


def test_5_last_unit_concurrency():
    """Simulate 5 different orders trying to confirm on stock=1. Only 1 must succeed."""
    pid = seed_product(stock=1)
    order_ids = []
    for _ in range(5):
        k = f"idem_{uuid.uuid4().hex[:10]}"
        r = _post("/poc/order", {"idempotency_key": k, "items": [{"product_id": pid, "qty": 1, "unit_price": 0}]})
        # Note: order creation succeeds for all — this is by design. Stock is only
        # guarded at webhook confirm time (atomic decrement).
        assert r.status_code == 200, r.text
        order_ids.append(r.json()["order"]["id"])

    async def fire(oid):
        import httpx
        evt = {
            "event_id": f"evt_{uuid.uuid4().hex[:10]}",
            "event": "payment.captured",
            "order_id": oid,
            "payment_id": f"pay_{uuid.uuid4().hex[:10]}",
        }
        raw = json.dumps(evt).encode()
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.post(
                f"{API}/poc/webhook",
                content=raw,
                headers={"Content-Type": "application/json", "X-Signature": _sign(raw)},
            )
            return r.status_code, (r.json() if r.headers.get("content-type", "").startswith("application/json") else r.text)

    async def run():
        return await asyncio.gather(*(fire(o) for o in order_ids), return_exceptions=True)

    results = asyncio.run(run())
    confirmed = sum(1 for r in results if isinstance(r, tuple) and r[0] == 200 and isinstance(r[1], dict) and r[1].get("status") == "confirmed")
    conflicted = sum(1 for r in results if isinstance(r, tuple) and r[0] == 409)
    print(f"    parallel results: {results}")
    assert confirmed == 1, f"exactly 1 confirmation expected, got {confirmed}"
    assert conflicted == 4, f"exactly 4 conflicts expected, got {conflicted}"

    prod = _get(f"/poc/product/{pid}").json()
    assert prod["stock"] == 0, f"stock must be 0, got {prod['stock']}"
    print("[PASS] 5. Last-unit concurrency safe (exactly 1 winner, 4 conflicts)")


if __name__ == "__main__":
    print("=" * 60)
    print("Sukhmal Dry Fruits Korner — Phase 1 POC: Payment Core")
    print("=" * 60)
    try:
        test_1_idempotent_order_creation()
        test_2_webhook_signature_required()
        test_3_webhook_captured_confirms_and_decrements()
        test_4_webhook_failed_no_decrement()
        test_5_last_unit_concurrency()
        print("\n" + "=" * 60)
        print("ALL PHASE 1 POC ASSERTIONS PASSED")
        print("=" * 60)
    except AssertionError as e:
        print(f"\n[FAIL] {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] {type(e).__name__}: {e}")
        sys.exit(2)
