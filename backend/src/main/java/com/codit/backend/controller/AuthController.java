package com.codit.backend.controller;

import com.codit.backend.dto.AuthTokenResponse;
import com.codit.backend.dto.LoginRequest;
import com.codit.backend.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login/{provider}")
    public ResponseEntity<AuthTokenResponse> login(
            @PathVariable String provider,
            @RequestBody LoginRequest request) {
        return ResponseEntity.ok(null);
    }
}
