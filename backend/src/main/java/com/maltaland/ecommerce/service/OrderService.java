package com.maltaland.ecommerce.service;

import com.maltaland.ecommerce.dto.OrderRequestDTO;
import com.maltaland.ecommerce.dto.OrderResponseDTO;
import com.maltaland.ecommerce.entity.Order;
import com.maltaland.ecommerce.entity.OrderItem;
import com.maltaland.ecommerce.entity.Product;
import com.maltaland.ecommerce.entity.User;
import com.maltaland.ecommerce.exception.ResourceNotFoundException;
import com.maltaland.ecommerce.mapper.OrderMapper;
import com.maltaland.ecommerce.repository.OrderRepository;
import com.maltaland.ecommerce.repository.ProductRepository;
import com.maltaland.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderMapper orderMapper;

    public OrderResponseDTO create(OrderRequestDTO dto) {
        User user = userRepository.findByEmail(dto.customerEmail())
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setName(dto.customerName());
                    newUser.setEmail(dto.customerEmail());
                    newUser.setPassword(UUID.randomUUID().toString());
                    newUser.setRegisteredAt(LocalDateTime.now());
                    return userRepository.save(newUser);
                });

        Order order = new Order();
        order.setUser(user);
        order.setCreatedAt(LocalDateTime.now());
        order.setStatus("PENDING");

        List<OrderItem> items = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (OrderRequestDTO.OrderItemRequest itemDto : dto.items()) {
            Product product = productRepository.findById(itemDto.productId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Product not found with id: " + itemDto.productId()));

            if (product.getStock() - product.getReservedStock() < itemDto.quantity()) {
                throw new IllegalStateException(
                        "Insufficient stock for product: " + product.getName());
            }

            product.setReservedStock(product.getReservedStock() + itemDto.quantity());

            BigDecimal unitPrice = product.getPrice();
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setQuantity(itemDto.quantity());
            item.setUnitPrice(unitPrice);

            items.add(item);
            total = total.add(unitPrice.multiply(BigDecimal.valueOf(itemDto.quantity())));
        }

        order.setItems(items);
        order.setTotal(total);

        Order saved = orderRepository.save(order);
        return orderMapper.toOrderResponseDTO(saved);
    }
}
