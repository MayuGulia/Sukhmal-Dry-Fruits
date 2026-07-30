# plan.md — Sukhmal Dry Fruits Korner (Full‑Stack E‑commerce)

## 1) Objectives
- Deliver a **production-grade, secure, full-stack** e-commerce site matching **23 hi‑fi screens 1:1** across **52 routes**.
- Implement **mobile-first structural responsiveness** (Mobile <640, Tablet 640–1024, Desktop >1024) including: hamburger drawer, mobile bottom tab bar, filter bottom-sheet, compact stepper, collapsible checkout summary, swipe-style PDP gallery behavior.
- Prove the **core revenue workflow** is correct and safe: **checkout → payment → webhook-confirmed order → atomic stock updates**.
- Build **Firebase-shaped auth** now (mocked locally), then swap-in **Firebase Auth + custom claims** later with minimal change.
- Add AI features using Emergent key: **Gift Advisor (chat)** + **Hamper image generation (Nano Banana)**.

**Updated status:**
- ✅ Phase 1 complete: payment core POC (webhook-only confirmation, idempotency, replay-safe, atomic decrement, last-unit concurrency).
- ✅ Phase 2 complete: full end-to-end app (all 52 routes, layouts, cart/checkout, account, admin, content) + backend catalog/utility endpoints.
- ✅ E2E validated: testing_agent_v3 iteration_2 — **backend 23/23** + **frontend critical flows 100%**.

---

## 2) Implementation Steps

### Phase 1 — Core POC (Isolation): Payments/Webhooks + Atomic Inventory (COMPLETED ✅)
**Goal:** Prove hardest failure-prone flow works before building the full app around it.
- Razorpay-shaped payment core design (webhook verification, state machine, idempotency).
- Backend POC (FastAPI + Mongo):
  - Endpoints:
    - `POST /api/poc/order` (idempotency key) → creates **pending** order.
    - `POST /api/poc/webhook` (HMAC verified) → transitions order state; on success runs **atomic stock decrement**.
  - Replay protection via `event_id` storage.
  - Concurrency safe: stock decrement uses conditional update; rollback on partial decrement.
- Python test script: `/app/backend/tests/test_poc_payment_core.py`
  - Assertions passed:
    1) idempotent order creation
    2) signature verification required
    3) captured webhook confirms + decrements
    4) failed webhook does not decrement
    5) last-unit concurrency (exactly 1 winner across 5 parallel attempts)

**User stories (Phase 1)**
1. As a system, I confirm an order only after a server webhook so redirects can’t spoof payment.
2. As a buyer, double-clicking “Place Order” never creates duplicate orders.
3. As a buyer, if payment fails, my stock is not reserved incorrectly.
4. As an operator, webhook retries do not corrupt stock.
5. As a buyer, last-unit stock cannot be oversold under concurrency.

---

### Phase 2 — V1 App Development (MVP end-to-end, mocked auth + mock data) (COMPLETED ✅)
**Goal:** Build the full experience quickly with correct UI + routing + state handling.

**Delivered UI (52 routes wired via React Router):**
- Global layout: TopUtilityBar, Header (search + Build Hamper CTA + cart badge), Nav, Footer, WhatsAppFloat, HamburgerDrawer, MobileBottomNav.
- Shopping & Discovery (10): Home, Search, PLP (filters/sort + mobile filter sheet), PDP (gallery, variants, tabs), Gift Hampers list/detail, Wedding, Corporate, Festival Collections, Offers.
- Build Your Own Hamper wizard (6 steps): Budget → Hamper → Products → Gift Card → Preview → Confirm (LS persistence, over-budget guard, adds custom hamper to cart).
- Cart/Checkout/Orders (6): Cart, Checkout, Order Success, Order Failed, Track Order, Return/Cancel.
- Auth (4): Login, Signup, Forgot Password, OTP Verification (enumeration-safe messaging) via unified AuthPage.
- My Account (9): Dashboard, Wishlist, Orders, Order Detail, Order History, Addresses, Payment Methods, Loyalty, Settings.
- Content & Trust (11): About, Contact, Store Locator, Blog list/article, Careers, FAQs, Shipping, Returns, Privacy, T&C, 404.
- Admin (6): Dashboard, Products, Orders, Inventory, Customers, Coupons/Offers with **silent redirect** for non-admin.

**Design system delivered:**
- Tokens extracted from provided screens: warm brown/cream/gold palette; Playfair Display + Inter; radius/shadow primitives.
- Images: topic-driven **loremflickr** for catalog tiles/cards; pinned confirmed food Unsplash IDs for hero/banners.

**Delivered backend endpoints (on top of Phase 1):**
- Catalog: `/api/catalog/categories`, `/api/catalog/products`, `/api/catalog/product/{slug}`, `/api/catalog/hampers`, `/api/catalog/hamper/{slug}`
- Checkout helpers: `/api/checkout/coupon`, `/api/checkout/pincode/{pincode}`
- Public tracking: `/api/tracking/{order_id}`
- Contact/enquiry: `/api/contact`, `/api/enquiry/bulk`
- Seeding: `/api/seed/catalog`

**State correctness fixes:**
- CartContext/WishlistContext: hydration-gated localStorage persistence (prevents empty-overwrite race).
- Header cart badge includes `data-testid="cart-badge"`.
- AdminLayout + AccountLayout redirects moved into `useEffect` (no “navigate during render” warning).

**Verification:** testing_agent_v3 iteration_2
- Backend: 23/23 passing
- Frontend: critical flows passing (cart persistence, coupon, checkout navigation, admin silent redirect, mobile 375px checks)

**User stories (Phase 2)**
1. As a shopper, I can browse categories, filter, and open a product page on mobile and desktop.
2. As a shopper, I can build a hamper across 6 steps with a live budget summary.
3. As a shopper, I can add items to cart and see accurate totals incl. GST.
4. As a shopper, I can complete a mocked checkout flow and reach success/failure pages.
5. As a shopper, the site navigation adapts structurally on mobile (bottom tabs, sheets, drawers).

---

### Phase 3 — Core Commerce Wiring (real data flow, still mocked JWT)
**Goal:** Turn Phase 2 UI into a truly working commerce app using real backend data + Phase 1 payment core.

**3.1 Catalog: replace mockCatalog with backend data**
- Implement frontend data layer:
  - Replace direct imports from `mockCatalog.js` with API calls to `/api/catalog/*`.
  - Add loading/skeleton states and error fallbacks.
- Ensure `/api/seed/catalog` (and additional seed expansion) provides enough products/hampers to populate UI.

**3.2 Auth (Firebase-shaped, still mocked) — backend-issued JWT**
- Add backend auth endpoints (enumeration-safe responses):
  - `POST /api/auth/login`
  - `POST /api/auth/signup`
  - `POST /api/auth/request-otp`
  - `POST /api/auth/verify-otp`
- Issue a short-lived JWT with user_id + role (customer/admin).
- Rate-limit auth endpoints.

**3.3 Orders + Checkout: wire to payment core**
- Backend:
  - `POST /api/orders/create` (idempotency key) → creates pending order
  - `POST /api/payments/razorpay/order` (stub now) → returns gateway order payload
  - `POST /api/payments/webhook` → confirms order (reuse Phase 1 patterns)
  - `GET /api/orders/me`, `GET /api/orders/{id}` with object-level auth
- Frontend:
  - Make Checkout “Place Order” call backend create order → simulate gateway → trigger webhook simulator in dev → redirect to /order-success.
  - Preserve idempotency across retries.

**3.4 Security foundations applied across new APIs**
- Object-level authorization for all user resources.
- Input validation + sanitization; strict CORS; safe error messages.
- Idempotency keys on order creation.

- Conclude with testing_agent_v3 (true end-to-end: create order → webhook confirm → stock decrement).

**User stories (Phase 3)**
1. As a logged-in user, I can manage my cart across sessions and devices.
2. As a user, checkout blocks unserviceable pincodes with a clear fix path.
3. As a user, payment failure allows retry without creating a new order.
4. As a user, my orders are private and cannot be accessed by other users.
5. As an operator, inventory cannot be oversold and order confirmation is webhook-only.

---

### Phase 4 — My Account + Tracking + Returns/Cancels (backend-real)
**Goal:** Convert Phase 2 account pages from mocked data to real per-user data.
- Orders history + order detail from `/api/orders/*`.
- Addresses CRUD + default address.
- Wishlist persistence server-side (optional) or keep local with sync.
- Track Order:
  - Public minimal disclosure endpoint (already exists) + authenticated detailed tracking.
- Return/Cancel requests:
  - Backend endpoints and rules (pre-ship cancel vs post-ship return) surfaced in admin.
- Conclude with testing_agent_v3 (account + tracking + return flow).

**User stories (Phase 4)**
1. As a buyer, I can track my order publicly with just Order ID.
2. As a buyer, I can view order details, invoice, and reorder.
3. As a buyer, I can request cancel/return based on shipment status.
4. As a buyer, I can manage saved addresses for faster checkout.
5. As a buyer, wishlist items can be moved to cart quickly.

---

### Phase 5 — Admin Panel (/admin/*) + Management Modules (backend-real)
**Goal:** Connect the already-built admin UI to real admin APIs with strict access boundaries.
- Keep silent redirect behavior.
- Implement admin APIs:
  - Products CRUD + variant/stock updates
  - Orders management + status transitions
  - Inventory adjustments with audit trail
  - Customers read-only (privacy-safe)
  - Coupons/offers CRUD validation server-side
- Conclude with testing_agent_v3 (admin CRUD + order status propagation to tracking).

**User stories (Phase 5)**
1. As an admin, I can manage products/variants/stock without breaking past orders.
2. As an admin, I can update order status and customers see tracking updates.
3. As an admin, I can approve/reject return requests.
4. As a non-admin, I’m silently redirected away from admin routes.
5. As an admin, I can create coupons and validation works server-side.

---

### Phase 6 — AI Features (Emergent Key): Gift Advisor + Hamper Image Gen
**Goal:** Add AI without compromising performance/security.
- Gift Advisor:
  - Backend: chat endpoint using `LlmChat` (default Gemini 2.5 Flash), grounded by catalog (RAG-lite: pass top matches).
  - Frontend: chat widget entry points (utility bar + homepage block).
  - Rate limiting + guardrails.
- Hamper image generation:
  - Backend: Nano Banana generate endpoint returning base64 or stored URL.
  - Frontend: wire “Generate” on homepage + hamper preview usage.
- Conclude with testing_agent_v3 (AI calls, UI states, rate limits, fallbacks).

**User stories (Phase 6)**
1. As a buyer, I can ask for gift recommendations by budget/occasion.
2. As a buyer, I can generate a hamper image preview from text.
3. As a buyer, AI failures show friendly retries without breaking the page.
4. As an operator, AI usage is rate-limited to prevent abuse.
5. As a buyer, AI responses feel tailored to Indian gifting occasions.

---

### Phase 7 — Hardening + Swap-in Readiness (Firebase + Razorpay)
**Goal:** Make swapping real Firebase/Razorpay keys a config-only change + do final hardening.
- Firebase integration layer:
  - Replace mock backend auth with Firebase Admin verify.
  - Enforce custom claims (admin/customer).
- Razorpay hosted checkout:
  - Replace simulated flow with:
    - backend order creation via Razorpay API
    - frontend Razorpay Checkout
    - webhook signature verification using real webhook secret
  - Maintain webhook-only confirmation.
- Add rate limiting (slowapi), secure headers, logging/audit trails.
- Mobile QA at 375/768/1440 + regression tests.
- Full regression via testing_agent_v3.

**User stories (Phase 7)**
1. As an operator, adding Razorpay keys enables real payments without code refactor.
2. As an operator, adding Firebase config enables real auth without changing UI flows.
3. As a buyer, payment states (success/fail/pending) are always accurate.
4. As a buyer, my data remains private across all account APIs.
5. As a buyer, the site stays fast and stable on mobile.

---

## 3) Next Actions
1. **Phase 3 kickoff:** Replace frontend mockCatalog usage with `/api/catalog/*` calls + loading states.
2. Implement backend auth (mock JWT) + order APIs with object-level auth.
3. Wire Checkout “Place Order” to backend order creation + payment core + webhook simulation for dev.
4. Re-run testing_agent_v3 to validate real end-to-end order confirmation and stock decrement.

---

## 4) Success Criteria
- ✅ Phase 1: POC script passes: webhook-confirmed order + idempotency + atomic stock decrement + webhook replay safety + concurrency safe.
- ✅ Phase 2: All 52 routes built and responsive; cart persistence fixed; silent admin redirect verified.
- Phase 3: Frontend reads real catalog from backend; checkout creates orders; webhook confirms; stock updates; orders visible in account.
- Security: Strict requirements satisfied (webhook-only confirmation, object auth, silent admin redirect, rate limits, generic auth errors, validation/sanitization, idempotency).
- Admin: Protected `/admin/*` works with real CRUD; status updates reflect in Track Order.
- AI: Gift Advisor + Nano Banana image gen functional with safe fallbacks.
- Swap readiness: Firebase + Razorpay keys can be added with minimal code changes; full mobile QA at 375/768/1440.
