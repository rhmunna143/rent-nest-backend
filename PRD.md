# PRD — RentNest Backend API 🏠

**"Find & List Rental Properties with Ease"**

| | |
|---|---|
| **Document** | Product Requirements Document (PRD) |
| **Product** | RentNest — Rental Property Marketplace Backend API |
| **Version** | 1.0 |
| **Date** | July 5, 2026 |
| **Deadline** | July 9, 2026, 11:59 PM (for maximum marks) |
| **Sources** | [Requirements-RentNest.md](./Requirements-RentNest.md), [Rules-README.md](./Rules-README.md) |

---

## 1. Overview

### 1.1 Summary

RentNest is a **backend-only REST API** for a rental property marketplace. Landlords list properties and approve or reject rental requests. Tenants browse listings, submit rental requests, pay via **Stripe** after approval, and leave reviews after completed rentals. Admins moderate the platform — managing users, listings, and categories.

### 1.2 Goals

- Ship a production-deployed, documented REST API covering all three roles (Tenant, Landlord, Admin).
- Implement **real Stripe payment integration** (test mode) — checkout session creation, webhook confirmation, and payment status tracking.
- Enforce role-based access control with JWT authentication on every protected endpoint.
- Validate all input server-side and return **consistent structured error responses**.
- Provide a seeded admin account and full API documentation (Postman/Swagger).

### 1.3 Non-Goals

- ❌ No frontend/UI — API is tested via Postman/Thunder Client.
- ❌ No SSLCommerz integration — Stripe is the single payment provider.
- ❌ No file/image upload handling — image URLs are stored as strings (frontend-ready, but upload pipeline is out of scope).
- ❌ No real-time features (notifications, chat), no email sending.

### 1.4 Success Criteria (Mandatory — failure on any = 0 marks)

| # | Requirement | How it's met |
|---|-------------|--------------|
| 1 | API Documentation | Postman collection (or Swagger) covering **all** endpoints |
| 2 | Consistent error responses | Global error handler returning `{ success, message, errorDetails }` |
| 3 | 20+ meaningful commits | Incremental commits per module/feature (see §11 Milestones) |
| 4 | Server-side input validation | Zod validation middleware on every endpoint accepting input |
| 5 | Working admin credentials | Admin user created by Prisma seed script (e.g., `admin@rentnest.com` / `admin123`) |
| 6 | Real payment integration | Stripe Checkout + webhook — no simulated/fake payments |

---

## 2. Tech Stack

| Technology | Purpose |
|------------|---------|
| **Node.js + Express** | REST API framework |
| **TypeScript** | Type safety |
| **PostgreSQL + Prisma** | Database + ORM (migrations + seed script) |
| **JWT** (`jsonwebtoken`) | Stateless authentication |
| **bcrypt** | Password hashing |
| **Zod** | Request validation (body, params, query) |
| **Stripe SDK** (`stripe`) | Payment processing (Checkout Sessions + Webhooks) |
| **Vercel / Render** | Deployment |

**Environment variables:** `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLIENT_SUCCESS_URL`, `CLIENT_CANCEL_URL`, `PORT`.

---

## 3. Roles & Permissions

Users select their role (**Tenant** or **Landlord**) during registration. The **Admin** role is never self-assignable — it is created only via the seed script.

| Capability | Public | Tenant | Landlord | Admin |
|---|:---:|:---:|:---:|:---:|
| Browse/search properties, view details | ✅ | ✅ | ✅ | ✅ |
| View categories | ✅ | ✅ | ✅ | ✅ |
| Register / Login | ✅ | — | — | — |
| Get own profile (`/me`), update profile | — | ✅ | ✅ | ✅ |
| Submit rental request | — | ✅ | — | — |
| View own rental requests | — | ✅ | ✅ (for own properties) | ✅ (all) |
| Pay for approved rental (Stripe) | — | ✅ | — | — |
| View payment history | — | ✅ (own) | — | ✅ (all) |
| Leave review (after completed rental) | — | ✅ | — | — |
| Create/edit/delete own property listings | — | — | ✅ | — |
| Set property availability | — | — | ✅ | — |
| Approve/reject rental requests | — | — | ✅ (own properties) | — |
| View all users, ban/unban | — | — | — | ✅ |
| View all properties & rentals | — | — | — | ✅ |
| Manage categories (CRUD) | — | — | — | ✅ |

**Enforcement:** `authenticate` middleware (verifies JWT, loads user, rejects `BANNED` users with 403) + `authorize(...roles)` middleware (role guard). Ownership checks (landlord owns property, tenant owns request/payment) enforced in service layer.

---

## 4. Functional Requirements

### 4.1 Authentication

**User stories**
- As a visitor, I can register as a Tenant or Landlord with name, email, password, and role.
- As a registered user, I can log in with email + password and receive a JWT.
- As an authenticated user, I can fetch my own profile.

**Acceptance criteria**
- Email must be unique; duplicate registration returns `409` with structured error.
- Passwords hashed with bcrypt (never returned in any response).
- Role in registration payload must be `TENANT` or `LANDLORD` — `ADMIN` is rejected by validation.
- Login with wrong credentials returns `401`; login as a `BANNED` user returns `403`.
- JWT payload contains `userId` and `role`; token expiry configurable via env.

### 4.2 Properties (Public)

**User stories**
- As anyone, I can browse all **available** properties with filters and pagination.
- As anyone, I can view full details of a single property (including landlord name and reviews).

**Acceptance criteria**
- `GET /api/properties` supports query filters: `location` (case-insensitive contains), `minPrice`, `maxPrice`, `categoryId`, `bedrooms`, `search` (title/description), plus `page`, `limit`, `sortBy`, `sortOrder`.
- Public listing returns only `AVAILABLE` properties; landlord/admin views can see all.
- `GET /api/properties/:id` returns `404` (structured) for unknown ids.
- Response includes pagination metadata: `{ page, limit, total, totalPages }`.

### 4.3 Categories

**User stories**
- As anyone, I can list property categories (apartment, house, studio, …).
- As an admin, I can create, update, and delete categories.

**Acceptance criteria**
- Category name is unique.
- Deleting a category with linked properties is blocked (`409`) or handled via `Restrict` relation.

### 4.4 Landlord — Property Management

**User stories**
- As a landlord, I can create a listing with title, description, location, rent amount, category, bedrooms, amenities, and image URLs.
- As a landlord, I can update or delete only **my own** listings and toggle availability (`AVAILABLE` / `RENTED` / `UNAVAILABLE`).
- As a landlord, I can view all rental requests for my properties and the tenant details on each.

**Acceptance criteria**
- Editing/deleting another landlord's property returns `403`.
- Deleting a property with an `ACTIVE` rental is blocked (`409`).
- `images` accepts an array of URL strings (optional, defaults to `[]`) — kept for future frontend use.

### 4.5 Rental Requests

**User stories**
- As a tenant, I can submit a rental request for an available property with a message and desired move-in date.
- As a tenant, I can view my request history with statuses (pending / approved / rejected / active / completed).
- As a landlord, I can approve or reject pending requests on my properties.

**Acceptance criteria**
- Tenants cannot request their own listings (landlords can't submit requests at all — role guard).
- Duplicate pending request by the same tenant for the same property is rejected (`409`).
- Requests can only be submitted for `AVAILABLE` properties.
- Only the landlord who owns the property can approve/reject; only `PENDING` requests can transition.
- Approving a request does **not** auto-reject others; other pending requests are rejected when a payment completes and the property becomes `RENTED`.

### 4.6 Payments — Stripe (Mandatory)

**User stories**
- As a tenant, I can create a Stripe Checkout Session for my **approved** rental request and complete payment with a test card.
- As a tenant, I can view my payment history and each payment's status.
- As the system, I confirm payments via Stripe **webhook** (`checkout.session.completed`) — never trusting the client.

**Acceptance criteria**
- `POST /api/payments/create` only works for requests with status `APPROVED` and owned by the calling tenant; otherwise `403`/`409`.
- Creating a session inserts a `Payment` row with status `PENDING`, storing `stripeSessionId`; response returns the Checkout `url`.
- Webhook endpoint verifies the Stripe signature (`STRIPE_WEBHOOK_SECRET`) using the **raw request body** (mounted before `express.json()`).
- On `checkout.session.completed`: payment → `COMPLETED` with `transactionId` (payment intent id) and `paidAt`; rental request → `ACTIVE`; property → `RENTED`; other pending requests for the property → `REJECTED`.
- On session expiry/failure events: payment → `FAILED`.
- Duplicate webhook deliveries are idempotent (already-completed payments are skipped).
- Amount charged = property `rentAmount` (first month's rent), currency USD (Stripe test mode).

### 4.7 Reviews

**User stories**
- As a tenant, I can leave a rating (1–5) and comment on a property **after my rental is COMPLETED**.

**Acceptance criteria**
- Review creation validates: the rental request belongs to the caller, status is `COMPLETED`, and no review exists yet for that rental (unique constraint).
- Rating is an integer 1–5.
- Reviews appear in the public property detail response (with average rating).
- Rentals transition `ACTIVE → COMPLETED` via landlord marking the rental complete (`PATCH /api/landlord/requests/:id` with `COMPLETED`), which also sets the property back to `AVAILABLE`.

### 4.8 Admin

**User stories**
- As an admin, I can list all users with role/status filters.
- As an admin, I can ban or unban any tenant or landlord.
- As an admin, I can view all properties and all rental requests platform-wide.
- As an admin, I can manage categories (§4.3).

**Acceptance criteria**
- Admin cannot ban another admin (or self).
- Banned users are rejected by the auth middleware on every subsequent request (`403`).

---

## 5. Rental Request Lifecycle

```
                    ┌─────────┐
                    │ PENDING │  ← tenant submits request
                    └────┬────┘
              landlord   │   landlord
              approves   │   rejects
               ┌─────────┴──────────┐
               ▼                    ▼
         ┌──────────┐         ┌──────────┐
         │ APPROVED │         │ REJECTED │  (terminal)
         └────┬─────┘         └──────────┘
              │  tenant pays via Stripe;
              │  webhook `checkout.session.completed`
              ▼
         ┌──────────┐   property → RENTED,
         │  ACTIVE  │   other pending requests → REJECTED
         └────┬─────┘
              │  landlord marks rental complete
              ▼
         ┌───────────┐  property → AVAILABLE,
         │ COMPLETED │  tenant may now review
         └───────────┘  (terminal)
```

| Transition | Triggered by | Endpoint / event |
|---|---|---|
| — → `PENDING` | Tenant | `POST /api/rentals` |
| `PENDING` → `APPROVED` | Landlord | `PATCH /api/landlord/requests/:id` `{ status: "APPROVED" }` |
| `PENDING` → `REJECTED` | Landlord | `PATCH /api/landlord/requests/:id` `{ status: "REJECTED" }` |
| `APPROVED` → `ACTIVE` | Stripe webhook | `POST /api/payments/webhook` (`checkout.session.completed`) |
| `ACTIVE` → `COMPLETED` | Landlord | `PATCH /api/landlord/requests/:id` `{ status: "COMPLETED" }` |

Any other transition returns `409 Conflict` with a structured error.

---

## 6. Database Schema (Prisma)

```prisma
// ---------- Enums ----------

enum UserRole {
  TENANT
  LANDLORD
  ADMIN
}

enum UserStatus {
  ACTIVE
  BANNED
}

enum PropertyStatus {
  AVAILABLE
  RENTED
  UNAVAILABLE
}

enum RentalStatus {
  PENDING
  APPROVED
  REJECTED
  ACTIVE
  COMPLETED
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
}

// ---------- Models ----------

model User {
  id             String          @id @default(uuid())
  name           String
  email          String          @unique
  password       String          // bcrypt hash — never serialized
  phone          String?
  profileImage   String?         // optional URL, frontend-ready
  role           UserRole
  status         UserStatus      @default(ACTIVE)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  properties     Property[]      // as landlord
  rentalRequests RentalRequest[] // as tenant
  reviews        Review[]        // as tenant
}

model Category {
  id         String     @id @default(uuid())
  name       String     @unique // "Apartment", "House", "Studio", ...
  createdAt  DateTime   @default(now())

  properties Property[]
}

model Property {
  id             String          @id @default(uuid())
  title          String
  description    String
  location       String
  rentAmount     Decimal         @db.Decimal(10, 2) // monthly rent
  bedrooms       Int
  bathrooms      Int             @default(1)
  amenities      String[]        @default([])
  images         String[]        @default([]) // image URLs, frontend-ready
  status         PropertyStatus  @default(AVAILABLE)
  landlordId     String
  categoryId     String
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  landlord       User            @relation(fields: [landlordId], references: [id], onDelete: Cascade)
  category       Category        @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  rentalRequests RentalRequest[]
  reviews        Review[]

  @@index([location])
  @@index([status])
  @@index([categoryId])
}

model RentalRequest {
  id         String        @id @default(uuid())
  tenantId   String
  propertyId String
  status     RentalStatus  @default(PENDING)
  message    String?
  moveInDate DateTime?
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt

  tenant     User          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  property   Property      @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  payment    Payment?
  review     Review?

  @@index([tenantId])
  @@index([propertyId])
}

model Payment {
  id              String        @id @default(uuid())
  rentalRequestId String        @unique // one payment per rental request
  transactionId   String?       @unique // Stripe payment intent id (set on completion)
  stripeSessionId String        @unique // Stripe checkout session id
  amount          Decimal       @db.Decimal(10, 2)
  currency        String        @default("usd")
  method          String        @default("card")
  provider        String        @default("STRIPE")
  status          PaymentStatus @default(PENDING)
  paidAt          DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  rentalRequest   RentalRequest @relation(fields: [rentalRequestId], references: [id], onDelete: Cascade)
}

model Review {
  id              String        @id @default(uuid())
  tenantId        String
  propertyId      String
  rentalRequestId String        @unique // one review per completed rental
  rating          Int           // 1–5, validated server-side
  comment         String?
  createdAt       DateTime      @default(now())

  tenant          User          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  property        Property      @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  rentalRequest   RentalRequest @relation(fields: [rentalRequestId], references: [id], onDelete: Cascade)

  @@index([propertyId])
}
```

**Seed script** (`prisma/seed.ts`): 1 admin (`admin@rentnest.com` / `admin123`), sample categories (Apartment, House, Studio, Duplex), 1–2 sample landlords/tenants, and a few sample properties for demo purposes.

---

## 7. API Specification

Base URL: `/api`. All responses use the envelope in §8.1.

**Legend:** 🌐 Public · 🔑 Any authenticated · 👤 Tenant · 🏘️ Landlord · 🛡️ Admin

### 7.1 Auth

| Method | Endpoint | Access | Body / Notes |
|--------|----------|:------:|--------------|
| POST | `/auth/register` | 🌐 | `{ name, email, password, role: "TENANT"\|"LANDLORD", phone? }` → user (no password) + token |
| POST | `/auth/login` | 🌐 | `{ email, password }` → `{ token, user }` |
| GET | `/auth/me` | 🔑 | Current user profile |
| PATCH | `/auth/me` | 🔑 | Update own `{ name?, phone?, profileImage?, password? }` |

### 7.2 Public — Properties & Categories

| Method | Endpoint | Access | Body / Notes |
|--------|----------|:------:|--------------|
| GET | `/properties` | 🌐 | Query: `location, minPrice, maxPrice, categoryId, bedrooms, search, page, limit, sortBy, sortOrder` |
| GET | `/properties/:id` | 🌐 | Property detail incl. landlord (public fields), category, reviews, avg rating |
| GET | `/categories` | 🌐 | All categories |

### 7.3 Landlord

| Method | Endpoint | Access | Body / Notes |
|--------|----------|:------:|--------------|
| POST | `/landlord/properties` | 🏘️ | `{ title, description, location, rentAmount, bedrooms, bathrooms?, amenities?, images?, categoryId }` |
| GET | `/landlord/properties` | 🏘️ | Own listings (all statuses) |
| PUT | `/landlord/properties/:id` | 🏘️ | Update own listing (partial fields incl. `status`) |
| DELETE | `/landlord/properties/:id` | 🏘️ | Delete own listing (blocked if ACTIVE rental) |
| GET | `/landlord/requests` | 🏘️ | Requests on own properties (filter: `status`) |
| PATCH | `/landlord/requests/:id` | 🏘️ | `{ status: "APPROVED"\|"REJECTED"\|"COMPLETED" }` per lifecycle rules (§5) |

### 7.4 Rental Requests (Tenant)

| Method | Endpoint | Access | Body / Notes |
|--------|----------|:------:|--------------|
| POST | `/rentals` | 👤 | `{ propertyId, message?, moveInDate? }` |
| GET | `/rentals` | 👤 | Own requests (filter: `status`) |
| GET | `/rentals/:id` | 👤 | Own request detail (incl. payment status) |

### 7.5 Payments (Stripe)

| Method | Endpoint | Access | Body / Notes |
|--------|----------|:------:|--------------|
| POST | `/payments/create` | 👤 | `{ rentalRequestId }` → creates Stripe Checkout Session, returns `{ url, sessionId }` |
| POST | `/payments/webhook` | 🌐 (Stripe) | Raw-body endpoint; verifies `stripe-signature`; handles `checkout.session.completed` / expiry |
| GET | `/payments` | 👤 | Own payment history |
| GET | `/payments/:id` | 👤 | Own payment detail |

### 7.6 Reviews

| Method | Endpoint | Access | Body / Notes |
|--------|----------|:------:|--------------|
| POST | `/reviews` | 👤 | `{ rentalRequestId, rating (1–5), comment? }` — only for own COMPLETED rentals |

### 7.7 Admin

| Method | Endpoint | Access | Body / Notes |
|--------|----------|:------:|--------------|
| GET | `/admin/users` | 🛡️ | All users (filter: `role`, `status`; paginated) |
| PATCH | `/admin/users/:id` | 🛡️ | `{ status: "ACTIVE"\|"BANNED" }` — cannot target admins |
| GET | `/admin/properties` | 🛡️ | All properties (all statuses; paginated) |
| GET | `/admin/rentals` | 🛡️ | All rental requests (paginated) |
| POST | `/admin/categories` | 🛡️ | `{ name }` |
| PUT | `/admin/categories/:id` | 🛡️ | `{ name }` |
| DELETE | `/admin/categories/:id` | 🛡️ | Blocked if properties reference it |

---

## 8. Cross-Cutting Requirements

### 8.1 Response Envelope (Mandatory)

```jsonc
// Success
{
  "success": true,
  "message": "Property created successfully",
  "data": { /* payload */ },
  "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 } // list endpoints only
}

// Error (mandatory format)
{
  "success": false,
  "message": "Validation failed",
  "errorDetails": [
    { "field": "rentAmount", "message": "rentAmount must be a positive number" }
  ]
}
```

### 8.2 Error Handling

- **Global error handler** maps: Zod errors → `400`, auth failures → `401`, permission/ownership → `403`, missing resources → `404`, conflicts (duplicate email, invalid transition) → `409`, unknown → `500`.
- **404 route handler** for undefined endpoints, same envelope.
- Prisma known errors (`P2002` unique violation, `P2025` not found) translated to structured responses.
- Stack traces never leak in production responses.

### 8.3 Validation

- Zod schemas per endpoint validating **body, params, and query** via a reusable `validateRequest(schema)` middleware.
- Examples: email format, password min length 6, `rentAmount > 0`, `rating` int 1–5, enum membership for role/status fields, UUID format for id params, URL format for image strings.

### 8.4 Auth Middleware

- `authenticate`: extracts `Authorization: Bearer <token>`, verifies JWT, loads user, rejects missing/invalid token (`401`) and `BANNED` users (`403`).
- `authorize(...roles)`: rejects wrong-role callers (`403`).
- Stripe webhook route is exempt from JWT but protected by signature verification.

### 8.5 Project Structure (modular)

```
src/
├── app.ts                 # express app, middleware, routes (webhook raw-body first)
├── server.ts
├── config/                # env parsing
├── middlewares/           # authenticate, authorize, validateRequest, globalErrorHandler, notFound
├── modules/
│   ├── auth/              #  auth.routes.ts / .controller.ts / .service.ts / .validation.ts
│   ├── property/
│   ├── category/
│   ├── rental/
│   ├── payment/           # + stripe webhook handler
│   ├── review/
│   └── admin/
└── utils/                 # sendResponse, AppError, jwt helpers
prisma/
├── schema.prisma
└── seed.ts
```

---

## 9. Non-Functional Requirements

- **Security:** bcrypt-hashed passwords; JWT secret from env; webhook signature verification; no secrets in repo (`.env` gitignored, `.env.example` committed).
- **Data integrity:** payment/rental/property state changes in the webhook wrapped in a Prisma `$transaction`; webhook handler idempotent.
- **Consistency:** all money stored as `Decimal(10,2)`; all ids UUID; all timestamps UTC.
- **Deployment:** live API on Vercel or Render; Postgres on Neon/Supabase/Render; Stripe webhook endpoint registered against the live URL.

---

## 10. Submission Deliverables

| Item | Detail |
|------|--------|
| Backend GitHub repo | 20+ meaningful commits with descriptive messages |
| Live API URL | Vercel/Render deployment |
| API documentation | Published Postman collection (all endpoints, example bodies, auth setup) |
| Admin credentials | `admin@rentnest.com` / `admin123` (from seed) |
| Demo video (3–5 min) | Overview → all 3 roles via Postman → CRUD demo → error/validation demo → one technical challenge (suggested: Stripe webhook signature + state transitions) |

---

## 11. Milestones & Build Order

Target: full-marks deadline **July 9, 2026, 11:59 PM** (~4 days). Each milestone = several commits.

| # | Milestone | Scope | Target |
|---|-----------|-------|--------|
| 1 | Scaffold | Express + TS setup, Prisma init, response/error utilities, global error + 404 handlers | Jul 5 |
| 2 | Schema & seed | Full `schema.prisma`, migration, seed (admin + categories + samples) | Jul 5 |
| 3 | Auth | Register/login/me, JWT middleware, role guard, Zod validation | Jul 6 |
| 4 | Properties & categories | Public browse with filters/pagination, landlord CRUD, admin category CRUD | Jul 6 |
| 5 | Rental requests | Tenant submit + history, landlord approve/reject, lifecycle guards | Jul 7 |
| 6 | **Payments (Stripe)** | Checkout session, webhook (raw body + signature), status tracking, state transitions | Jul 7–8 |
| 7 | Reviews & admin | Review rules, admin user management + platform views | Jul 8 |
| 8 | Docs & deploy | Postman collection, deployment, live webhook registration, README, demo video | Jul 9 |

**Risk note:** Stripe webhook testing against a deployed URL (or `stripe listen` locally) is the likeliest source of delay — deploy early (end of Milestone 3) so the webhook can be verified against the live URL well before the deadline.
