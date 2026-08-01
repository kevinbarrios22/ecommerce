package com.maltaland.ecommerce.service;

import com.maltaland.ecommerce.entity.Order;
import com.maltaland.ecommerce.entity.WebhookEvent;
import com.maltaland.ecommerce.repository.OrderRepository;
import com.maltaland.ecommerce.repository.WebhookEventRepository;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebhookService {

    private final WebhookEventRepository webhookEventRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;

    /**
     * Processes a verified Stripe event. Idempotency is enforced at two levels:
     * 1) the webhook_events table (one row per stripe_event_id, checked here and
     *    backed by a UNIQUE constraint in the DB), and
     * 2) the order state itself (marking an already-PAID order is a no-op).
     *
     * The event id is recorded in the SAME transaction as the order update, so a
     * crash between the two rolls back everything and Stripe retries safely.
     */
    @Transactional
    public void processEvent(Event event) {
        String eventId = event.getId();

        if (webhookEventRepository.existsByStripeEventId(eventId)) {
            log.info("Duplicate Stripe event {} already processed, skipping", eventId);
            return;
        }

        switch (event.getType()) {
            case "payment_intent.succeeded" -> handlePaymentSucceeded(event);
            case "payment_intent.payment_failed" -> handlePaymentFailed(event);
            default -> log.info("Ignoring Stripe event type {}", event.getType());
        }

        // Only reached if no exception was thrown. If the order update failed, this
        // save rolls back with the transaction and Stripe will retry the event.
        webhookEventRepository.save(new WebhookEvent(eventId));
    }

    private void handlePaymentSucceeded(Event event) {
        PaymentIntent intent = extractPaymentIntent(event);
        if (intent == null) {
            log.warn("Webhook {}: could not deserialize PaymentIntent", event.getId());
            return;
        }

        Order order = orderRepository.findByStripePaymentIntentId(intent.getId()).orElse(null);
        if (order == null) {
            log.error("Webhook {}: no order found for payment intent {}", event.getId(), intent.getId());
            return;
        }

        switch (order.getStatus()) {
            case "PAID" -> log.info("Order {} already PAID, nothing to do", order.getId());
            case "CANCELLED" -> log.warn(
                    "Webhook {}: payment succeeded for CANCELLED order {}. Manual review required.",
                    event.getId(), order.getId());
            case "PENDING" -> {
                // Defense in depth: amount on the signed event must match the order total.
                if (intent.getAmount() != null
                        && intent.getAmount() != order.getTotal().movePointRight(2).longValue()) {
                    log.error(
                            "Webhook {}: amount mismatch for order {}. Intent={}, order={}. Manual review required.",
                            event.getId(), order.getId(), intent.getAmount(), order.getTotal());
                    return;
                }
                orderService.markPaidFromWebhook(order.getId());
            }
            default -> log.warn(
                    "Webhook {}: payment succeeded for order {} in unexpected status {}.",
                    event.getId(), order.getId(), order.getStatus());
        }
    }

    private void handlePaymentFailed(Event event) {
        PaymentIntent intent = extractPaymentIntent(event);
        if (intent == null) {
            log.warn("Webhook {}: could not deserialize PaymentIntent", event.getId());
            return;
        }

        Order order = orderRepository.findByStripePaymentIntentId(intent.getId()).orElse(null);
        if (order == null) {
            log.warn("Webhook {}: no order found for failed payment intent {}", event.getId(), intent.getId());
            return;
        }

        if ("PENDING".equals(order.getStatus())) {
            // Payment failed or was abandoned: release the reservation and cancel.
            orderService.updateStatus(order.getId(), "CANCELLED");
            log.info("Order {} cancelled after payment failure", order.getId());
        }
    }

    private PaymentIntent extractPaymentIntent(Event event) {
        return event.getDataObjectDeserializer()
                .getObject()
                .filter(obj -> obj instanceof PaymentIntent)
                .map(obj -> (PaymentIntent) obj)
                .orElse(null);
    }
}
