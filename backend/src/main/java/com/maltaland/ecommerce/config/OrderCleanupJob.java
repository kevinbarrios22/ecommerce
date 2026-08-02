package com.maltaland.ecommerce.config;

import com.maltaland.ecommerce.service.OrderService;
import com.maltaland.ecommerce.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Reaper job: releases stock reserved by PENDING orders that were never paid
 * (abandoned checkouts). Stripe does not emit an event for a PaymentIntent that
 * is created but never confirmed, so without this job reserved stock would grow
 * forever. Runs every 10 minutes. Card/online orders expire after 15 minutes;
 * manual bank-transfer orders get the 48h transfer window instead.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderCleanupJob {

    private static final int PENDING_EXPIRY_MINUTES = 15;
    private static final int TRANSFER_EXPIRY_MINUTES =
            (int) (PaymentService.BANK_TRANSFER_EXPIRY_HOURS * 60);

    private final OrderService orderService;

    @Scheduled(fixedDelay = 600_000)
    public void releaseExpiredPendingOrders() {
        try {
            int cancelled = orderService.cancelExpiredPendingOrders(PENDING_EXPIRY_MINUTES, TRANSFER_EXPIRY_MINUTES);
            if (cancelled > 0) {
                log.info("Cancelled {} expired pending orders", cancelled);
            }
        } catch (Exception e) {
            log.error("Order cleanup job failed", e);
        }
    }
}
