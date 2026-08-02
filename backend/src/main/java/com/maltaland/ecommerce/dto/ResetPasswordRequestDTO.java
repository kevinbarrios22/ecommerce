package com.maltaland.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequestDTO(
        @NotBlank(message = "New password is required")
        @Size(min = 8, message = "Password must have at least 8 characters")
        String newPassword
) {
}
