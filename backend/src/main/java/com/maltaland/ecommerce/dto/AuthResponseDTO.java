package com.maltaland.ecommerce.dto;

public record AuthResponseDTO(
        String token,
        Long userId,
        String name,
        String email,
        String role
) {}
