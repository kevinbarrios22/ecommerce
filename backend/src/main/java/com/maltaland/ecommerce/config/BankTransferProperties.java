package com.maltaland.ecommerce.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Bank account details shown to customers who choose to pay by manual bank
 * transfer through Wise or Revolut. Values are placeholders by default and can
 * be overridden via environment variables.
 */
@ConfigurationProperties(prefix = "app.bank-transfer")
public record BankTransferProperties(
        Account wise,
        Account revolut
) {
    public record Account(
            String accountHolder,
            String iban,
            String bic
    ) {}
}
