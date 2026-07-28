-- V1__init.sql
-- Initial migration: creates the full ecommerce schema.

CREATE TABLE categories (
                            id BIGSERIAL PRIMARY KEY,
                            name VARCHAR(100) NOT NULL,
                            slug VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE products (
                          id BIGSERIAL PRIMARY KEY,
                          name VARCHAR(150) NOT NULL,
                          description TEXT,
                          price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
                          vat_percentage INT NOT NULL DEFAULT 18,
                          stock INT NOT NULL CHECK (stock >= 0),
                          reserved_stock INT NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
                          category_id BIGINT NOT NULL REFERENCES categories(id),
                          image_url VARCHAR(500),
                          active BOOLEAN NOT NULL DEFAULT TRUE,
                          release_date TIMESTAMP,
                          version BIGINT NOT NULL DEFAULT 0,
                          CONSTRAINT chk_reserved_stock_not_over_stock CHECK (reserved_stock <= stock)
);

CREATE TABLE coupons (
                         id BIGSERIAL PRIMARY KEY,
                         code VARCHAR(50) NOT NULL UNIQUE,
                         discount_percentage INT NOT NULL CHECK (discount_percentage BETWEEN 1 AND 100),
                         expiration_date TIMESTAMP,
                         max_uses INT,
                         current_uses INT NOT NULL DEFAULT 0,
                         active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE users (
                       id BIGSERIAL PRIMARY KEY,
                       name VARCHAR(150) NOT NULL,
                       email VARCHAR(150) NOT NULL UNIQUE,
                       password VARCHAR(255) NOT NULL,
                       role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
                       registered_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE orders (
                        id BIGSERIAL PRIMARY KEY,
                        user_id BIGINT NOT NULL REFERENCES users(id),
                        coupon_id BIGINT REFERENCES coupons(id),
                        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                        total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
                        stripe_session_id VARCHAR(255),
                        created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
                             id BIGSERIAL PRIMARY KEY,
                             order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                             product_id BIGINT NOT NULL REFERENCES products(id),
                             quantity INT NOT NULL CHECK (quantity > 0),
                             unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0)
);

CREATE TABLE payments (
                          id BIGSERIAL PRIMARY KEY,
                          order_id BIGINT NOT NULL REFERENCES orders(id),
                          stripe_payment_id VARCHAR(255) NOT NULL,
                          status VARCHAR(20) NOT NULL,
                          amount NUMERIC(10,2) NOT NULL,
                          created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE webhook_events (
                                id BIGSERIAL PRIMARY KEY,
                                stripe_event_id VARCHAR(255) NOT NULL UNIQUE,
                                processed_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Indexes for the most frequent ecommerce queries
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);