-- V3__add_payment_intent_unique.sql
-- Enforce database-level idempotency: one Stripe PaymentIntent can only ever
-- produce ONE order. This is the last line of defense against the
-- double-stock-reservation bug even if application code is retried.
-- PostgreSQL allows multiple NULLs in a UNIQUE constraint, so orders without
-- a payment intent (pre-webhook legacy rows) are unaffected.

-- Clean up any pre-existing duplicates before adding the constraint.
-- Keeps the OLDEST order per payment intent, removes newer duplicates.
DELETE FROM order_items
WHERE order_id IN (
    SELECT o.id
    FROM orders o
    JOIN (
        SELECT stripe_payment_intent_id, MIN(id) AS keep_id
        FROM orders
        WHERE stripe_payment_intent_id IS NOT NULL
        GROUP BY stripe_payment_intent_id
        HAVING COUNT(*) > 1
    ) d ON o.stripe_payment_intent_id = d.stripe_payment_intent_id
    WHERE o.id <> d.keep_id
);

DELETE FROM orders o
USING (
    SELECT stripe_payment_intent_id, MIN(id) AS keep_id
    FROM orders
    WHERE stripe_payment_intent_id IS NOT NULL
    GROUP BY stripe_payment_intent_id
    HAVING COUNT(*) > 1
) d
WHERE o.stripe_payment_intent_id = d.stripe_payment_intent_id
  AND o.id <> d.keep_id;

ALTER TABLE orders
    ADD CONSTRAINT uq_orders_stripe_payment_intent UNIQUE (stripe_payment_intent_id);
