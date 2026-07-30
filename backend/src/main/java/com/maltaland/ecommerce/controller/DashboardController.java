package com.maltaland.ecommerce.controller;

import com.maltaland.ecommerce.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(orderService.getDashboardStats());
    }
}
