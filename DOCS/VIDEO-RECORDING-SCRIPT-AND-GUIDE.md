# 🎥 RentNest — Demo Video Script & Recording Guide

**Target:** 3–5 minutes · English or Bengali · Loom (share link) or OBS (upload to Google Drive, "Anyone with link")

**Must cover (assignment requirements):**
1. Project overview & API architecture
2. All 3 roles working via Postman (Tenant, Landlord, Admin)
3. CRUD operations on key endpoints
4. Error handling & validation in action
5. One technical challenge you solved

---

## ✅ Pre-Recording Checklist

Do this BEFORE hitting record — a smooth demo is a short demo.

- [ ] Server reachable: open the **live API** root URL (or `npm run dev` locally) and confirm the hello response
- [ ] Stripe webhook wired to the URL you'll demo against (live: dashboard webhook endpoint / local: `stripe listen --forward-to localhost:8080/api/payments/webhook`)
- [ ] Postman: import the collection from `DOCS/`, set `devBaseUrl` to the URL you're demoing
- [ ] **Prepare 3 Postman tabs logged in ahead of time is NOT possible (cookies are per-domain, not per-tab)** — instead, plan the order below so each login happens once and you continue as that role
- [ ] Database in a clean demo state:
  - [ ] Admin seeded (`admin@rentnest.com` / `admin123`)
  - [ ] One landlord account + one tenant account already registered (so you don't type registration bodies on camera) — e.g. `demo-landlord@rentnest.com` / `demo-tenant@rentnest.com`
  - [ ] One property already created by the landlord, one **APPROVED rental request** from the tenant on a second property — this lets you demo payment instantly without waiting through the whole flow
- [ ] Browser tab open at Stripe test checkout readiness (know the card: `4242 4242 4242 4242`, any future date, any CVC)
- [ ] Close notifications/other apps; screen resolution readable (zoom Postman UI to ~110%)
- [ ] Glance through the script below once; don't read it word-for-word on camera — speak naturally

---

## 🎬 Script & Timeline

### [0:00 – 0:40] Overview & Architecture (talk over the code editor or README)

> "Hi, I'm <NAME>. This is **RentNest**, a rental property marketplace backend built with **Express 5, TypeScript, PostgreSQL with Prisma, Zod validation, JWT auth, and Stripe payments**, deployed on Vercel.
>
> The architecture is modular — each domain (user, property, category, rental-request, payment, review) has its own **route → controller → service** layers, with shared middlewares for authentication, role-based authorization, Zod request validation, and a global error handler that returns every error in a consistent `success / message / errorDetails` envelope.
>
> There are three roles: **Tenant, Landlord, and Admin**. The core flow: a tenant requests a property, the landlord approves it, the tenant pays through Stripe Checkout, and a signature-verified webhook activates the rental."

*Show briefly: `src/modules` folder tree, `prisma/schema/` files (10 seconds each).*

### [0:40 – 1:30] Admin role + Category CRUD (Postman)

1. **Login as admin** (`admin@rentnest.com` / `admin123`) — point out the response: user + tokens, and mention tokens are also set as httpOnly cookies so the next requests just work.
2. **Create category** (`POST /api/admin/categories`) → 201.
3. **Create the same category again** → **409 conflict** — *"consistent structured error"*.
4. **Update category**, then **delete category** → CRUD complete.

> "Only admins can do this — the admin account is seeded, the API refuses `ADMIN` as a registration role."

### [1:30 – 2:20] Landlord role + Property CRUD (Postman)

1. **Login as landlord.**
2. **Create property** (`POST /api/landlord/properties`) → 201 with category included.
3. **Update property** (`PUT .../:id`) — change `rentAmount`.
4. **Public browse** (`GET /api/properties?location=...&minPrice=...`) — show filters + pagination `meta`. *"No auth needed — public endpoint, only AVAILABLE properties."*
5. **Landlord views requests** (`GET /api/landlord/requests`) — show the pre-made request from the tenant, then **approve it** (`PATCH` with `{"status":"APPROVED"}`).

### [2:20 – 3:20] Tenant role + Stripe payment

1. **Login as tenant.**
2. **Submit a rental request** on the property created a minute ago (`POST /api/rentals`) → 201 PENDING. *"Duplicate pending requests are blocked with 409."*
3. **Pay for the APPROVED request**: `POST /api/payments/create` → copy the `checkoutUrl`, open it in the browser, pay with **4242 4242 4242 4242**.
4. Back in Postman: `GET /api/payments` → payment is **COMPLETED** with a transaction id; `GET /api/rentals` → request is **ACTIVE**. *"The Stripe webhook did this atomically: payment completed, rental activated, property marked RENTED, and any competing pending requests auto-rejected."*
5. (If time) `POST /api/reviews` on a completed rental → 201, or show the 409 "only after completion" guard.

### [3:20 – 4:00] Error handling & validation

Fire these quickly, narrating the status codes:

1. **Validation**: register with `{"email": "not-an-email", "password": "123"}` → **400** with field-level `errorDetails`.
2. **Auth**: `GET /api/auth/me` with no token → **401**.
3. **Role guard**: as tenant, `POST /api/landlord/properties` → **403**.
4. **Not found**: `GET /api/properties/<random-uuid>` → **404**; any unknown route → structured **404**.

> "Every error — validation, auth, ownership, business rules, even unknown routes — comes back in the same JSON envelope."

### [4:00 – 4:45] Technical challenge (pick this one — it's the strongest)

> "The trickiest part was the **Stripe webhook**. Three problems: first, Stripe signs the **raw request bytes**, but Express's JSON parser consumes the body — so I mount `express.raw` for the webhook path *before* `express.json`, and on Vercel I had to disable the platform's body-parsing helpers with `NODEJS_HELPERS=0`. Second, webhooks can be delivered **more than once**, so the handler is idempotent — an already-completed payment is skipped. Third, payment success has to update four things at once — payment, rental, property, and competing requests — so it all runs in a single **Prisma transaction**: either everything applies or nothing does."

### [4:45 – 5:00] Wrap up

> "That's RentNest — documented in the Postman collection, deployed on Vercel, with 3 roles, full CRUD, real Stripe payments, and consistent validation and error handling throughout. Thanks for watching!"

---

## 🎙️ Recording Tips

- **One take is a myth** — record sections separately in Loom/OBS if needed; a single clean take of 4 minutes usually happens on attempt 2–3.
- **Narrate status codes out loud** ("...and that's a 409 conflict") — the evaluator is listening for them.
- Keep Postman's **response panel** large; collapse the sidebar when showing responses.
- If a request unexpectedly fails on camera, stay calm: read the structured error out loud — it demonstrates the error handling requirement — fix, and continue.
- Watch the clock: if you're at 3:30 by the payment step, shorten the error-handling section to two examples and keep the technical challenge — it carries the most marks per second.
- Before uploading: rewatch at 1.5× to catch dead air, confirm audio, and verify the link is viewable in an incognito window ("Anyone with link").

## 🧹 After Recording

- [ ] Upload & set sharing to "Anyone with link"
- [ ] Paste the link into `README.md` → Links table
- [ ] Include it in the submission form alongside repo, live URL, Postman docs, and admin credentials
