package com.maltaland.ecommerce.repository;

import com.maltaland.ecommerce.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
    boolean existsByCategoryId(Long categoryId);
    Page<Product> findByNameContainingIgnoreCase(String name, Pageable pageable);
}