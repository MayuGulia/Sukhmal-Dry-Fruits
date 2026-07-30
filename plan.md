# plan.md — Sukhmal Dry Fruits Korner (Full‑Stack E‑commerce)

## 1) Objectives
- Deliver a **production-grade, secure, full-stack** e-commerce site matching **23 hi‑fi screens 1:1** across **52 routes**.
- Implement **mobile-first structural responsiveness** (Mobile <640, Tablet 640–1024, Desktop >1024) incl. bottom tab bar, drawers/sheets, stepper variants, collapsible summaries.
- Prove the **core revenue workflow** is correct: **checkout → payment → webhook-confirmed order → atomic stock updates** (Razorpay-shaped stub now, real keys later).
- Build **Firebase-shaped auth** with mocked JWT now (test creds documented), swap-in Firebase later with minimal change.
- Add AI features using Emergent key: **Gift Advisor (chat)** + **Hamper image generation (Nano Banana)**.

---

## 2) Implementation Steps

### Phase 1 — Core POC (Isolation): Payments/Webhooks + Atomic Inventory
**Goal:** Prove hardest failure-prone flow works before building the full app around it.
- Websearch best practices: Razorpay hosted checkout + webhook verification + idempotency + order states.
- Backend POC (FastAPI + Mongo):
  - Models: Product (variants/stock), Cart, Order (pending/confirmed/payment_failed), InventoryLedger.
  - Endpoint: `POST /poc/order/create` (idempotency key) → creates **pending** order.
  - Endpoint: `POST /poc/payment/webhook` (signature-verified stub) → transitions order state; on success run **Mongo transaction** to decrement stock + finalize totals.
  - Endpoint: `GET /poc/order/{id}` → verify status.
- Python test script (isolated):
  - Seed 1 product with stock=1; create order twice (double-click simulation) must return same order.
  - Trigger webhook success; assert order confirmed + stock decremented to 0.
  - Trigger webhook replay; assert idempotent (no double decrement).
  - Repeat with webhook failure; assert no decrement.
- Fix until green; keep this “payment core” as the app’s production-shaped foundation.

**User stories (Phase 1)**
1. As a system, I confirm an order only after a server webhook so redirects can’t spoof payment.
2. As a buyer, double-clicking “Place Order” never creates duplicate orders.
3. As a buyer, if payment fails, my stock is not reserved incorrectly.
4. As an operator, webhook retries do not corrupt stock.
5. As a buyer, last-unit stock cannot be oversold under concurrency.

---

### Phase 2 — V1 App Development (MVP end-to-end, mocked auth + mock data)
**Goal:** Build the full experience quickly with correct UI + routing + state handling.
- Setup
  - React + shadcn/ui theme tokens to match: primary `#6C3C29`, bg `#F3E5D7`, accent `#D2A06E`, rounded cards, soft shadows.
  - Global layout: utility bar, header/nav, footer, WhatsApp float (reposition on mobile).
  - Responsive scaffolding: hamburger drawer, mobile bottom tab bar, filter sheet, PDP carousel.
- Frontend: implement all **customer-facing routes** with static/dummy data but real components/state
  - Home, Search, PLP (filters/sort), PDP (tabs + tables), Gift Hampers list/detail, Wedding, Corporate, Festival, Offers.
  - Build Your Own Hamper wizard (6 steps) with stepper variants + budget rules.
  - Cart, Checkout, Order Success/Failed, Track Order (UI).
  - Auth pages (Login/Signup/Forgot/OTP) as mocked flows.
  - Content pages: About, Contact, Store Locator, Blog list/article, Careers, FAQs, Policies, 404.
- Backend: wire minimal APIs for listing + cart basics
  - Catalog read APIs (categories/products/hampers), search.
  - Cart APIs (guest token/session id) and coupon validation stub.
- Conclude with 1 round of end-to-end testing via testing_agent_v3.

**User stories (Phase 2)**
1. As a shopper, I can browse categories, filter, and open a product page on mobile and desktop.
2. As a shopper, I can build a hamper across 6 steps with a live budget summary.
3. As a shopper, I can add items to cart and see accurate totals incl. GST.
4. As a shopper, I can complete a mocked checkout flow and reach success/failure pages.
5. As a shopper, the site navigation adapts structurally on mobile (bottom tabs, sheets, drawers).

---

### Phase 3 — Core Commerce Wiring (real data flow, still mocked JWT)
**Goal:** Turn V1 UI into a working commerce app using the already-proven payment core.
- Auth (mocked JWT, Firebase-shaped)
  - Implement mock login issuing JWT + user id; store test creds in `/app/memory/test_credentials.md`.
  - Generic auth errors (no enumeration) and rate limiting for auth endpoints.
- Cart/Checkout/Orders
  - Connect cart to checkout; address management (basic) for checkout.
  - Enforce serviceable pincode logic (config-driven) + validation.
  - Integrate Phase 1 payment core into `/checkout` backend flow.
- Security foundations
  - Object-level authorization for all user resources.
  - Input validation + sanitization; strict CORS; secure headers.
- Conclude with testing_agent_v3 (checkout + stock + idempotency paths).

**User stories (Phase 3)**
1. As a logged-in user, I can manage my cart across sessions.
2. As a user, checkout blocks unserviceable pincodes with a clear fix path.
3. As a user, payment failure allows retry without creating a new order.
4. As a user, my orders are private and cannot be accessed by other users.
5. As a user, I never lose cart/checkout state if a session refresh occurs.

---

### Phase 4 — My Account + Tracking + Returns/Cancels
**Goal:** Complete post-purchase experience + public tracking.
- My Account routes: dashboard, wishlist, orders list/detail, order history, addresses, payment methods (stub), loyalty (stub), settings.
- Track Order (public): order-id lookup with safe disclosure; timeline updates.
- Return/Cancel requests: status rules (pre-ship cancel vs post-ship return) + admin visibility.
- Conclude with testing_agent_v3 (orders, tracking, return flow).

**User stories (Phase 4)**
1. As a buyer, I can track my order publicly with just Order ID.
2. As a buyer, I can view order details, invoice, and reorder.
3. As a buyer, I can request cancel/return based on shipment status.
4. As a buyer, I can manage saved addresses for faster checkout.
5. As a buyer, wishlist items can be moved to cart quickly.

---

### Phase 5 — Admin Panel (/admin/*) + Management Modules
**Goal:** Production-shaped admin with strict access boundaries.
- Admin guard: silent redirect to customer login for non-admin; per-route check.
- Admin modules: dashboard, products CRUD, orders management (status updates), inventory adjustments, customers read-only, coupons/offers CRUD.
- Ensure no leakage of sensitive data; audit-friendly logs.
- Conclude with testing_agent_v3 (admin access + CRUD + order status propagation).

**User stories (Phase 5)**
1. As an admin, I can manage products/variants/stock without breaking past orders.
2. As an admin, I can update order status and customers see tracking updates.
3. As an admin, I can approve/reject return requests.
4. As a non-admin, I’m silently redirected away from admin routes.
5. As an admin, I can create coupons and validation works server-side.

---

### Phase 6 — AI Features (Emergent Key): Gift Advisor + Hamper Image Gen
**Goal:** Add AI without compromising performance/security.
- Gift Advisor: chat widget + backend proxy using LlmChat (default Gemini 2.5 Flash), guardrails + rate limit.
- Hamper image generation: Nano Banana endpoint; store generated images (or signed URLs) and display on homepage/preview.
- Conclude with testing_agent_v3 (AI calls, UI states, rate limits).

**User stories (Phase 6)**
1. As a buyer, I can ask for gift recommendations by budget/occasion.
2. As a buyer, I can generate a hamper image preview from text.
3. As a buyer, AI failures show friendly retries without breaking the page.
4. As an operator, AI usage is rate-limited to prevent abuse.
5. As a buyer, AI responses feel tailored to Indian gifting occasions.

---

### Phase 7 — Hardening + Swap-in Readiness (Firebase + Razorpay)
**Goal:** Make swapping real Firebase/Razorpay keys a config-only change.
- Firebase integration layer: replace mock JWT with Firebase Auth + custom claims; keep API contracts stable.
- Razorpay hosted checkout: replace stub with real order creation + webhook signature verification.
- Final security review: rate limits, headers, audit logs, error handling.
- Full regression test via testing_agent_v3.

**User stories (Phase 7)**
1. As an operator, adding Razorpay keys enables real payments without code refactor.
2. As an operator, adding Firebase config enables real auth without changing UI flows.
3. As a buyer, payment states (success/fail/pending) are always accurate.
4. As a buyer, my data remains private across all account APIs.
5. As a buyer, the site stays fast and stable on mobile.

---

## 3) Next Actions
1. Implement Phase 1 POC backend + Python test script; run until green.
2. Scaffold React app + shadcn theme + responsive layout primitives.
3. Create route skeletons for all 52 pages and plug in hi-fi matching components.
4. Wire minimal catalog/cart APIs; then integrate payment core into checkout.

---

## 4) Success Criteria
- Phase 1: POC script passes: webhook-confirmed order + idempotency + atomic stock decrement + webhook replay safety.
- UI: 23 screens matched 1:1; mobile structural changes implemented and verified at 375/768/1440 widths.
- Security: All strict requirements satisfied (webhook-only confirmation, object auth, silent admin redirect, rate limits, generic auth errors, validation/sanitization, idempotency).
- Commerce: End-to-end flow works (browse → add to cart → checkout → (stub) payment → webhook → order success + tracking).
- Admin: Protected `/admin/*` works; status updates reflect in Track Order.
- AI: Gift Advisor + Nano Banana image gen functional with safe fallbacks.
