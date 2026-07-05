# Assignment 4 - Backend Project

## 🔍 Find Your Assignment

> 💡 Check your Student ID by clicking your **profile image** on the [Programming Hero Website](https://web.programming-hero.com/profile).

| Last Digit of Student ID | Assignment |
|:------------------------:|------------|
| **0, 1, 2, 3** | [RentNest](./1-RentNest.md) 🏠 |
| **4, 5, 6** | [GearUp](./2-GearUp.md) 🏋️ |
| **7, 8, 9** | [FixItNow](./3-FixItNow.md) 🔧 |

---

## ⚠️ Mandatory Requirements

> [!CAUTION]
> **MANDATORY - READ CAREFULLY**
> 
> The following **SIX requirements are MANDATORY**:
> 1. **API Documentation** - Provide Postman collection or Swagger/OpenAPI docs covering all endpoints
> 2. **Consistent Error Responses** - All errors must return structured JSON (`{ success, message, errorDetails }`)
> 3. **Commits** - 20 meaningful backend commits with descriptive messages
> 4. **Input Validation** - Server-side validation on all endpoints with proper error messages
> 5. **Admin Credentials** - Provide working admin email & password
> 6. **Payment Integration** - Must integrate **Stripe** or **SSLCommerz** for processing payments. Simulated/fake payments (Cash on Delivery, Pay Later) are **NOT** accepted.
>
> ❌ **Failure to complete any of these = 0 MARKS**

---

## 📊 Marks Distribution

| # | Category | Weight | Details |
|:-:|----------|:------:|---------|
| 1 | API Design & Documentation | 20% | RESTful endpoints, Postman/Swagger docs, response format |
| 2 | Database Design & Schema | 20% | Prisma schema, relations, migrations, seed script |
| 3 | Commit History | 10% | 20 meaningful backend commits |
| 4 | Error Handling & Validation | 10% | Input validation, structured error responses, 404 handling |
| 5 | Core Functionality | 20% | Auth, CRUD, role-based access, middleware |
| 6 | Payment Integration | 10% | Stripe or SSLCommerz integration, payment endpoints, payment status tracking |
| 7 | Video Explanation | 10% | 3-5 min API walkthrough video |

---

## 📅 Timeline

| Deadline | Maximum Marks |
|----------|:-------------:|
| **July 09, 2026, 11:59 PM** | 60 Marks |
| **July 10, 2026, 11:59 PM** | 50 Marks |
| **From July 11, 2026 To July 31, 2026, 11:59 PM** | 30 Marks |

---

## 📦 What to Submit

| Item | Required |
|------|:--------:|
| Backend GitHub Repo | ✅ |
| Live API URL | ✅ |
| API Documentation (Postman/Swagger) | ✅ |
| Demo Video (3-5 min) | ✅ |
| Admin Credentials | ✅ |

**Example:**
```
Backend Repo     : https://github.com/your-username/rentnest-backend
Live API         : https://rentnest-api.vercel.app
API Docs         : https://documenter.getpostman.com/view/xxx
Demo Video       : https://drive.google.com/file/d/xxx/view
Admin Email      : admin@rentnest.com
Admin Password   : admin123
```

---

## 🎥 Video Explanation Guide

**Duration:** 3-5 minutes | **Language:** English or Bengali

**What to Cover:**
1. Project overview & API architecture
2. Demonstrate all 3 roles working via Postman/Thunder Client (Customer/Tenant, Provider/Landlord/Technician, Admin)
3. Show CRUD operations on key endpoints
4. Demonstrate error handling & validation in action
5. Briefly explain one technical challenge you solved

**Recording Options:**
- **Loom** - Record & share link directly
- **OBS** - Record & upload to Google Drive (set "Anyone with link" access)

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express | REST API |
| TypeScript | Type safety (recommended) |
| Postgres + Prisma | Database + ORM |
| JWT | Authentication |

### Deployment
| Service | Purpose |
|---------|---------| 
| Vercel/Render | Backend API deployment |

---

## 🎯 Key Rules

- **Roles**: Each project has 3 fixed roles. Users select during registration.
- **Payment**: Payment integration is **MANDATORY**. You must integrate either **Stripe** or **SSLCommerz** for processing payments. Include endpoints for creating payment intents/sessions, handling payment confirmations, and tracking payment status.
- **No Frontend Required**: This is a backend-only assignment. Test your API via Postman/Thunder Client.
- **Flexibility**: Endpoints listed in each variant are examples. Modify as needed.

---

## ⚠️ Important Notes

> **Plagiarism** = 0 Marks. All work must be original.

**Good luck! Build a rock-solid backend you're proud of.** 🚀
