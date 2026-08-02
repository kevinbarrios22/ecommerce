-- V4__add_payment_method.sql
-- Tracks how an order was paid: CARD (Stripe: card/revolut_pay/paypal) or
-- WISE_TRANSFER / REVOLUT_TRANSFER (manual bank transfer, confirmed by staff).
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) NOT NULL DEFAULT 'CARD';
