package com.maltaland.ecommerce.service;

import com.maltaland.ecommerce.config.BankTransferProperties;
import com.maltaland.ecommerce.dto.BankTransferRequestDTO;
import com.maltaland.ecommerce.dto.BankTransferResponseDTO;
import com.maltaland.ecommerce.dto.PaymentRequestDTO;
import com.maltaland.ecommerce.dto.PaymentResponseDTO;
import com.maltaland.ecommerce.dto.ShippingAddressDTO;
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

    /** How long a manual bank-transfer order stays reserved before auto-cancel. */
    public static final long BANK_TRANSFER_EXPIRY_HOURS = 48;

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final BankTransferProperties bankTransferProperties;
    private final EmailService emailService;

    /**
     * Creates the Stripe PaymentIntent and, in the same transaction, creates the
     * order as PENDING with the intent id attached and reserves stock. This is the
     * core of the Option B flow: the order exists BEFORE payment completes, so the
     * webhook only needs to transition it to PAID.
     */
    @Transactional
    public PaymentResponseDTO createPaymentIntent(PaymentRequestDTO dto) {
        validateStock(dto.items());

        BigDecimal total = computeTotal(dto.items());
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
            Order order = createPendingOrder(dto.customerName(), dto.customerEmail(),
                    dto.items(), intent.getId(), total, "CARD", dto.shippingAddress());
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

    /**
     * Creates a PENDING order without any Stripe intent for a manual bank
     * transfer via Wise or Revolut. Stock is reserved the same way; the order is
     * confirmed manually by staff once the transfer arrives. No money moves
     * automatically, so no provider API is involved.
     */
    @Transactional
    public BankTransferResponseDTO createBankTransferOrder(BankTransferRequestDTO dto) {
        validateStock(dto.items());

        BigDecimal total = computeTotal(dto.items()).setScale(2, RoundingMode.HALF_UP);
        String paymentMethod = switch (dto.provider()) {
            case WISE -> "WISE_TRANSFER";
            case REVOLUT -> "REVOLUT_TRANSFER";
        };

        Order order = createPendingOrder(dto.customerName(), dto.customerEmail(),
                dto.items(), null, total, paymentMethod, dto.shippingAddress());

        BankTransferProperties.Account account = switch (dto.provider()) {
            case WISE -> bankTransferProperties.wise();
            case REVOLUT -> bankTransferProperties.revolut();
        };

        BankTransferResponseDTO response = new BankTransferResponseDTO(
                order.getId(),
                total,
                "MALTALAND-" + order.getId(),
                dto.provider().name(),
                account.accountHolder(),
                account.iban(),
                account.bic(),
                order.getCreatedAt().plusHours(BANK_TRANSFER_EXPIRY_HOURS));

        emailService.sendTransferInstructionsAfterCommit(order.getId(), response);
        return response;
    }

    private void validateStock(List<PaymentRequestDTO.PaymentItem> items) {
        for (PaymentRequestDTO.PaymentItem itemDto : items) {
            Product product = findProductOrThrow(itemDto.productId());
            if (product.getStock() - product.getReservedStock() < itemDto.quantity()) {
                throw new IllegalStateException("Insufficient stock for product: " + product.getName());
            }
        }
    }

    private BigDecimal computeTotal(List<PaymentRequestDTO.PaymentItem> items) {
        BigDecimal total = BigDecimal.ZERO;
        for (PaymentRequestDTO.PaymentItem itemDto : items) {
            Product product = findProductOrThrow(itemDto.productId());
            total = total.add(priceWithVat(product).multiply(BigDecimal.valueOf(itemDto.quantity())));
        }
        return total;
    }

    /** Price with VAT applied, rounded to cents. Must match the total exactly. */
    private BigDecimal priceWithVat(Product product) {
        BigDecimal vatMultiplier = BigDecimal.ONE.add(
                BigDecimal.valueOf(product.getVatPercentage()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
        return product.getPrice().multiply(vatMultiplier).setScale(2, RoundingMode.HALF_UP);
    }

    private Order createPendingOrder(String customerName, String customerEmail,
                                     List<PaymentRequestDTO.PaymentItem> items,
                                     String paymentIntentId, BigDecimal total,
                                     String paymentMethod,
                                     ShippingAddressDTO shippingAddress) {
        User user = userRepository.findByEmail(customerEmail)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setName(customerName);
                    newUser.setEmail(customerEmail);
                    newUser.setPassword(UUID.randomUUID().toString());
                    newUser.setRegisteredAt(LocalDateTime.now());
                    return userRepository.save(newUser);
                });

        Order order = new Order();
        order.setUser(user);
        order.setStatus("PENDING");
        order.setStripePaymentIntentId(paymentIntentId);
        order.setPaymentMethod(paymentMethod);
        order.setCreatedAt(LocalDateTime.now());
        order.setTotal(total);

        if (shippingAddress != null) {
            order.setShippingName(shippingAddress.name());
            order.setShippingAddress(shippingAddress.address());
            order.setShippingCity(shippingAddress.city());
            order.setShippingZip(shippingAddress.zip());
            order.setShippingCountry(shippingAddress.country());
            order.setShippingPhone(shippingAddress.phone());
        }

        List<OrderItem> itemsEntities = new ArrayList<>();
        for (PaymentRequestDTO.PaymentItem itemDto : items) {
            Product product = findProductOrThrow(itemDto.productId());
            if (product.getStock() - product.getReservedStock() < itemDto.quantity()) {
                throw new IllegalStateException("Insufficient stock for product: " + product.getName());
            }
            product.setReservedStock(product.getReservedStock() + itemDto.quantity());

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setQuantity(itemDto.quantity());
            item.setUnitPrice(priceWithVat(product));
            itemsEntities.add(item);
        }

        order.setItems(itemsEntities);
        return orderRepository.save(order);
    }

    private Product findProductOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }
}
