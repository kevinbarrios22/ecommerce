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
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {

    private static final Set<String> VALID_TRANSITIONS = Set.of(
            "PENDING->PAID", "PAID->SHIPPED", "SHIPPED->DELIVERED",
            "PENDING->CANCELLED", "PAID->CANCELLED", "SHIPPED->CANCELLED"
    );

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderMapper orderMapper;

    public List<OrderResponseDTO> findAll(String status, String email, LocalDate start, LocalDate end) {
        LocalDateTime startDt = start != null ? start.atStartOfDay() : null;
        LocalDateTime endDt = end != null ? end.atTime(LocalTime.MAX) : null;
        return orderRepository.findByFilters(status, email, startDt, endDt).stream()
                .map(orderMapper::toOrderResponseDTO)
                .toList();
    }

    public OrderResponseDTO findById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
        return orderMapper.toOrderResponseDTO(order);
    }

    public OrderResponseDTO updateStatus(Long id, String newStatus) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        String transition = order.getStatus() + "->" + newStatus;
        if (!VALID_TRANSITIONS.contains(transition)) {
            throw new IllegalStateException("Cannot transition from " + order.getStatus() + " to " + newStatus);
        }

        order.setStatus(newStatus);
        if ("PAID".equals(newStatus) && order.getPaidAt() == null) {
            order.setPaidAt(LocalDateTime.now());
        }

        return orderMapper.toOrderResponseDTO(orderRepository.save(order));
    }

    public Map<String, Object> getDashboardStats() {
        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime weekStart = today.minusDays(7).atStartOfDay();

        long ordersToday = orderRepository.countByCreatedAtAfter(todayStart);
        long ordersThisWeek = orderRepository.countByCreatedAtAfter(weekStart);
        BigDecimal revenue = orderRepository.totalRevenue();
        long pendingOrders = orderRepository.countByStatus("PENDING");
        long lowStockProducts = productRepository.countByStockLessThan(5);

        return Map.of(
                "ordersToday", ordersToday,
                "ordersThisWeek", ordersThisWeek,
                "revenue", revenue,
                "lowStockProducts", lowStockProducts,
                "pendingOrders", pendingOrders
        );
    }

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

        if (dto.stripePaymentIntentId() != null) {
            try {
                PaymentIntent intent = PaymentIntent.retrieve(dto.stripePaymentIntentId());
                if (!"succeeded".equals(intent.getStatus())) {
                    throw new IllegalStateException("Payment has not been completed");
                }
            } catch (StripeException e) {
                throw new RuntimeException("Failed to verify payment: " + e.getMessage(), e);
            }
        }

        String status = dto.stripePaymentIntentId() != null ? "PAID" : "PENDING";

        Order order = new Order();
        order.setUser(user);
        order.setCreatedAt(LocalDateTime.now());
        order.setStatus(status);
        order.setStripePaymentIntentId(dto.stripePaymentIntentId());
        if ("PAID".equals(status)) {
            order.setPaidAt(LocalDateTime.now());
        }

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
