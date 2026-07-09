# 🧪 RentNest — Property Create-to-Rent Flow Test Log

**Date:** July 9, 2026
**Environment:** local API (`http://localhost:8080`) against the shared production PostgreSQL database
**Result:** ✅ **ALL 13 STEPS PASSED** — full lifecycle `AVAILABLE → PENDING → APPROVED → paid → ACTIVE/RENTED → COMPLETED/AVAILABLE → reviewed`

## Accounts used (real documented accounts)

| Role | Email | Source |
|------|-------|--------|
| Landlord | `rhmunna199@gmail.com` | [LANDLORD.md](./LANDLORD.md) |
| Tenant | `rhmunna19@gmail.com` | [TENANT.md](./TENANT.md) |
| Admin | `admin@rentnest.com` | [ADMIN.md](./ADMIN.md) — login verified, not needed in this flow |

## How the payment step was executed

`POST /api/payments/create` created a **real Stripe Checkout Session** (test mode) via the Stripe API. The completion was then delivered as a `checkout.session.completed` webhook event for that real session id, **signed with the server's webhook secret** — i.e., the exact code path Stripe's own delivery takes, skipping only the card-entry UI. (See "Known issue" below for why this wasn't run against the live URL.)

## Test steps & results

| # | Step | Actor | Endpoint | Result |
|---|------|-------|----------|--------|
| 0 | Login all three roles | all | `POST /api/auth/login` | ✅ 200 each |
| 1 | Create property "Banani Lake View 3BR" (rent 32,000; 3BR/2 bath; amenities; image) | Landlord | `POST /api/landlord/properties` | ✅ 201 — id `6223d7cc…`, status `AVAILABLE` |
| 2 | Submit rental request (message + move-in 2026-08-01) | Tenant | `POST /api/rentals` | ✅ 201 — id `f8577fc7…`, status `PENDING` |
| 3 | Landlord sees the request with tenant contact info | Landlord | `GET /api/landlord/requests?status=PENDING` | ✅ shows *RH Munna &lt;rhmunna19@gmail.com&gt;* |
| 4 | Approve the request | Landlord | `PATCH /api/landlord/requests/:id` `{"status":"APPROVED"}` | ✅ 200 — status `APPROVED` |
| 5 | Create Stripe Checkout Session | Tenant | `POST /api/payments/create` | ✅ 201 — real session `cs_test_a1dgPjGX…`, payment `PENDING`, amount `32000`, checkout URL returned |
| 6 | Deliver `checkout.session.completed` (signed) | Stripe (simulated delivery) | `POST /api/payments/webhook` | ✅ 200 |
| 7 | Payment status | Tenant | `GET /api/payments` | ✅ `COMPLETED`, transactionId `pi_flow_test_demo`, `paidAt` set |
| 8 | Rental status after payment | Tenant | `GET /api/rentals/:id` | ✅ `ACTIVE` |
| 9 | Property status after payment | Public | `GET /api/properties/:id` | ✅ `RENTED` (hidden from public browse) |
| 10 | Landlord completes the rental | Landlord | `PATCH /api/landlord/requests/:id` `{"status":"COMPLETED"}` | ✅ 200 — status `COMPLETED` |
| 11 | Property freed after completion | Public | `GET /api/properties/:id` | ✅ `AVAILABLE` again |
| 12 | Tenant reviews the completed rental (5★ + comment) | Tenant | `POST /api/reviews` | ✅ 201 |
| 13 | Review visible on public property detail | Public | `GET /api/properties/:id` | ✅ 1 review, `averageRating: 5`, reviewer *RH Munna* |

The webhook applied steps 7–9 **atomically in one database transaction** (payment → `COMPLETED`, rental → `ACTIVE`, property → `RENTED`, plus auto-rejecting any other pending requests on the property).

## Test data left in the database (usable for the demo video)

- Property **"Banani Lake View 3BR"** (`6223d7cc-27c7-4e4c-8902-744383140e09`) — status `AVAILABLE`, with one 5★ review
- Rental request `f8577fc7-e209-4686-bd9e-3a3302ba8549` — `COMPLETED`, owned by the tenant account
- Payment record — `COMPLETED`, txn `pi_flow_test_demo` (simulated intent id), amount 32,000 USD

## ⚠️ Known issue on the LIVE deployment (action required)

Stripe's event log shows real `checkout.session.completed` deliveries to
`https://rent-nest-backend-eight.vercel.app/api/payments/webhook` **failing signature verification** (`pending_webhooks=1`, still retrying). The `STRIPE_WEBHOOK_SECRET` set on Vercel does not match the dashboard endpoint's signing secret.

**Fix:** Stripe Dashboard → Developers → Webhooks → the endpoint → *Reveal signing secret* → copy that `whsec_…` into Vercel → Environment Variables → `STRIPE_WEBHOOK_SECRET`, then rebuild & redeploy (`npm run build`, deploy `dist/`). The deploy must also include the hardened webhook handler (metadata fallback + late-retry guard) from `src/modules/payment/payment.service.ts`. After redeploying, Stripe will retry the stuck event automatically, or use *Resend* in the dashboard. Then repeat steps 5–9 of this log against the live URL with a real card payment (`4242 4242 4242 4242`) for final confirmation.
