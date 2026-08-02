package com.maltaland.ecommerce.controller;

import com.maltaland.ecommerce.dto.CreateStaffRequestDTO;
import com.maltaland.ecommerce.dto.ResetPasswordRequestDTO;
import com.maltaland.ecommerce.dto.RoleUpdateRequestDTO;
import com.maltaland.ecommerce.dto.UserResponseDTO;
import com.maltaland.ecommerce.entity.User;
import com.maltaland.ecommerce.service.UserAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class UserAdminController {

    private final UserAdminService userAdminService;

    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> list(@RequestParam(required = false) String role) {
        return ResponseEntity.ok(userAdminService.listStaff(role));
    }

    @PostMapping
    public ResponseEntity<UserResponseDTO> create(@Valid @RequestBody CreateStaffRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(userAdminService.createStaff(dto));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<UserResponseDTO> updateRole(
            @PathVariable Long id,
            @Valid @RequestBody RoleUpdateRequestDTO dto) {
        return ResponseEntity.ok(userAdminService.updateRole(id, dto.role()));
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<UserResponseDTO> resetPassword(
            @PathVariable Long id,
            @Valid @RequestBody ResetPasswordRequestDTO dto) {
        return ResponseEntity.ok(userAdminService.resetPassword(id, dto.newPassword()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        userAdminService.deleteStaff(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
