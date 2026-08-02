package com.maltaland.ecommerce.service;

import com.maltaland.ecommerce.dto.CreateStaffRequestDTO;
import com.maltaland.ecommerce.dto.UserResponseDTO;
import com.maltaland.ecommerce.entity.User;
import com.maltaland.ecommerce.exception.ResourceNotFoundException;
import com.maltaland.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class UserAdminService {

    private static final String CUSTOMER_ROLE = "CUSTOMER";
    private static final Set<String> STAFF_ROLES = Set.of("ADMIN", "STAFF");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserResponseDTO> listStaff(String role) {
        if (role != null && !role.isBlank()) {
            requireStaffRole(role);
            return userRepository.findAll().stream()
                    .filter(u -> u.getRole().equalsIgnoreCase(role))
                    .map(this::toDTO)
                    .sorted(byRegistrationDesc())
                    .toList();
        }
        return userRepository.findAll().stream()
                .filter(u -> !CUSTOMER_ROLE.equalsIgnoreCase(u.getRole()))
                .map(this::toDTO)
                .sorted(byRegistrationDesc())
                .toList();
    }

    public UserResponseDTO createStaff(CreateStaffRequestDTO dto) {
        requireStaffRole(dto.role());
        if (userRepository.findByEmail(dto.email()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A user with that email already exists");
        }

        User user = new User();
        user.setName(dto.name());
        user.setEmail(dto.email());
        user.setPassword(passwordEncoder.encode(dto.password()));
        user.setRole(dto.role().toUpperCase());
        user.setRegisteredAt(LocalDateTime.now());

        return toDTO(userRepository.save(user));
    }

    public UserResponseDTO resetPassword(Long id, String newPassword) {
        User user = findStaffOrThrow(id);
        user.setPassword(passwordEncoder.encode(newPassword));
        return toDTO(userRepository.save(user));
    }

    public UserResponseDTO updateRole(Long id, String role) {
        User user = findStaffOrThrow(id);
        requireStaffRole(role);
        user.setRole(role.toUpperCase());
        return toDTO(userRepository.save(user));
    }

    public void deleteStaff(Long id, Long currentUserId) {
        User user = findStaffOrThrow(id);
        if (user.getId().equals(currentUserId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "You cannot delete your own account");
        }
        userRepository.delete(user);
    }

    private User findStaffOrThrow(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        if (CUSTOMER_ROLE.equalsIgnoreCase(user.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Customer accounts are private and cannot be managed here");
        }
        return user;
    }

    private void requireStaffRole(String role) {
        if (role == null || !STAFF_ROLES.contains(role.toUpperCase())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Role must be one of: ADMIN, STAFF");
        }
    }

    private Comparator<UserResponseDTO> byRegistrationDesc() {
        return (a, b) -> {
            LocalDateTime da = a.registeredAt() != null ? a.registeredAt() : LocalDateTime.MIN;
            LocalDateTime db = b.registeredAt() != null ? b.registeredAt() : LocalDateTime.MIN;
            return db.compareTo(da);
        };
    }

    private UserResponseDTO toDTO(User user) {
        return new UserResponseDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getRegisteredAt());
    }
}
