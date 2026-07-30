package com.maltaland.ecommerce.dto;

import java.math.BigDecimal;

public record ProductResponseDTO(
    Long id,
    String name,
    String description,
    BigDecimal price,
    BigDecimal priceWithVat,
    Integer availableStock,
    String categoryName,
    Long categoryId,
    String imageUrl,
    Boolean active
){
}
