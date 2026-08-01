# MaltaLand Store

Full-stack ecommerce app built with Spring Boot and React.

## Stack

| Layer       | Tech                                        |
|-------------|---------------------------------------------|
| Backend     | Java 17, Spring Boot 3.x, Spring Security, Spring Data JPA |
| Frontend    | React 19, React Router 7, Vite 8, Axios     |
| Database    | PostgreSQL 18                                |
| Payments    | Stripe                                       |
| Migrations  | Flyway                                       |

## Features

### Storefront
- Product catalog with search and pagination
- Product detail page with pricing, stock info and description
- Shopping cart (global context, persisted across sessions)
- Checkout flow with Stripe payment integration
- Order confirmation after successful payment
- User registration and login

### Payments
- Order is created as `PENDING` the moment the Stripe PaymentIntent is created, and stock is reserved immediately
- The Stripe **webhook** (`/api/webhooks/stripe`, signature-verified) is the source of truth: `payment_intent.succeeded` transitions the order to `PAID` and moves reserved stock to sold; `payment_intent.payment_failed` cancels the order and releases the reservation
- A scheduled **reaper job** cancels `PENDING` orders older than 15 minutes and releases their reserved stock (abandoned checkouts)
- Full **idempotency**:
  - A `UNIQUE` DB constraint on `orders.stripe_payment_intent_id` guarantees one intent → one order
  - Processed Stripe event ids are recorded in `webhook_events` in the same transaction as the order update, so Stripe retries are safely deduplicated
  - Payment intent ids are recorded in the PaymentIntent `metadata`, so the webhook knows exactly which order to update
- A synchronous `POST /orders/{id}/confirm` endpoint acts as a backstop (verifies the intent with Stripe directly) for the case where the webhook is delayed

### Admin Panel (`/admin`)
- Dashboard with KPIs: orders today, orders this week, total revenue, low stock count, pending orders
- Product management: full CRUD, activate/deactivate toggle, VAT percentage, available vs reserved stock
- Order management: filter by status / email / date range, order detail view, status transitions with validation (PENDING → PAID → SHIPPED → DELIVERED, any → CANCELLED)
- Category management: full CRUD with slug auto-generation
- Admin user creation via secret endpoint (`X-Admin-Secret` header)
- Responsive sidebar layout

### Security
- JWT authentication with custom Spring Security filter
- ADMIN and USER role separation
- Backend-enforced authorization (frontend guards are secondary)
- Axios interceptor reads token from localStorage on every request
- Admin user auto-seeded on first startup via `DataSeeder.java`

## Getting Started

### Prerequisites
- Java 17+
- Node.js 18+
- PostgreSQL 18+ running on `localhost:5432`

### Backend
```bash
cd backend
./mvnw spring-boot:run
```

The app will create the admin account automatically on startup. Defaults are in `application.yaml` — override via environment variables for production.

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

| Variable               | Description                    |
|------------------------|--------------------------------|
| `DB_PASSWORD`          | PostgreSQL password             |
| `JWT_SECRET`           | Secret used to sign JWT tokens  |
| `STRIPE_SECRET_KEY`    | Stripe secret key (sandbox)     |
| `STRIPE_WEBHOOK_SECRET`| Stripe webhook signing secret (`whsec_...`) |
| `ADMIN_SECRET_KEY`     | Secret for admin registration   |

Copy `.env.example` to `.env` and fill in the values. The frontend defaults to `http://localhost:8080/api`.

> **Note:** the app ships with `sk_test_dummy` / `whsec_dummy` placeholders. Set real Stripe keys and use the Stripe CLI (`stripe listen --forward-to localhost:8080/api/webhooks/stripe`) to receive webhooks locally. The webhook endpoint verifies the `Stripe-Signature` header and rejects invalid payloads.

## Project Structure

```
ecommerce/
├── backend/
│   └── src/main/java/com/maltaland/ecommerce/
│       ├── config/DataSeeder.java, OrderCleanupJob.java
│       ├── controller/         # Auth, Order, Product, Category, Dashboard, Webhook
│       ├── dto/
│       ├── entity/             # Order, Product, User, Category, OrderItem, Coupon, WebhookEvent
│       ├── mapper/
│       ├── repository/
│       ├── security/           # JwtAuthFilter, SecurityConfig, JwtUtil
│       └── service/            # incl. PaymentService, WebhookService
└── frontend/
    └── src/
        ├── app/                # Router, guards
        ├── features/
        │   ├── admin/          # Dashboard, orders, products, categories
        │   ├── auth/           # Login, register
        │   └── storefront/     # Products, cart, checkout
        ├── layouts/            # AdminLayout, StorefrontLayout
        └── shared/             # API client, contexts, components
```
