package com.maltaland.ecommerce.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BankTransferResponseDTO(
        Long orderId,
        BigDecimal amount,
        String reference,
        String provider,
        String accountHolder,
        String iban,
        String bic,
        LocalDateTime expiresAt
) {}
