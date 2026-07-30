package com.maltaland.ecommerce.controller;

import com.maltaland.ecommerce.dto.OrderRequestDTO;
import com.maltaland.ecommerce.dto.OrderResponseDTO;
import com.maltaland.ecommerce.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponseDTO> create(@Valid @RequestBody OrderRequestDTO dto) {
        OrderResponseDTO created = orderService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
