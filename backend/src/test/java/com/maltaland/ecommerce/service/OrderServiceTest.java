package com.maltaland.ecommerce.service;

import com.maltaland.ecommerce.dto.OrderResponseDTO;
import com.maltaland.ecommerce.entity.Order;
import com.maltaland.ecommerce.entity.OrderItem;
import com.maltaland.ecommerce.entity.Product;
import com.maltaland.ecommerce.entity.User;
import com.maltaland.ecommerce.exception.ResourceNotFoundException;
import com.maltaland.ecommerce.mapper.OrderMapper;
import com.maltaland.ecommerce.repository.OrderRepository;
import com.maltaland.ecommerce.repository.ProductRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private jakarta.persistence.EntityManager entityManager;

    private final OrderMapper orderMapper = new OrderMapper();
    private OrderService orderService;

    private Product product;
    private Order order;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(orderRepository, productRepository, orderMapper, emailService, entityManager);

        product = new Product();
        product.setId(1L);
        product.setName("Test Product");
        product.setPrice(BigDecimal.valueOf(10.00));
        product.setStock(10);
        product.setReservedStock(2);

        User user = new User();
        user.setId(1L);
        user.setName("Customer");
        user.setEmail("customer@test.com");

        OrderItem item = new OrderItem();
        item.setProduct(product);
        item.setQuantity(2);
        item.setUnitPrice(BigDecimal.valueOf(10.00));

        order = new Order();
        order.setId(1L);
        order.setUser(user);
        order.setStatus("PENDING");
        order.setStripePaymentIntentId("pi_123");
        order.setCreatedAt(LocalDateTime.now());
        order.setTotal(BigDecimal.valueOf(23.60));
        order.setItems(List.of(item));

        lenient().when(entityManager.find(eq(Order.class), eq(1L), eq(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)))
                .thenReturn(order);
    }

    @Test
    void confirmPayment_success_movesReservedToSold() {
        try (MockedStatic<PaymentIntent> mocked = mockStatic(PaymentIntent.class)) {
            PaymentIntent intent = mock(PaymentIntent.class);
            when(intent.getStatus()).thenReturn("succeeded");
            mocked.when(() -> PaymentIntent.retrieve("pi_123")).thenReturn(intent);

            when(orderRepository.save(any(Order.class))).thenReturn(order);

            OrderResponseDTO result = orderService.confirmPayment(1L);

            assertThat(result.status()).isEqualTo("PAID");
            assertThat(order.getPaidAt()).isNotNull();
            // 10 stock - 2 qty = 8; 2 reserved - 2 qty = 0
            assertThat(product.getStock()).isEqualTo(8);
            assertThat(product.getReservedStock()).isZero();

            mocked.verify(() -> PaymentIntent.retrieve("pi_123"));
        }
    }

    @Test
    void confirmPayment_alreadyPaid_isIdempotent() {
        order.setStatus("PAID");
        order.setPaidAt(LocalDateTime.now());

        OrderResponseDTO result = orderService.confirmPayment(1L);

        assertThat(result.status()).isEqualTo("PAID");
        // No Stripe call, no inventory change, no save
        verify(orderRepository, never()).save(any());
        assertThat(product.getStock()).isEqualTo(10);
    }

    @Test
    void confirmPayment_intentNotSucceeded_throws() {
        try (MockedStatic<PaymentIntent> mocked = mockStatic(PaymentIntent.class)) {
            PaymentIntent intent = mock(PaymentIntent.class);
            when(intent.getStatus()).thenReturn("requires_payment_method");
            mocked.when(() -> PaymentIntent.retrieve("pi_123")).thenReturn(intent);

            IllegalStateException ex = assertThrows(IllegalStateException.class,
                    () -> orderService.confirmPayment(1L));
            assertThat(ex.getMessage()).contains("Payment has not been completed");

            verify(orderRepository, never()).save(any());
        }
    }

    @Test
    void confirmPayment_stripeException_throws() {
        try (MockedStatic<PaymentIntent> mocked = mockStatic(PaymentIntent.class)) {
            mocked.when(() -> PaymentIntent.retrieve("pi_123")).thenThrow(mock(StripeException.class));

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> orderService.confirmPayment(1L));
            assertThat(ex.getMessage()).contains("Failed to verify payment");

            verify(orderRepository, never()).save(any());
        }
    }

    @Test
    void confirmPayment_noIntent_throws() {
        order.setStripePaymentIntentId(null);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> orderService.confirmPayment(1L));
        assertThat(ex.getMessage()).contains("no payment intent");
    }

    @Test
    void markPaidFromWebhook_movesInventory() {
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        orderService.markPaidFromWebhook(1L);

        assertThat(order.getStatus()).isEqualTo("PAID");
        assertThat(product.getStock()).isEqualTo(8);
        assertThat(product.getReservedStock()).isZero();
    }

    @Test
    void markPaidFromWebhook_alreadyPaid_isNoop() {
        order.setStatus("PAID");

        orderService.markPaidFromWebhook(1L);

        verify(orderRepository, never()).save(any());
    }

    @Test
    void updateStatus_pendingToCancelled_releasesReserved() {
        order.setStatus("PENDING");
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        OrderResponseDTO result = orderService.updateStatus(1L, "CANCELLED");

        assertThat(result.status()).isEqualTo("CANCELLED");
        // 2 reserved - 2 qty = 0; stock untouched (10)
        assertThat(product.getReservedStock()).isZero();
        assertThat(product.getStock()).isEqualTo(10);
    }

    @Test
    void updateStatus_paidToCancelled_restocks() {
        order.setStatus("PAID");
        // simulating a paid order: stock was decremented already
        product.setStock(8);
        product.setReservedStock(0);
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        OrderResponseDTO result = orderService.updateStatus(1L, "CANCELLED");

        assertThat(result.status()).isEqualTo("CANCELLED");
        // 8 stock + 2 qty = 10
        assertThat(product.getStock()).isEqualTo(10);
        assertThat(product.getReservedStock()).isZero();
    }

    @Test
    void updateStatus_invalidTransition_throws() {
        order.setStatus("PENDING");

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> orderService.updateStatus(1L, "DELIVERED"));
        assertThat(ex.getMessage()).contains("Cannot transition");

        verify(orderRepository, never()).save(any());
    }

    @Test
    void cancelExpiredPendingOrders_cancelsAndReleasesStock() {
        order.setCreatedAt(LocalDateTime.now().minusMinutes(30));
        when(orderRepository.findByStatusAndCreatedAtBefore(eq("PENDING"), any(LocalDateTime.class)))
                .thenReturn(List.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        int cancelled = orderService.cancelExpiredPendingOrders(15, 48 * 60);

        assertThat(cancelled).isEqualTo(1);
        assertThat(order.getStatus()).isEqualTo("CANCELLED");
        assertThat(product.getReservedStock()).isZero();
    }

    @Test
    void cancelExpiredPendingOrders_skipsOrdersAlreadyChanged() {
        order.setCreatedAt(LocalDateTime.now().minusMinutes(30));
        when(orderRepository.findByStatusAndCreatedAtBefore(eq("PENDING"), any(LocalDateTime.class)))
                .thenReturn(List.of(order));
        // order was already PAID by the webhook between the query and the reaper tx
        Order alreadyPaid = new Order();
        alreadyPaid.setId(1L);
        alreadyPaid.setStatus("PAID");
        when(entityManager.find(eq(Order.class), eq(1L), eq(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)))
                .thenReturn(alreadyPaid);

        int cancelled = orderService.cancelExpiredPendingOrders(15, 48 * 60);

        assertThat(cancelled).isZero();
        verify(orderRepository, never()).save(any());
    }

    @Test
    void cancelExpiredPendingOrders_keepsRecentBankTransfer() {
        Order transferOrder = new Order();
        transferOrder.setId(2L);
        transferOrder.setStatus("PENDING");
        transferOrder.setPaymentMethod("WISE_TRANSFER");
        transferOrder.setCreatedAt(LocalDateTime.now().minusMinutes(20));

        when(orderRepository.findByStatusAndCreatedAtBefore(eq("PENDING"), any(LocalDateTime.class)))
                .thenReturn(List.of(transferOrder));

        int cancelled = orderService.cancelExpiredPendingOrders(15, 48 * 60);

        assertThat(cancelled).isZero();
        verify(orderRepository, never()).save(any());
    }

    @Test
    void cancelExpiredPendingOrders_cancelsExpiredBankTransfer() {
        Order transferOrder = new Order();
        transferOrder.setId(3L);
        transferOrder.setStatus("PENDING");
        transferOrder.setPaymentMethod("REVOLUT_TRANSFER");
        transferOrder.setCreatedAt(LocalDateTime.now().minusHours(50));
        transferOrder.setUser(order.getUser());
        transferOrder.setItems(List.of());

        when(orderRepository.findByStatusAndCreatedAtBefore(eq("PENDING"), any(LocalDateTime.class)))
                .thenReturn(List.of(transferOrder));
        when(entityManager.find(eq(Order.class), eq(3L), eq(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)))
                .thenReturn(transferOrder);
        when(orderRepository.save(any(Order.class))).thenReturn(transferOrder);

        int cancelled = orderService.cancelExpiredPendingOrders(15, 48 * 60);

        assertThat(cancelled).isEqualTo(1);
        assertThat(transferOrder.getStatus()).isEqualTo("CANCELLED");
    }

    @Test
    void findById_notFound_throws() {
        when(orderRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> orderService.findById(99L));
    }

    @Test
    void findById_success() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        OrderResponseDTO result = orderService.findById(1L);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.items()).hasSize(1);
    }
}
