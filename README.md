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
| `ADMIN_SECRET_KEY`     | Secret for admin registration   |

Copy `.env.example` to `.env` and fill in the values. The frontend defaults to `http://localhost:8080/api`.

## Project Structure

```
ecommerce/
├── backend/
│   └── src/main/java/com/maltaland/ecommerce/
│       ├── config/DataSeeder.java
│       ├── controller/         # Auth, Order, Product, Category, Dashboard
│       ├── dto/
│       ├── entity/             # Order, Product, User, Category, OrderItem, Coupon
│       ├── mapper/
│       ├── repository/
│       ├── security/           # JwtAuthFilter, SecurityConfig, JwtUtil
│       └── service/
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
