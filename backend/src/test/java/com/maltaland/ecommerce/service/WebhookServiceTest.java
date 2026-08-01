package com.maltaland.ecommerce.service;

import com.maltaland.ecommerce.entity.Order;
import com.maltaland.ecommerce.entity.OrderItem;
import com.maltaland.ecommerce.entity.Product;
import com.maltaland.ecommerce.entity.User;
import com.maltaland.ecommerce.entity.WebhookEvent;
import com.maltaland.ecommerce.repository.OrderRepository;
import com.maltaland.ecommerce.repository.WebhookEventRepository;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.PaymentIntent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WebhookServiceTest {

    @Mock
    private WebhookEventRepository webhookEventRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderService orderService;

    private WebhookService webhookService;

    private Order order;
    private PaymentIntent intent;

    @BeforeEach
    void setUp() {
        webhookService = new WebhookService(webhookEventRepository, orderRepository, orderService);

        Product product = new Product();
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

        intent = new PaymentIntent();
        intent.setId("pi_123");
        intent.setAmount(2360L);
    }

    private Event eventWith(String type, PaymentIntent payload) {
        Event event = mock(Event.class);
        when(event.getId()).thenReturn("evt_123");
        when(event.getType()).thenReturn(type);
        if (payload != null) {
            EventDataObjectDeserializer deserializer = mock(EventDataObjectDeserializer.class);
            when(deserializer.getObject()).thenReturn(Optional.of(payload));
            when(event.getDataObjectDeserializer()).thenReturn(deserializer);
        }
        return event;
    }

    private void verifyEventRecorded(String eventId) {
        verify(webhookEventRepository).save(argThat(e ->
                eventId.equals(e.getStripeEventId())));
    }

    @Test
    void processEvent_duplicateEventId_isSkippedWithoutSaving() {
        when(webhookEventRepository.existsByStripeEventId("evt_123")).thenReturn(true);

        Event event = mock(Event.class);
        when(event.getId()).thenReturn("evt_123");

        webhookService.processEvent(event);

        verify(webhookEventRepository, never()).save(any(WebhookEvent.class));
        verify(orderRepository, never()).findByStripePaymentIntentId(anyString());
    }

    @Test
    void processEvent_paymentSucceeded_marksOrderPaidAndRecordsEvent() {
        when(webhookEventRepository.existsByStripeEventId("evt_123")).thenReturn(false);
        when(orderRepository.findByStripePaymentIntentId("pi_123")).thenReturn(Optional.of(order));

        webhookService.processEvent(eventWith("payment_intent.succeeded", intent));

        verify(orderService).markPaidFromWebhook(1L);
        verifyEventRecorded("evt_123");
    }

    @Test
    void processEvent_paymentSucceeded_alreadyPaid_isNoopButRecordsEvent() {
        order.setStatus("PAID");
        when(webhookEventRepository.existsByStripeEventId("evt_123")).thenReturn(false);
        when(orderRepository.findByStripePaymentIntentId("pi_123")).thenReturn(Optional.of(order));

        webhookService.processEvent(eventWith("payment_intent.succeeded", intent));

        verify(orderService, never()).markPaidFromWebhook(anyLong());
        verifyEventRecorded("evt_123");
    }

    @Test
    void processEvent_paymentSucceeded_forCancelledOrder_requiresManualReview() {
        order.setStatus("CANCELLED");
        when(webhookEventRepository.existsByStripeEventId("evt_123")).thenReturn(false);
        when(orderRepository.findByStripePaymentIntentId("pi_123")).thenReturn(Optional.of(order));

        webhookService.processEvent(eventWith("payment_intent.succeeded", intent));

        verify(orderService, never()).markPaidFromWebhook(anyLong());
        verifyEventRecorded("evt_123");
    }

    @Test
    void processEvent_paymentSucceeded_noOrder_logsAndRecordsEvent() {
        when(webhookEventRepository.existsByStripeEventId("evt_123")).thenReturn(false);
        when(orderRepository.findByStripePaymentIntentId("pi_123")).thenReturn(Optional.empty());

        webhookService.processEvent(eventWith("payment_intent.succeeded", intent));

        verify(orderService, never()).markPaidFromWebhook(anyLong());
        verifyEventRecorded("evt_123");
    }

    @Test
    void processEvent_paymentSucceeded_amountMismatch_requiresManualReview() {
        intent.setAmount(9999L);
        when(webhookEventRepository.existsByStripeEventId("evt_123")).thenReturn(false);
        when(orderRepository.findByStripePaymentIntentId("pi_123")).thenReturn(Optional.of(order));

        webhookService.processEvent(eventWith("payment_intent.succeeded", intent));

        verify(orderService, never()).markPaidFromWebhook(anyLong());
        verifyEventRecorded("evt_123");
    }

    @Test
    void processEvent_paymentFailed_cancelsPendingOrder() {
        when(webhookEventRepository.existsByStripeEventId("evt_123")).thenReturn(false);
        when(orderRepository.findByStripePaymentIntentId("pi_123")).thenReturn(Optional.of(order));

        webhookService.processEvent(eventWith("payment_intent.payment_failed", intent));

        verify(orderService).updateStatus(1L, "CANCELLED");
        verifyEventRecorded("evt_123");
    }

    @Test
    void processEvent_paymentFailed_noOrder_logsAndRecordsEvent() {
        when(webhookEventRepository.existsByStripeEventId("evt_123")).thenReturn(false);
        when(orderRepository.findByStripePaymentIntentId("pi_123")).thenReturn(Optional.empty());

        webhookService.processEvent(eventWith("payment_intent.payment_failed", intent));

        verify(orderService, never()).updateStatus(anyLong(), anyString());
        verifyEventRecorded("evt_123");
    }

    @Test
    void processEvent_paymentFailed_forCancelledOrder_doesNotUpdateAgain() {
        order.setStatus("CANCELLED");
        when(webhookEventRepository.existsByStripeEventId("evt_123")).thenReturn(false);
        when(orderRepository.findByStripePaymentIntentId("pi_123")).thenReturn(Optional.of(order));

        webhookService.processEvent(eventWith("payment_intent.payment_failed", intent));

        verify(orderService, never()).updateStatus(anyLong(), anyString());
        verifyEventRecorded("evt_123");
    }

    @Test
    void processEvent_unknownType_isIgnoredButRecordsEvent() {
        when(webhookEventRepository.existsByStripeEventId("evt_123")).thenReturn(false);

        webhookService.processEvent(eventWith("charge.refunded", null));

        verify(orderRepository, never()).findByStripePaymentIntentId(anyString());
        verify(orderService, never()).markPaidFromWebhook(anyLong());
        verify(orderService, never()).updateStatus(anyLong(), anyString());
        verifyEventRecorded("evt_123");
    }
}
