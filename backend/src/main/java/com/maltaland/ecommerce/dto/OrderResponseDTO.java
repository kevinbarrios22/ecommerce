package com.maltaland.ecommerce.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponseDTO(
        Long id,
        String status,
        BigDecimal total,
        String customerName,
        String customerEmail,
        String stripePaymentIntentId,
        LocalDateTime paidAt,
        LocalDateTime createdAt,
        List<OrderItemResponse> items
) {
    public record OrderItemResponse(
            Long productId,
            String productName,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal subtotal
    ) {}
}
