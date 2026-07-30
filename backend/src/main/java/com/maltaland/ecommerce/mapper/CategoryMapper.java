package com.maltaland.ecommerce.mapper;

import com.maltaland.ecommerce.dto.CategoryResponseDTO;
import com.maltaland.ecommerce.entity.Category;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public CategoryResponseDTO toCategoryResponseDTO(Category category) {
        return new CategoryResponseDTO(
                category.getId(),
                category.getName(),
                category.getSlug()
        );
    }
}
