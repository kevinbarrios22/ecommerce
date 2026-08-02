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
        String paymentMethod,
        LocalDateTime paidAt,
        LocalDateTime shippedAt,
        LocalDateTime deliveredAt,
        String shippingName,
        String shippingAddress,
        String shippingCity,
        String shippingZip,
        String shippingCountry,
        String shippingPhone,
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
