package com.maltaland.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;

public record CategoryRequestDTO(
        @NotBlank(message = "Name is required")
        String name,

        @NotBlank(message = "Slug is required")
        String slug
){

}
