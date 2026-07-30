package com.maltaland.ecommerce.service;

import com.maltaland.ecommerce.dto.ProductRequestDTO;
import com.maltaland.ecommerce.dto.ProductResponseDTO;
import com.maltaland.ecommerce.entity.Category;
import com.maltaland.ecommerce.entity.Product;
import com.maltaland.ecommerce.exception.ResourceNotFoundException;
import com.maltaland.ecommerce.mapper.ProductMapper;
import com.maltaland.ecommerce.repository.CategoryRepository;
import com.maltaland.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductMapper productMapper;

    @Transactional(readOnly = true)
    public Page<ProductResponseDTO> list(String name, Pageable pageable) {
        if (name != null && !name.isBlank()) {
            return productRepository.findByNameContainingIgnoreCase(name, pageable)
                    .map(productMapper::toProductResponseDTO);
        }
        return productRepository.findAll(pageable)
                .map(productMapper::toProductResponseDTO);
    }

    @Transactional(readOnly = true)
    public ProductResponseDTO getById(Long id) {
        Product product = findProductOrThrow(id);
        return productMapper.toProductResponseDTO(product);
    }

    public ProductResponseDTO create(ProductRequestDTO dto) {
        Category category = findCategoryOrThrow(dto.categoryId());

        Product product = new Product();
        product.setName(dto.name());
        product.setDescription(dto.description());
        product.setPrice(dto.price());
        product.setStock(dto.stock());
        product.setCategory(category);
        product.setImageUrl(dto.imageUrl());
        if (dto.vatPercentage() != null) product.setVatPercentage(dto.vatPercentage());
        if (dto.active() != null) product.setActive(dto.active());
        product.setReleaseDate(dto.releaseDate());

        Product saved = productRepository.save(product);
        return productMapper.toProductResponseDTO(saved);
    }

    public ProductResponseDTO update(Long id, ProductRequestDTO dto) {
        Product product = findProductOrThrow(id);
        Category category = findCategoryOrThrow(dto.categoryId());

        product.setName(dto.name());
        product.setDescription(dto.description());
        product.setPrice(dto.price());
        product.setStock(dto.stock());
        product.setCategory(category);
        product.setImageUrl(dto.imageUrl());
        if (dto.vatPercentage() != null) product.setVatPercentage(dto.vatPercentage());
        if (dto.active() != null) product.setActive(dto.active());
        product.setReleaseDate(dto.releaseDate());

        Product updated = productRepository.save(product);
        return productMapper.toProductResponseDTO(updated);
    }

    public void delete(Long id) {
        Product product = findProductOrThrow(id);
        product.setActive(false);
        productRepository.save(product);
    }

    public ProductResponseDTO toggleActive(Long id) {
        Product product = findProductOrThrow(id);
        product.setActive(!product.getActive());
        return productMapper.toProductResponseDTO(productRepository.save(product));
    }

    private Product findProductOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    private Category findCategoryOrThrow(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));
    }
}