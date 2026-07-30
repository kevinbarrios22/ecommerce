package com.maltaland.ecommerce.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtUtilTest {

    private static final String SECRET = "testSecretKeyThatIsAtLeast256BitsLongForHS256Algorithm!";
    private static final long EXPIRATION = 3600000L;

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil(SECRET, EXPIRATION);
    }

    @Test
    void generate_returnsValidToken() {
        String token = jwtUtil.generate(1L, "test@test.com");
        assertThat(token).isNotBlank();
    }

    @Test
    void generateAndExtractEmail_success() {
        String email = "user@example.com";
        String token = jwtUtil.generate(42L, email);

        String extracted = jwtUtil.extractEmail(token);

        assertThat(extracted).isEqualTo(email);
    }

    @Test
    void extractEmail_wrongKey_throws() {
        JwtUtil differentKey = new JwtUtil("aDifferentSecretKeyThatIsAtLeast256BitsLongForTesting!", EXPIRATION);
        String token = differentKey.generate(1L, "test@test.com");

        assertThrows(Exception.class, () -> jwtUtil.extractEmail(token));
    }
}
