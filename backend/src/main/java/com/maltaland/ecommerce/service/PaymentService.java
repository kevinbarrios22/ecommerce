package com.maltaland.ecommerce.service;

import com.maltaland.ecommerce.dto.PaymentRequestDTO;
import com.maltaland.ecommerce.dto.PaymentResponseDTO;
import com.maltaland.ecommerce.entity.Order;
import com.maltaland.ecommerce.entity.OrderItem;
import com.maltaland.ecommerce.entity.Product;
import com.maltaland.ecommerce.entity.User;
import com.maltaland.ecommerce.exception.ResourceNotFoundException;
import com.maltaland.ecommerce.repository.OrderRepository;
import com.maltaland.ecommerce.repository.ProductRepository;
import com.maltaland.ecommerce.repository.UserRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    /**
     * Creates the Stripe PaymentIntent and, in the same transaction, creates the
     * order as PENDING with the intent id attached and reserves stock. This is the
     * core of the Option B flow: the order exists BEFORE payment completes, so the
     * webhook only needs to transition it to PAID.
     */
    @Transactional
    public PaymentResponseDTO createPaymentIntent(PaymentRequestDTO dto) {
        validateStock(dto);

        BigDecimal total = computeTotal(dto);
        long amountCents = total.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .longValue();

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountCents)
                .setCurrency("eur")
                .addAllPaymentMethodType(List.of("card", "revolut_pay", "paypal"))
                .putMetadata("customerEmail", dto.customerEmail())
                .putMetadata("customerName", dto.customerName())
                .build();

        try {
            PaymentIntent intent = PaymentIntent.create(params);
            Order order = createPendingOrder(dto, intent.getId(), total);
            return new PaymentResponseDTO(
                    intent.getClientSecret(),
                    intent.getId(),
                    order.getId(),
                    new BigDecimal(intent.getAmount())
                            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
        } catch (StripeException e) {
            throw new RuntimeException("Failed to create payment intent: " + e.getMessage(), e);
        }
    }

    private void validateStock(PaymentRequestDTO dto) {
        for (PaymentRequestDTO.PaymentItem itemDto : dto.items()) {
            Product product = findProductOrThrow(itemDto.productId());
            if (product.getStock() - product.getReservedStock() < itemDto.quantity()) {
                throw new IllegalStateException("Insufficient stock for product: " + product.getName());
            }
        }
    }

    private BigDecimal computeTotal(PaymentRequestDTO dto) {
        BigDecimal total = BigDecimal.ZERO;
        for (PaymentRequestDTO.PaymentItem itemDto : dto.items()) {
            Product product = findProductOrThrow(itemDto.productId());
            BigDecimal vatMultiplier = BigDecimal.ONE.add(
                    BigDecimal.valueOf(product.getVatPercentage()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
            BigDecimal priceWithVat = product.getPrice().multiply(vatMultiplier);
            total = total.add(priceWithVat.multiply(BigDecimal.valueOf(itemDto.quantity())));
        }
        return total;
    }

    private Order createPendingOrder(PaymentRequestDTO dto, String paymentIntentId, BigDecimal total) {
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
        order.setStatus("PENDING");
        order.setStripePaymentIntentId(paymentIntentId);
        order.setCreatedAt(LocalDateTime.now());
        order.setTotal(total);

        List<OrderItem> items = new ArrayList<>();
        for (PaymentRequestDTO.PaymentItem itemDto : dto.items()) {
            Product product = findProductOrThrow(itemDto.productId());
            if (product.getStock() - product.getReservedStock() < itemDto.quantity()) {
                throw new IllegalStateException("Insufficient stock for product: " + product.getName());
            }
            product.setReservedStock(product.getReservedStock() + itemDto.quantity());

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setQuantity(itemDto.quantity());
            item.setUnitPrice(product.getPrice());
            items.add(item);
        }

        order.setItems(items);
        return orderRepository.save(order);
    }

    private Product findProductOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }
}
