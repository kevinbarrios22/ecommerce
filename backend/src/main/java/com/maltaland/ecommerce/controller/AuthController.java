package com.maltaland.ecommerce.controller;

import com.maltaland.ecommerce.dto.AuthRequestDTO;
import com.maltaland.ecommerce.dto.AuthResponseDTO;
import com.maltaland.ecommerce.dto.LoginRequestDTO;
import com.maltaland.ecommerce.entity.User;
import com.maltaland.ecommerce.repository.UserRepository;
import com.maltaland.ecommerce.security.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@Valid @RequestBody AuthRequestDTO dto) {
        if (userRepository.findByEmail(dto.email()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(null);
        }

        User user = new User();
        user.setName(dto.name());
        user.setEmail(dto.email());
        user.setPassword(passwordEncoder.encode(dto.password()));
        user.setRegisteredAt(LocalDateTime.now());

        User saved = userRepository.save(user);
        String token = jwtUtil.generate(saved.getId(), saved.getEmail());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthResponseDTO(token, saved.getId(), saved.getName(), saved.getEmail()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginRequestDTO dto) {
        User user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!passwordEncoder.matches(dto.password(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        String token = jwtUtil.generate(user.getId(), user.getEmail());
        return ResponseEntity.ok(
                new AuthResponseDTO(token, user.getId(), user.getName(), user.getEmail()));
    }
}
