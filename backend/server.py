"""Sukhmal Dry Fruits Korner - FastAPI backend.

Phase 1 (this file): Payment Core POC
- Products with atomic stock decrement
- Idempotent Order creation
- Webhook-driven order confirmation (single source of truth)
- Webhook replay protection

All routes are under /api and will scale into the full commerce app in Phase 2+.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Request, status
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import hmac
import hashlib
import uuid
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ---------- Mongo ----------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ---------- App ----------
app = FastAPI(title="Sukhmal Dry Fruits Korner API", version="0.1.0")
api_router = APIRouter(prefix="/api")

WEBHOOK_SECRET = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "dev-webhook-secret")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ==========================================================
# Health
# ==========================================================
@api_router.get("/")
async def root():
    return {"message": "Sukhmal Dry Fruits Korner API", "status": "ok"}


# ==========================================================
# Phase 1 POC Models
# ==========================================================
class PocProduct(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    price: float  # in INR (₹), stored as major unit
    stock: int
    created_at: str = Field(default_factory=now_iso)


class PocOrderItem(BaseModel):
    product_id: str
    qty: int
    unit_price: float


OrderStatus = Literal["pending", "confirmed", "payment_failed", "cancelled"]


class PocOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"ord_{uuid.uuid4().hex[:12]}")
    idempotency_key: str
    items: List[PocOrderItem]
    subtotal: float
    gst: float
    total: float
    status: OrderStatus = "pending"
    payment_id: Optional[str] = None
    webhook_events: List[str] = Field(default_factory=list)  # event ids already applied
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class PocCreateOrderReq(BaseModel):
    idempotency_key: str
    items: List[PocOrderItem]


class PocWebhookEvent(BaseModel):
    event_id: str  # unique per webhook delivery
    event: Literal["payment.captured", "payment.failed"]
    order_id: str  # our order id
    payment_id: str


# ==========================================================
# Helpers
# ==========================================================
def compute_totals(items: List[PocOrderItem]) -> Dict[str, float]:
    subtotal = sum(i.qty * i.unit_price for i in items)
    gst = round(subtotal * 0.05, 2)  # 5% GST for dry fruits
    total = round(subtotal + gst, 2)
    return {"subtotal": round(subtotal, 2), "gst": gst, "total": total}


def sign_payload(body: bytes, secret: str) -> str:
    return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


# ==========================================================
# Phase 1 POC endpoints
# ==========================================================
@api_router.post("/poc/product")
async def poc_create_product(p: PocProduct):
    doc = p.model_dump()
    await db.poc_products.insert_one(doc)
    return {"id": p.id, "stock": p.stock}


@api_router.get("/poc/product/{product_id}")
async def poc_get_product(product_id: str):
    doc = await db.poc_products.find_one({"id": product_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "product not found")
    return doc


@api_router.post("/poc/order")
async def poc_create_order(req: PocCreateOrderReq):
    """Idempotent order creation.

    If an order with the same idempotency_key exists, return it (do NOT create a new one).
    Order starts in `pending`. Stock is NOT decremented here — only on webhook success.
    """
    existing = await db.poc_orders.find_one({"idempotency_key": req.idempotency_key}, {"_id": 0})
    if existing:
        return {"idempotent": True, "order": existing}

    # Enrich unit_price from DB to prevent client-side price tampering
    enriched: List[PocOrderItem] = []
    for it in req.items:
        prod = await db.poc_products.find_one({"id": it.product_id}, {"_id": 0})
        if not prod:
            raise HTTPException(400, f"product {it.product_id} not found")
        if prod["stock"] < it.qty:
            raise HTTPException(409, f"insufficient stock for {it.product_id}")
        enriched.append(PocOrderItem(product_id=it.product_id, qty=it.qty, unit_price=prod["price"]))

    totals = compute_totals(enriched)
    order = PocOrder(idempotency_key=req.idempotency_key, items=enriched, **totals)
    await db.poc_orders.insert_one(order.model_dump())
    return {"idempotent": False, "order": order.model_dump()}


@api_router.get("/poc/order/{order_id}")
async def poc_get_order(order_id: str):
    doc = await db.poc_orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "order not found")
    return doc


@api_router.post("/poc/webhook")
async def poc_webhook(request: Request):
    """Payment webhook — the ONLY path that confirms an order.

    - Verifies HMAC-SHA256 signature (X-Signature header)
    - Idempotent: replayed events (same event_id) are no-ops
    - Atomic stock decrement via conditional findOneAndUpdate (works on standalone Mongo)
    - Rolls back all decrements if any item runs out mid-way (extremely rare — but safe)
    """
    raw = await request.body()
    sig = request.headers.get("X-Signature", "")
    expected = sign_payload(raw, WEBHOOK_SECRET)
    if not hmac.compare_digest(sig, expected):
        raise HTTPException(401, "bad signature")

    try:
        event = PocWebhookEvent.model_validate_json(raw)
    except Exception:
        raise HTTPException(400, "bad payload")

    order = await db.poc_orders.find_one({"id": event.order_id})
    if not order:
        raise HTTPException(404, "order not found")

    # Idempotency: same event applied twice is a no-op
    if event.event_id in order.get("webhook_events", []):
        return {"replayed": True, "status": order["status"]}

    # Terminal states cannot be re-transitioned
    if order["status"] in ("confirmed", "cancelled"):
        # still record the event so future replays are no-op
        await db.poc_orders.update_one(
            {"id": event.order_id},
            {"$addToSet": {"webhook_events": event.event_id}, "$set": {"updated_at": now_iso()}},
        )
        return {"terminal": True, "status": order["status"]}

    if event.event == "payment.failed":
        await db.poc_orders.update_one(
            {"id": event.order_id},
            {
                "$set": {
                    "status": "payment_failed",
                    "payment_id": event.payment_id,
                    "updated_at": now_iso(),
                },
                "$addToSet": {"webhook_events": event.event_id},
            },
        )
        return {"status": "payment_failed"}

    # payment.captured: atomically decrement stock item-by-item
    decremented: List[Dict[str, int]] = []
    for it in order["items"]:
        res = await db.poc_products.find_one_and_update(
            {"id": it["product_id"], "stock": {"$gte": it["qty"]}},
            {"$inc": {"stock": -it["qty"]}},
            return_document=True,
        )
        if not res:
            # Roll back everything we already decremented in this webhook
            for d in decremented:
                await db.poc_products.update_one(
                    {"id": d["product_id"]},
                    {"$inc": {"stock": d["qty"]}},
                )
            # Do NOT mark confirmed. Do NOT store event_id — allow retry.
            raise HTTPException(409, "insufficient stock during confirmation")
        decremented.append({"product_id": it["product_id"], "qty": it["qty"]})

    await db.poc_orders.update_one(
        {"id": event.order_id},
        {
            "$set": {
                "status": "confirmed",
                "payment_id": event.payment_id,
                "updated_at": now_iso(),
            },
            "$addToSet": {"webhook_events": event.event_id},
        },
    )
    return {"status": "confirmed"}


# ==========================================================
# Phase 2 \u2014 Catalog + Cart + Auth APIs
# ==========================================================
from typing import Any as _Any


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    slug: str
    name: str
    category: str
    tagline: str = ""
    price: float
    mrp: float = 0
    rating: float = 4.5
    reviews: int = 0
    bestseller: bool = False
    natural: bool = False
    images: List[str] = Field(default_factory=list)
    variants: List[Dict[str, _Any]] = Field(default_factory=list)
    stock: int = 100
    created_at: str = Field(default_factory=now_iso)


class Hamper(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    slug: str
    name: str
    tier: str
    weight: str
    price: float
    mrp: float = 0
    image: str
    tags: List[str] = Field(default_factory=list)
    contents: List[str] = Field(default_factory=list)
    stock: int = 100


@api_router.get("/catalog/categories")
async def list_categories():
    docs = await db.categories.find({}, {"_id": 0}).to_list(50)
    return docs


@api_router.get("/catalog/products")
async def list_products(category: Optional[str] = None, q: Optional[str] = None, limit: int = 100):
    query: Dict[str, _Any] = {}
    if category and category != "all":
        query["category"] = category
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"tagline": {"$regex": q, "$options": "i"}},
        ]
    docs = await db.products.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return docs


@api_router.get("/catalog/product/{slug}")
async def get_product(slug: str):
    doc = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "product not found")
    return doc


@api_router.get("/catalog/hampers")
async def list_hampers(tag: Optional[str] = None, limit: int = 100):
    query: Dict[str, _Any] = {}
    if tag:
        query["tags"] = tag
    docs = await db.hampers.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return docs


@api_router.get("/catalog/hamper/{slug}")
async def get_hamper(slug: str):
    doc = await db.hampers.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "hamper not found")
    return doc


# ---------- Coupon validation ----------
class CouponReq(BaseModel):
    code: str
    subtotal: float


@api_router.post("/checkout/coupon")
async def validate_coupon(req: CouponReq):
    code = req.code.strip().upper()
    if code == "WELCOME10":
        return {"ok": True, "code": code, "type": "percent", "value": 10, "discount": round(req.subtotal * 0.10, 2)}
    if code == "FESTIVE500":
        if req.subtotal < 1500:
            return {"ok": False, "message": "Minimum order \u20b91,500 for this coupon"}
        return {"ok": True, "code": code, "type": "flat", "value": 500, "discount": 500}
    if code == "BULK25":
        if req.subtotal < 10000:
            return {"ok": False, "message": "Minimum order \u20b910,000 for this coupon"}
        return {"ok": True, "code": code, "type": "percent", "value": 25, "discount": round(req.subtotal * 0.25, 2)}
    return {"ok": False, "message": "Invalid coupon code"}


# ---------- Pincode serviceability ----------
@api_router.get("/checkout/pincode/{pincode}")
async def check_pincode(pincode: str):
    if not pincode.isdigit() or len(pincode) != 6:
        return {"ok": False, "message": "Enter a valid 6-digit pincode"}
    # Deny a few specific pincodes to demonstrate the flow
    unserviceable = {"110099", "400099", "999999"}
    if pincode in unserviceable:
        return {"ok": False, "message": "We don't deliver to this pincode yet"}
    return {"ok": True, "eta": "2\u20134 business days", "same_day_eligible": pincode.startswith(("110", "122", "400"))}


# ---------- Order lookup for public tracking ----------
@api_router.get("/tracking/{order_id}")
async def public_track(order_id: str):
    # Public but safe \u2014 no user PII beyond what's on the order label
    if not order_id.startswith(("ord_",)):
        raise HTTPException(404, "Order not found, check your ID")
    # Return a deterministic timeline for demo
    return {
        "id": order_id,
        "status": "shipped",
        "recipient_name": "**** ****",
        "recipient_city": "New Delhi",
        "amount": 1499,
        "partner": "Blue Dart",
        "awb": "BDT" + order_id[-9:].upper(),
        "timeline": [
            {"at": "Mon 10:15 AM", "text": "Order confirmed \u2014 payment received"},
            {"at": "Mon 4:30 PM",  "text": "Packing started at Delhi facility"},
            {"at": "Tue 9:00 AM",  "text": "Order packed & handed to Blue Dart"},
            {"at": "Wed 6:00 AM",  "text": "Shipment departed Delhi hub"},
        ],
    }


# ---------- Contact form ----------
class ContactMessage(BaseModel):
    first: str
    last: str
    email: str
    phone: str = ""
    subject: str = ""
    query_type: str = "General"
    order_id: str = ""
    message: str
    consent: bool = False


@api_router.post("/contact")
async def contact_submit(msg: ContactMessage):
    if not msg.consent:
        raise HTTPException(400, "Consent to privacy policy is required")
    # basic XSS/injection-safe: strip < >
    doc = msg.model_dump()
    for k in ("first", "last", "subject", "message"):
        doc[k] = doc[k].replace("<", "").replace(">", "")
    doc["created_at"] = now_iso()
    await db.contact_messages.insert_one(doc)
    return {"ok": True}


# ---------- Wedding / Corporate enquiry ----------
class BulkEnquiry(BaseModel):
    name: str
    phone: str
    email: str = ""
    occasion: str = ""
    qty: str = ""
    notes: str = ""


@api_router.post("/enquiry/bulk")
async def bulk_enquiry(msg: BulkEnquiry):
    doc = msg.model_dump()
    doc["created_at"] = now_iso()
    await db.bulk_enquiries.insert_one(doc)
    return {"ok": True}


# ---------- Seed catalog (idempotent) ----------
@api_router.post("/seed/catalog")
async def seed_catalog():
    if await db.products.count_documents({}) > 0:
        return {"seeded": False, "reason": "already exists"}
    # Import the mock data directly \u2014 for MVP we seed from a static list.
    products_seed = [
        {"id": "p_almonds_premium", "slug": "california-almonds-premium", "name": "California Almonds", "category": "nuts", "tagline": "Premium Grade A", "price": 449, "mrp": 599, "rating": 4.8, "reviews": 1284, "bestseller": True, "natural": True, "stock": 120},
        {"id": "p_cashews", "slug": "kaju-w320-cashews", "name": "W320 Cashews", "category": "nuts", "tagline": "Whole & Crunchy", "price": 549, "mrp": 699, "rating": 4.9, "reviews": 942, "bestseller": True, "stock": 80},
        {"id": "p_pistachios", "slug": "roasted-salted-pistachios", "name": "Roasted Salted Pistachios", "category": "nuts", "tagline": "Iranian premium", "price": 699, "mrp": 899, "rating": 4.7, "reviews": 611, "stock": 60},
        {"id": "p_medjool", "slug": "medjool-dates", "name": "Medjool Dates", "category": "dates", "tagline": "Jordanian, king of dates", "price": 799, "mrp": 999, "rating": 4.9, "reviews": 508, "bestseller": True, "stock": 40},
    ]
    for p in products_seed:
        p["created_at"] = now_iso()
    await db.products.insert_many(products_seed)
    return {"seeded": True, "count": len(products_seed)}


# ==========================================================
# Register
# ==========================================================
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
