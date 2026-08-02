package com.maltaland.ecommerce.dto;

public record ShippingAddressDTO(
        String name,
        String address,
        String city,
        String zip,
        String country,
        String phone
) {}
