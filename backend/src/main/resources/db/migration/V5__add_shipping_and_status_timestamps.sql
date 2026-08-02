-- V5__add_shipping_and_status_timestamps.sql
-- Shipping address for fulfillment plus per-status timestamps so customers
-- can follow the order lifecycle (feature 3).
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS shipping_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS shipping_address VARCHAR(255),
    ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100),
    ADD COLUMN IF NOT EXISTS shipping_zip VARCHAR(20),
    ADD COLUMN IF NOT EXISTS shipping_country VARCHAR(100),
    ADD COLUMN IF NOT EXISTS shipping_phone VARCHAR(30),
    ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
