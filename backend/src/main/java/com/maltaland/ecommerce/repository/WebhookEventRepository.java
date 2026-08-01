package com.maltaland.ecommerce.repository;

import com.maltaland.ecommerce.entity.WebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WebhookEventRepository extends JpaRepository<WebhookEvent, Long> {

    boolean existsByStripeEventId(String stripeEventId);
}
