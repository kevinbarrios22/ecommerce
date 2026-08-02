package com.maltaland.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;

public record RoleUpdateRequestDTO(
        @NotBlank(message = "Role is required")
        String role
) {
}
