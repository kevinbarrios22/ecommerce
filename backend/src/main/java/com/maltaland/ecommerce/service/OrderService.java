package com.maltaland.ecommerce.service;

import com.maltaland.ecommerce.dto.OrderResponseDTO;
import com.maltaland.ecommerce.entity.Order;
import com.maltaland.ecommerce.entity.OrderItem;
import com.maltaland.ecommerce.entity.Product;
import com.maltaland.ecommerce.exception.ResourceNotFoundException;
import com.maltaland.ecommerce.mapper.OrderMapper;
import com.maltaland.ecommerce.repository.OrderRepository;
import com.maltaland.ecommerce.repository.ProductRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class OrderService {

    private static final Set<String> VALID_TRANSITIONS = Set.of(
            "PENDING->PAID", "PAID->SHIPPED", "SHIPPED->DELIVERED",
            "PENDING->CANCELLED", "PAID->CANCELLED", "SHIPPED->CANCELLED"
    );

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final OrderMapper orderMapper;

    public List<OrderResponseDTO> findAll(String status, String email, LocalDate start, LocalDate end) {
        LocalDateTime startDt = start != null ? start.atStartOfDay() : null;
        LocalDateTime endDt = end != null ? end.atTime(LocalTime.MAX) : null;
        return orderRepository.findByFilters(status, email, startDt, endDt).stream()
                .map(orderMapper::toOrderResponseDTO)
                .toList();
    }

    public OrderResponseDTO findById(Long id) {
        return orderMapper.toOrderResponseDTO(findOrderOrThrow(id));
    }

    /**
     * Synchronous backstop for the frontend: verifies the PaymentIntent with
     * Stripe and, if succeeded, transitions the order PENDING -> PAID moving
     * reserved stock into sold stock. The webhook remains the authoritative
     * source, this just gives the customer instant confirmation.
     */
    public OrderResponseDTO confirmPayment(Long id) {
        Order order = findOrderOrThrow(id);

        if ("PAID".equals(order.getStatus())) {
            return orderMapper.toOrderResponseDTO(order);
        }
        if (!"PENDING".equals(order.getStatus())) {
            throw new IllegalStateException("Cannot confirm an order in status " + order.getStatus());
        }
        if (order.getStripePaymentIntentId() == null) {
            throw new IllegalStateException("Order has no payment intent");
        }

        try {
            PaymentIntent intent = PaymentIntent.retrieve(order.getStripePaymentIntentId());
            if (!"succeeded".equals(intent.getStatus())) {
                throw new IllegalStateException("Payment has not been completed");
            }
        } catch (StripeException e) {
            throw new RuntimeException("Failed to verify payment: " + e.getMessage(), e);
        }

        applyPaid(order);
        return orderMapper.toOrderResponseDTO(orderRepository.save(order));
    }

    /**
     * Called by the webhook after signature verification and the event-level
     * idempotency check. No Stripe API call: the signed event payload is trusted.
     */
    public void markPaidFromWebhook(Long id) {
        Order order = findOrderOrThrow(id);
        if ("PAID".equals(order.getStatus())) {
            return;
        }
        if (!"PENDING".equals(order.getStatus())) {
            throw new IllegalStateException("Cannot mark order " + id + " (" + order.getStatus() + ") as PAID");
        }
        applyPaid(order);
        orderRepository.save(order);
    }

    public OrderResponseDTO updateStatus(Long id, String newStatus) {
        Order order = findOrderOrThrow(id);
        String oldStatus = order.getStatus();

        String transition = oldStatus + "->" + newStatus;
        if (!VALID_TRANSITIONS.contains(transition)) {
            throw new IllegalStateException("Cannot transition from " + oldStatus + " to " + newStatus);
        }

        order.setStatus(newStatus);

        if ("PAID".equals(newStatus)) {
            if (order.getPaidAt() == null) {
                order.setPaidAt(LocalDateTime.now());
            }
            // PENDING -> PAID: reservation becomes a real sale
            if ("PENDING".equals(oldStatus)) {
                moveReservedToSold(order);
            }
        }

        if ("CANCELLED".equals(newStatus)) {
            switch (oldStatus) {
                case "PENDING" -> releaseReserved(order);
                case "PAID" -> restock(order);
                case "SHIPPED" -> restock(order);
                default -> { /* no inventory movement for other states */ }
            }
        }

        return orderMapper.toOrderResponseDTO(orderRepository.save(order));
    }

    /**
     * Reaper job entry point: cancels PENDING orders older than the cutoff and
     * releases their reserved stock. Races against the webhook are handled by
     * re-checking status inside the transaction and by optimistic locking on the
     * Product rows (@Version).
     */
    public int cancelExpiredPendingOrders(int minutes) {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(minutes);
        List<Order> expired = orderRepository.findByStatusAndCreatedAtBefore("PENDING", cutoff);

        int cancelled = 0;
        for (Order order : expired) {
            try {
                Order fresh = findOrderOrThrow(order.getId());
                if (!"PENDING".equals(fresh.getStatus())) {
                    continue; // webhook or admin got there first
                }
                updateStatus(fresh.getId(), "CANCELLED");
                cancelled++;
            } catch (Exception e) {
                log.warn("Failed to cancel expired pending order {}", order.getId(), e);
            }
        }
        return cancelled;
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

    private void applyPaid(Order order) {
        order.setStatus("PAID");
        order.setPaidAt(LocalDateTime.now());
        moveReservedToSold(order);
    }

    /** PENDING -> PAID: reserved units become sold units. */
    private void moveReservedToSold(Order order) {
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setStock(product.getStock() - item.getQuantity());
            product.setReservedStock(product.getReservedStock() - item.getQuantity());
        }
    }

    /** PENDING -> CANCELLED: free the hold, nothing was ever sold. */
    private void releaseReserved(Order order) {
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setReservedStock(Math.max(0, product.getReservedStock() - item.getQuantity()));
        }
    }

    /** PAID/SHIPPED -> CANCELLED: the sold units come back to stock. */
    private void restock(Order order) {
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setStock(product.getStock() + item.getQuantity());
            product.setReservedStock(Math.max(0, product.getReservedStock() - item.getQuantity()));
        }
    }

    private Order findOrderOrThrow(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }
}
