package com.maltaland.ecommerce.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record BankTransferRequestDTO(
        @NotBlank(message = "Name is required")
        String customerName,

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String customerEmail,

        @NotEmpty(message = "Order must have at least one item")
        List<PaymentRequestDTO.PaymentItem> items,

        @NotNull(message = "Provider is required")
        Provider provider,

        ShippingAddressDTO shippingAddress
) {
    public enum Provider {
        WISE, REVOLUT
    }
}
