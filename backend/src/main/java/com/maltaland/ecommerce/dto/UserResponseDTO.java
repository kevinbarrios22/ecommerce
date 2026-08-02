package com.maltaland.ecommerce.dto;

import java.time.LocalDateTime;

public record UserResponseDTO(
        Long id,
        String name,
        String email,
        String role,
        LocalDateTime registeredAt
) {
}
