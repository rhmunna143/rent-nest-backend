# RentNest 🏠

**"Find & List Rental Properties with Ease"**

A backend REST API for a rental property marketplace. Landlords list properties and approve rental requests, tenants browse listings and pay via **Stripe**, and admins moderate the platform.

## 🔗 Links

| Item | URL |
|------|-----|
| Live API | https://rent-nest-backend-eight.vercel.app |
| API Documentation (Postman) | [DOCS/rent-nest-backend.postman_collection.json](./DOCS/rent-nest-backend.postman_collection.json) <!-- replace with published Postman link --> |
| Demo Video | _add link_ |
| PRD | [PRD.md](./PRD.md) |

**Admin credentials:** `admin@rentnest.com` / `admin123`

---

## ✨ Features

### Public
- Browse **available** properties with filters: location, price range, category, bedrooms, full-text search, pagination & sorting
- View property details with landlord info, reviews, and average rating
- List property categories

### Tenant
- Register/login (JWT access + refresh tokens, delivered in the response **and** as httpOnly cookies)
- Submit rental requests (one pending request per property)
- **Pay for approved requests via Stripe Checkout** — payment status tracked end-to-end via webhook
- View rental request history and payment history
- Leave a review (1–5 stars) after a completed rental — one review per rental

### Landlord
- Create, update, and delete own property listings (with amenities & image URLs)
- Toggle availability (`AVAILABLE` / `RENTED` / `UNAVAILABLE`)
- View rental requests on own properties with tenant contact info
- Approve/reject pending requests; mark active rentals completed (frees the property)

### Admin
- Manage property categories (create/update/delete)
- Seeded admin account (never self-assignable at registration)

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js + Express 5 | REST API |
| TypeScript (strict) | Type safety |
| PostgreSQL + Prisma 7 | Database + ORM (multi-file schema, `pg` driver adapter — engine-less) |
| Zod 4 | Server-side validation on every endpoint |
| JWT (access + refresh) | Authentication |
| bcryptjs | Password hashing |
| Stripe | Payment processing (Checkout Sessions + signature-verified webhooks) |
| Vercel | Deployment |

---

## 📋 API Overview

Base URL: `/api` — full request/response examples in the [Postman collection](./DOCS/rent-nest-backend.postman_collection.json).

### Response envelope

```jsonc
// success
{ "success": true, "message": "...", "data": { }, "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 } }
// error (consistent across the API)
{ "success": false, "message": "Validation failed", "errorDetails": [{ "field": "email", "message": "A valid email is required" }] }
```

### Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | Public | Register as TENANT or LANDLORD |
| POST | `/auth/login` | Public | Login, returns token pair + cookies |
| POST | `/auth/refresh-token` | Public | Exchange refresh token for a new pair |
| POST | `/auth/logout` | Public | Clear auth cookies |
| GET / PATCH | `/auth/me` | Authenticated | Get / update own profile |
| GET | `/properties` | Public | Browse available properties (filters + pagination) |
| GET | `/properties/:id` | Public | Property details + reviews + average rating |
| GET | `/categories` | Public | List categories |
| POST / GET | `/landlord/properties` | Landlord | Create listing / list own listings |
| PUT / DELETE | `/landlord/properties/:id` | Landlord | Update / delete own listing |
| GET | `/landlord/requests` | Landlord | Rental requests on own properties |
| PATCH | `/landlord/requests/:id` | Landlord | Approve / reject / complete a request |
| POST / GET | `/rentals` | Tenant | Submit request / own request history |
| GET | `/rentals/:id` | Tenant | Own request details (incl. payment) |
| POST | `/payments/create` | Tenant | Create Stripe Checkout Session for an approved request |
| POST | `/payments/webhook` | Stripe | Signature-verified webhook (activates the rental) |
| GET | `/payments` / `/payments/:id` | Tenant | Payment history / details |
| POST | `/reviews` | Tenant | Review a completed rental |
| POST / PUT / DELETE | `/admin/categories(/:id)` | Admin | Manage categories |

### Rental lifecycle

```
PENDING ──landlord approves──▶ APPROVED ──Stripe payment (webhook)──▶ ACTIVE ──landlord completes──▶ COMPLETED
   └────landlord rejects────▶ REJECTED                                                                  └──▶ tenant may review
```

On successful payment the webhook atomically: marks the payment `COMPLETED`, sets the rental `ACTIVE`, sets the property `RENTED`, and rejects all other pending requests for that property. Completing a rental returns the property to `AVAILABLE`.

---

## 🚀 Getting Started

**Prerequisites:** Node.js 22+, a PostgreSQL database, a Stripe account (test mode).

```bash
git clone https://github.com/rhmunna143/rent-nest-backend.git
cd rent-nest-backend
npm install                 # also runs `prisma generate` (postinstall)

cp .env.example .env        # then fill in the values (see below)

npm run prisma:migrate      # create/apply migrations
npm run prisma:seed         # seed admin + base categories

npm run dev                 # http://localhost:8080
```

### Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Server port (default `8080`) |
| `JWT_ACCESS_SECRET` / `JWT_ACCESS_EXPIRES_IN` | Access token secret / lifetime (default `1d`) |
| `JWT_REFRESH_SECRET` / `JWT_REFRESH_EXPIRES_IN` | Refresh token secret / lifetime (default `30d`) |
| `STRIPE_SECRET_KEY` | Stripe test secret key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_...`) |
| `PAYMENT_SUCCESS_URL` / `PAYMENT_CANCEL_URL` | Stripe Checkout redirect pages (defaults point at the API's own pages) |

### Testing payments locally

```bash
stripe listen --forward-to localhost:8080/api/payments/webhook
```

Copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`, create a checkout session via `POST /api/payments/create`, open the returned `checkoutUrl`, and pay with test card **4242 4242 4242 4242** (any future expiry, any CVC).

### Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run typecheck` | Type-check app + config projects |
| `npm run prisma:migrate` | Create & apply migrations |
| `npm run prisma:seed` | Seed admin user + categories |
| `npm run prisma:studio` | Browse the database |

---

## 📁 Project Structure

```
prisma/
├── schema/            # multi-file Prisma schema (one model per file)
└── seed.ts            # admin + base categories
src/
├── app.ts             # express app, middleware order, route mounting
├── index.ts           # local entry (app.listen)
├── config/            # env parsing
├── lib/               # prisma client (pg adapter), stripe client
├── middlewares/       # authenticate, authorize, validateRequest, globalErrorHandler, notFound
├── modules/           # one folder per domain
│   └── <module>/      #   *.route.ts / *.controller.ts / *.service.ts / *.validation.ts / *.interface.ts
└── utils/             # AppError, sendResponse, jwt, authCookies
```

---

## ☁️ Deployment (Vercel)

The app deploys as a single serverless function (see [vercel.json](./vercel.json)). `NODEJS_HELPERS=0` keeps request bodies raw so Stripe webhook signature verification works.

1. Build locally so `dist/` exists: `npm run build`
2. Deploy: `npx vercel --prod` (or connect the GitHub repo in the Vercel dashboard)
3. Set all environment variables from the table above in the Vercel project settings
4. In the Stripe dashboard, add a webhook endpoint for `https://rent-nest-backend-eight.vercel.app/api/payments/webhook` subscribed to `checkout.session.completed` and `checkout.session.expired`, and copy its signing secret into `STRIPE_WEBHOOK_SECRET`

---

## 📄 License

[ISC](./LICENSE.md) © 2026 [@rhmunna143](https://github.com/rhmunna143)
