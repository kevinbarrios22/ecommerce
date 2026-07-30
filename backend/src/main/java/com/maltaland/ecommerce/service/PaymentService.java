package com.maltaland.ecommerce.service;

import com.maltaland.ecommerce.dto.PaymentRequestDTO;
import com.maltaland.ecommerce.dto.PaymentResponseDTO;
import com.maltaland.ecommerce.entity.Product;
import com.maltaland.ecommerce.exception.ResourceNotFoundException;
import com.maltaland.ecommerce.repository.ProductRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public PaymentResponseDTO createPaymentIntent(PaymentRequestDTO dto) {
        BigDecimal total = BigDecimal.ZERO;

        for (PaymentRequestDTO.PaymentItem itemDto : dto.items()) {
            Product product = productRepository.findById(itemDto.productId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Product not found with id: " + itemDto.productId()));

            BigDecimal unitPrice = product.getPrice();
            BigDecimal vatMultiplier = BigDecimal.ONE.add(
                    BigDecimal.valueOf(product.getVatPercentage()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
            BigDecimal priceWithVat = unitPrice.multiply(vatMultiplier);

            total = total.add(priceWithVat.multiply(BigDecimal.valueOf(itemDto.quantity())));
        }

        long amountCents = total.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .longValue();

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountCents)
                .setCurrency("eur")
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true)
                                .build())
                .build();

        try {
            PaymentIntent intent = PaymentIntent.create(params);
            return new PaymentResponseDTO(
                    intent.getClientSecret(),
                    intent.getId(),
                    new BigDecimal(intent.getAmount()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
        } catch (StripeException e) {
            throw new RuntimeException("Failed to create payment intent: " + e.getMessage(), e);
        }
    }
}
