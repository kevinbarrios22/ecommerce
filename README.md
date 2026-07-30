# 🏪 MaltaLand Store — Ecommerce

Plataforma de ecommerce completa con **Spring Boot** (backend) y **React + Vite** (frontend).

## Stack

| Capa       | Tecnología                              |
| ---------- | --------------------------------------- |
| Backend    | Java 17, Spring Boot 3.x, Spring Security, Spring Data JPA |
| Frontend   | React 19, React Router 7, Vite 8, Axios |
| Base de datos | PostgreSQL 18                         |
| Pagos      | Stripe (sandbox)                        |
| Migraciones | Flyway                                 |

## Funcionalidades incluidas

### Storefront (tienda pública)
- Catálogo de productos con búsqueda y paginación
- Detalle de producto con precio, stock y descripción
- Carrito de compras (contexto global)
- Checkout con formulario de envío y pago vía Stripe
- Confirmación de orden post-pago
- Autenticación: registro e inicio de sesión

### Panel de administración (`/admin`)
- **Dashboard** con KPIs: órdenes hoy, esta semana, ingresos totales, stock bajo, órdenes pendientes
- **Gestión de productos**: CRUD completo, activar/desactivar, % IVA, stock disponible y reservado
- **Gestión de órdenes**: filtros por estado/email/fecha, vista detalle, cambio de estado con validación de transiciones (PENDING → PAID → SHIPPED → DELIVERED, cualquier estado → CANCELLED)
- **Gestión de categorías**: CRUD completo
- **Usuarios admin**: endpoint secreto para crear admins adicionales (`X-Admin-Secret`)
- Sidebar de navegación, diseño responsive

### Seguridad
- JWT con Spring Security + filtro personalizado
- Roles ADMIN y USER
- Endpoints protegidos por rol (backend)
- Interceptor Axios con token desde localStorage
- Semilla automática de admin en `DataSeeder.java`

## Cómo ejecutar

### Prerrequisitos
- Java 17+
- Node.js 18+
- PostgreSQL 18+ corriendo en `localhost:5432`

### Backend
```bash
cd backend
# Configurar variables de entorno o usar defaults en application.yaml
./mvnw spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Variables de entorno (`.env` / `application.yaml`)
| Variable | Descripción |
|---|---|
| `DB_PASSWORD` | Password de PostgreSQL |
| `JWT_SECRET` | Secreto para firmar JWT |
| `STRIPE_SECRET_KEY` | Stripe secret key (sandbox) |
| `ADMIN_SECRET_KEY` | Secreto para endpoint de registro admin |

## Estructura del proyecto

```
ecommerce/
├── backend/
│   └── src/main/java/com/maltaland/ecommerce/
│       ├── config/DataSeeder.java
│       ├── controller/     (Auth, Order, Product, Category, Dashboard)
│       ├── dto/
│       ├── entity/         (Order, Product, User, Category, OrderItem, Coupon)
│       ├── mapper/
│       ├── repository/
│       ├── security/       (JwtAuthFilter, SecurityConfig, JwtUtil)
│       └── service/
└── frontend/
    └── src/
        ├── app/            (router, guards)
        ├── features/
        │   ├── admin/      (dashboard, orders, products, categories)
        │   ├── auth/       (login, register)
        │   └── storefront/ (products, cart, checkout)
        ├── layouts/        (AdminLayout, StorefrontLayout)
        └── shared/         (api, contexts, components)
```
