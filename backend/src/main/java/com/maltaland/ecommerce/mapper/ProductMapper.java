package com.maltaland.ecommerce.mapper;

import com.maltaland.ecommerce.dto.ProductResponseDTO;
import com.maltaland.ecommerce.entity.Product;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class ProductMapper {

    public ProductResponseDTO toProductResponseDTO(Product product) {
        BigDecimal vatMultiplier = BigDecimal.ONE
                .add(BigDecimal.valueOf(product.getVatPercentage())
                        .divide(BigDecimal.valueOf(100)));


        BigDecimal priceWithVat = product.getPrice()
                .multiply(vatMultiplier)
                .setScale(2, RoundingMode.HALF_UP);


        return new ProductResponseDTO(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                priceWithVat,
                product.getStock() - product.getReservedStock(),
                product.getCategory().getName(),
                product.getCategory().getId(),
                product.getImageUrl(),
                product.getActive()

        );

    }

}
