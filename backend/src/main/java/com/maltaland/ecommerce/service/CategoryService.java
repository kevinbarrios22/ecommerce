package com.maltaland.ecommerce.service;

import com.maltaland.ecommerce.dto.CategoryRequestDTO;
import com.maltaland.ecommerce.dto.CategoryResponseDTO;
import com.maltaland.ecommerce.entity.Category;
import com.maltaland.ecommerce.exception.ResourceNotFoundException;
import com.maltaland.ecommerce.mapper.CategoryMapper;
import com.maltaland.ecommerce.repository.CategoryRepository;
import com.maltaland.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
@Service
@RequiredArgsConstructor
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponseDTO> list(){
        return categoryRepository.findAll().stream()
                .map(categoryMapper::toCategoryResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponseDTO getById(Long id){
        Category category = findCategoryOrThrow(id);
        return categoryMapper.toCategoryResponseDTO(category);
    }

    public CategoryResponseDTO create(CategoryRequestDTO dto){
        Category category = new Category();
        category.setName(dto.name());
        category.setSlug(dto.slug());

        Category saved =  categoryRepository.save(category);
        return categoryMapper.toCategoryResponseDTO(saved);
    }


    public CategoryResponseDTO update(Long id, CategoryRequestDTO dto){
        Category category = findCategoryOrThrow(id);
        category.setName(dto.name());
        category.setSlug(dto.slug());

        Category update = categoryRepository.save(category);
        return categoryMapper.toCategoryResponseDTO(update);
    }


    public void delete(Long id){
        Category category = findCategoryOrThrow(id);
        if (productRepository.existsByCategoryId(id)) {
            throw new IllegalStateException(
                    "Cannot delete category with id " + id + ": it has associated products");
        }
        categoryRepository.delete(category);
    }

    private Category findCategoryOrThrow(Long id){
        return categoryRepository.findById(id)
                .orElseThrow(()-> new ResourceNotFoundException(
                        "Category not found with id: " + id));
    }
}
