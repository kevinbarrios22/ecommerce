package com.maltaland.ecommerce.controller;

import com.maltaland.ecommerce.dto.BankTransferRequestDTO;
import com.maltaland.ecommerce.dto.BankTransferResponseDTO;
import com.maltaland.ecommerce.dto.PaymentRequestDTO;
import com.maltaland.ecommerce.dto.PaymentResponseDTO;
import com.maltaland.ecommerce.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-payment-intent")
    public ResponseEntity<PaymentResponseDTO> createPaymentIntent(@Valid @RequestBody PaymentRequestDTO dto) {
        return ResponseEntity.ok(paymentService.createPaymentIntent(dto));
    }

    @PostMapping("/bank-transfer")
    public ResponseEntity<BankTransferResponseDTO> createBankTransferOrder(@Valid @RequestBody BankTransferRequestDTO dto) {
        return ResponseEntity.ok(paymentService.createBankTransferOrder(dto));
    }
}
