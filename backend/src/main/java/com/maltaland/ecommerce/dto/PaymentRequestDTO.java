package com.maltaland.ecommerce.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record PaymentRequestDTO(
        @NotBlank(message = "Name is required")
        String customerName,

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String customerEmail,

        @NotEmpty(message = "Order must have at least one item")
        List<PaymentItem> items
) {
    public record PaymentItem(
            @NotNull(message = "Product id is required")
            Long productId,

            @NotNull(message = "Quantity is required")
            @Positive(message = "Quantity must be greater than zero")
            Integer quantity
    ) {}
}
