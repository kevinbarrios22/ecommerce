package com.maltaland.ecommerce.service;

import com.maltaland.ecommerce.dto.BankTransferResponseDTO;
import com.maltaland.ecommerce.entity.Order;
import com.maltaland.ecommerce.entity.OrderItem;
import com.maltaland.ecommerce.repository.OrderRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

/**
 * Best-effort transactional emails. Each email re-loads the order in its own
 * thread and transaction (never touching an entity from the caller's context),
 * is asynchronous and never throws into the payment/order flow: if SMTP is not
 * configured or fails, the order flow still completes and the failure is only
 * logged.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final OrderRepository orderRepository;
    private final ObjectProvider<EmailService> self;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${app.mail-from:no-reply@maltaland.mt}")
    private String mailFrom;

    private boolean isEnabled() {
        return mailHost != null && !mailHost.isBlank();
    }

    /**
     * Emails must fire only after the surrounding transaction commits: the async
     * method re-loads the order in its own context, so sending before commit
     * races with the uncommitted insert and silently drops the email.
     */
    public void sendOrderPaidAfterCommit(Long orderId) {
        afterCommit(() -> self.getObject().sendOrderPaid(orderId));
    }

    public void sendTransferInstructionsAfterCommit(Long orderId, BankTransferResponseDTO transfer) {
        afterCommit(() -> self.getObject().sendTransferInstructions(orderId, transfer));
    }

    public void sendShippedAfterCommit(Long orderId) {
        afterCommit(() -> self.getObject().sendShipped(orderId));
    }

    public void sendDeliveredAfterCommit(Long orderId) {
        afterCommit(() -> self.getObject().sendDelivered(orderId));
    }

    public void sendCancelledAfterCommit(Long orderId) {
        afterCommit(() -> self.getObject().sendCancelled(orderId));
    }

    private void afterCommit(Runnable send) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            send.run();
        } else {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    send.run();
                }
            });
        }
    }

    @Async
    @Transactional
    public void sendOrderPaid(Long orderId) {
        Order order = load(orderId);
        if (order == null) {
            return;
        }
        String subject = "Order #" + order.getId() + " confirmed — thank you!";
        String body = """
                <h2>Thank you for your order!</h2>
                <p>Hi %s, your order <strong>#%s</strong> has been confirmed and is being prepared.</p>
                %s
                <p>You can track it anytime here: <a href="https://maltaland.mt/track">Track your order</a>.</p>
                """.formatted(order.getUser().getName(), order.getId(), orderHtml(order));
        sendEmail(order.getUser().getEmail(), subject, body);
    }

    @Async
    @Transactional
    public void sendTransferInstructions(Long orderId, BankTransferResponseDTO transfer) {
        Order order = load(orderId);
        if (order == null) {
            return;
        }
        String provider = "WISE".equals(transfer.provider()) ? "Wise" : "Revolut";
        String subject = "Complete your transfer for order #" + order.getId();
        String reservedUntil = DateTimeFormatter.ofPattern("d MMM yyyy, HH:mm")
                .format(transfer.expiresAt());
        String body = """
                <h2>Finish your payment by bank transfer</h2>
                <p>Hi %s, your order <strong>#%s</strong> is reserved while your transfer arrives.</p>
                <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;min-width:320px">
                    <tr><td><strong>Pay to (%s)</strong></td><td>%s</td></tr>
                    <tr><td><strong>Account holder</strong></td><td>%s</td></tr>
                    <tr><td><strong>IBAN</strong></td><td>%s</td></tr>
                    <tr><td><strong>BIC / SWIFT</strong></td><td>%s</td></tr>
                    <tr><td><strong>Amount</strong></td><td>&euro;%s</td></tr>
                    <tr><td><strong>Your reference</strong></td><td><code>%s</code></td></tr>
                    <tr><td><strong>Reserved until</strong></td><td>%s</td></tr>
                </table>
                <p>Include the reference so we can match your transfer. As soon as it arrives we will confirm your order.</p>
                """.formatted(
                        order.getUser().getName(), order.getId(), provider, provider,
                        transfer.accountHolder(), transfer.iban(), transfer.bic(),
                        transfer.amount(), transfer.reference(), reservedUntil);
        sendEmail(order.getUser().getEmail(), subject, body);
    }

    @Async
    @Transactional
    public void sendShipped(Long orderId) {
        Order order = load(orderId);
        if (order == null) {
            return;
        }
        String subject = "Your order #" + order.getId() + " has shipped";
        String body = """
                <h2>On its way!</h2>
                <p>Hi %s, your order <strong>#%s</strong> is on its way to you.</p>
                %s
                <p>Track it here: <a href="https://maltaland.mt/track">Track your order</a>.</p>
                """.formatted(order.getUser().getName(), order.getId(), orderHtml(order));
        sendEmail(order.getUser().getEmail(), subject, body);
    }

    @Async
    @Transactional
    public void sendDelivered(Long orderId) {
        Order order = load(orderId);
        if (order == null) {
            return;
        }
        String subject = "Your order #" + order.getId() + " has been delivered";
        String body = """
                <h2>Enjoy your MaltaLand goodies!</h2>
                <p>Hi %s, your order <strong>#%s</strong> has been delivered. We hope you love it.</p>
                """.formatted(order.getUser().getName(), order.getId());
        sendEmail(order.getUser().getEmail(), subject, body);
    }

    @Async
    @Transactional
    public void sendCancelled(Long orderId) {
        Order order = load(orderId);
        if (order == null) {
            return;
        }
        String subject = "Your order #" + order.getId() + " was cancelled";
        String body = """
                <h2>Order cancelled</h2>
                <p>Hi %s, order <strong>#%s</strong> has been cancelled. If you paid already, the refund will be issued shortly. Contact us if you have any questions.</p>
                """.formatted(order.getUser().getName(), order.getId());
        sendEmail(order.getUser().getEmail(), subject, body);
    }

    private Order load(Long orderId) {
        return orderRepository.findById(orderId).orElse(null);
    }

    private String orderHtml(Order order) {
        StringBuilder rows = new StringBuilder();
        for (OrderItem item : order.getItems()) {
            BigDecimal line = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            rows.append("<tr><td>").append(item.getProduct().getName())
                    .append(" &times; ").append(item.getQuantity())
                    .append("</td><td align=\"right\">&euro;").append(line).append("</td></tr>");
        }
        return "<table cellpadding=\"6\" cellspacing=\"0\" style=\"border-collapse:collapse;min-width:320px\">"
                + rows
                + "<tr><td><strong>Total</strong></td><td align=\"right\"><strong>&euro;"
                + order.getTotal() + "</strong></td></tr></table>";
    }

    private void sendEmail(String to, String subject, String htmlBody) {
        if (!isEnabled()) {
            log.debug("Mail not configured (spring.mail.host empty); skipping '{}' to {}", subject, to);
            return;
        }
        try {
            JavaMailSender sender = mailSenderProvider.getIfAvailable();
            if (sender == null) {
                log.warn("No JavaMailSender available; skipping '{}' to {}", subject, to);
                return;
            }
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            sender.send(message);
            log.info("Sent email '{}' to {}", subject, to);
        } catch (Exception e) {
            log.error("Failed to send email '{}' to {}", subject, to, e);
        }
    }
}
