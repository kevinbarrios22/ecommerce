package com.maltaland.ecommerce.dto;

import java.math.BigDecimal;

public record PaymentResponseDTO(
        String clientSecret,
        String paymentIntentId,
        Long orderId,
        BigDecimal amount
) {}
