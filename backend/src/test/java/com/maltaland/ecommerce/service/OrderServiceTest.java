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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    private final OrderMapper orderMapper = new OrderMapper();
    private OrderService orderService;

    private User existingUser;
    private Product availableProduct;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(orderRepository, productRepository, userRepository, orderMapper);

        existingUser = new User();
        existingUser.setId(1L);
        existingUser.setName("Existing");
        existingUser.setEmail("existing@test.com");

        availableProduct = new Product();
        availableProduct.setId(1L);
        availableProduct.setName("Test Product");
        availableProduct.setPrice(BigDecimal.valueOf(10.00));
        availableProduct.setStock(10);
        availableProduct.setReservedStock(0);
    }

    @Test
    void create_withoutStripe_guestUser_success() {
        String email = "guest@test.com";
        OrderRequestDTO dto = new OrderRequestDTO("Guest", email,
                List.of(new OrderRequestDTO.OrderItemRequest(1L, 2)), null);

        User guestUser = new User();
        guestUser.setId(2L);
        guestUser.setEmail(email);
        guestUser.setName("Guest");

        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(guestUser);
        when(productRepository.findById(1L)).thenReturn(Optional.of(availableProduct));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(1L);
            return o;
        });

        OrderResponseDTO result = orderService.create(dto);

        assertThat(result.status()).isEqualTo("PENDING");
        assertThat(result.total()).isEqualByComparingTo(BigDecimal.valueOf(20.00));
        assertThat(result.items()).hasSize(1);
        assertThat(result.items().getFirst().productName()).isEqualTo("Test Product");
        assertThat(result.items().getFirst().subtotal()).isEqualByComparingTo(BigDecimal.valueOf(20.00));

        verify(userRepository).save(any(User.class));
        verify(productRepository).findById(1L);
        verify(orderRepository).save(any(Order.class));
    }

    @Test
    void create_withoutStripe_existingUser_success() {
        OrderRequestDTO dto = new OrderRequestDTO("Existing", "existing@test.com",
                List.of(new OrderRequestDTO.OrderItemRequest(1L, 1)), null);

        when(userRepository.findByEmail("existing@test.com")).thenReturn(Optional.of(existingUser));
        when(productRepository.findById(1L)).thenReturn(Optional.of(availableProduct));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(1L);
            return o;
        });

        OrderResponseDTO result = orderService.create(dto);

        assertThat(result.status()).isEqualTo("PENDING");
        assertThat(result.total()).isEqualByComparingTo(BigDecimal.valueOf(10.00));

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void create_withStripe_success() {
        String piId = "pi_succeeded";
        OrderRequestDTO dto = new OrderRequestDTO("Existing", "existing@test.com",
                List.of(new OrderRequestDTO.OrderItemRequest(1L, 1)), piId);

        when(userRepository.findByEmail("existing@test.com")).thenReturn(Optional.of(existingUser));
        when(productRepository.findById(1L)).thenReturn(Optional.of(availableProduct));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(1L);
            return o;
        });

        try (MockedStatic<PaymentIntent> mocked = mockStatic(PaymentIntent.class)) {
            PaymentIntent intent = mock(PaymentIntent.class);
            when(intent.getStatus()).thenReturn("succeeded");
            mocked.when(() -> PaymentIntent.retrieve(piId)).thenReturn(intent);

            OrderResponseDTO result = orderService.create(dto);

            assertThat(result.status()).isEqualTo("PAID");
            assertThat(result.total()).isEqualByComparingTo(BigDecimal.valueOf(10.00));

            mocked.verify(() -> PaymentIntent.retrieve(piId));
        }
    }

    @Test
    void create_withStripe_paymentNotCompleted_throws() {
        String piId = "pi_incomplete";
        OrderRequestDTO dto = new OrderRequestDTO("Existing", "existing@test.com",
                List.of(new OrderRequestDTO.OrderItemRequest(1L, 1)), piId);

        when(userRepository.findByEmail("existing@test.com")).thenReturn(Optional.of(existingUser));

        try (MockedStatic<PaymentIntent> mocked = mockStatic(PaymentIntent.class)) {
            PaymentIntent intent = mock(PaymentIntent.class);
            when(intent.getStatus()).thenReturn("requires_payment_method");
            mocked.when(() -> PaymentIntent.retrieve(piId)).thenReturn(intent);

            IllegalStateException ex = assertThrows(IllegalStateException.class,
                    () -> orderService.create(dto));
            assertThat(ex.getMessage()).contains("Payment has not been completed");

            verify(orderRepository, never()).save(any());
        }
    }

    @Test
    void create_withStripe_stripeException_throws() {
        String piId = "pi_error";
        OrderRequestDTO dto = new OrderRequestDTO("Existing", "existing@test.com",
                List.of(new OrderRequestDTO.OrderItemRequest(1L, 1)), piId);

        when(userRepository.findByEmail("existing@test.com")).thenReturn(Optional.of(existingUser));

        try (MockedStatic<PaymentIntent> mocked = mockStatic(PaymentIntent.class)) {
            mocked.when(() -> PaymentIntent.retrieve(piId)).thenThrow(mock(StripeException.class));

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> orderService.create(dto));
            assertThat(ex.getMessage()).contains("Failed to verify payment");

            verify(orderRepository, never()).save(any());
        }
    }

    @Test
    void create_insufficientStock_throws() {
        availableProduct.setStock(5);
        availableProduct.setReservedStock(4);

        OrderRequestDTO dto = new OrderRequestDTO("Existing", "existing@test.com",
                List.of(new OrderRequestDTO.OrderItemRequest(1L, 2)), null);

        when(userRepository.findByEmail("existing@test.com")).thenReturn(Optional.of(existingUser));
        when(productRepository.findById(1L)).thenReturn(Optional.of(availableProduct));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> orderService.create(dto));
        assertThat(ex.getMessage()).contains("Insufficient stock");

        verify(orderRepository, never()).save(any());
    }

    @Test
    void create_productNotFound_throws() {
        OrderRequestDTO dto = new OrderRequestDTO("Existing", "existing@test.com",
                List.of(new OrderRequestDTO.OrderItemRequest(99L, 1)), null);

        when(userRepository.findByEmail("existing@test.com")).thenReturn(Optional.of(existingUser));
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> orderService.create(dto));

        verify(orderRepository, never()).save(any());
    }

    @Test
    void create_reservesStockCorrectly() {
        OrderRequestDTO dto = new OrderRequestDTO("Existing", "existing@test.com",
                List.of(new OrderRequestDTO.OrderItemRequest(1L, 3)), null);

        when(userRepository.findByEmail("existing@test.com")).thenReturn(Optional.of(existingUser));
        when(productRepository.findById(1L)).thenReturn(Optional.of(availableProduct));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(1L);
            return o;
        });

        orderService.create(dto);

        assertThat(availableProduct.getReservedStock()).isEqualTo(3);
    }

    @Test
    void create_calculatesTotalCorrectly() {
        Product product2 = new Product();
        product2.setId(2L);
        product2.setName("Second Product");
        product2.setPrice(BigDecimal.valueOf(15.50));
        product2.setStock(20);
        product2.setReservedStock(0);

        OrderRequestDTO dto = new OrderRequestDTO("Existing", "existing@test.com",
                List.of(
                        new OrderRequestDTO.OrderItemRequest(1L, 2),
                        new OrderRequestDTO.OrderItemRequest(2L, 3)
                ), null);

        when(userRepository.findByEmail("existing@test.com")).thenReturn(Optional.of(existingUser));
        when(productRepository.findById(1L)).thenReturn(Optional.of(availableProduct));
        when(productRepository.findById(2L)).thenReturn(Optional.of(product2));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(1L);
            return o;
        });

        OrderResponseDTO result = orderService.create(dto);

        // 10.00 * 2 + 15.50 * 3 = 20.00 + 46.50 = 66.50
        assertThat(result.total()).isEqualByComparingTo(BigDecimal.valueOf(66.50));
        assertThat(result.items()).hasSize(2);
    }
}
