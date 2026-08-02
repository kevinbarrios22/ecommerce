package com.maltaland.ecommerce.config;

import com.maltaland.ecommerce.entity.User;
import com.maltaland.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin-initial-password:}")
    private String adminInitialPassword;

    @Override
    public void run(String... args) {
        if (userRepository.findByEmail("keanbago@gmail.com").isEmpty()) {
            if (adminInitialPassword == null || adminInitialPassword.isBlank()) {
                log.warn("app.admin-initial-password is not set; skipping admin user creation");
                return;
            }
            User admin = new User();
            admin.setName("Admin");
            admin.setEmail("keanbago@gmail.com");
            admin.setPassword(passwordEncoder.encode(adminInitialPassword));
            admin.setRole("ADMIN");
            userRepository.save(admin);
            log.info("Admin user created: keanbago@gmail.com");
        }
    }
}
