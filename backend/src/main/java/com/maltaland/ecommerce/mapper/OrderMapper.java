package com.maltaland.ecommerce.mapper;

import com.maltaland.ecommerce.dto.OrderResponseDTO;
import com.maltaland.ecommerce.entity.Order;
import com.maltaland.ecommerce.entity.OrderItem;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class OrderMapper {

    public OrderResponseDTO toOrderResponseDTO(Order order) {
        List<OrderResponseDTO.OrderItemResponse> itemResponses = order.getItems().stream()
                .map(this::toItemResponse)
                .toList();

        return new OrderResponseDTO(
                order.getId(),
                order.getStatus(),
                order.getTotal(),
                order.getCreatedAt(),
                itemResponses
        );
    }

    private OrderResponseDTO.OrderItemResponse toItemResponse(OrderItem item) {
        return new OrderResponseDTO.OrderItemResponse(
                item.getProduct().getId(),
                item.getProduct().getName(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
        );
    }
}
