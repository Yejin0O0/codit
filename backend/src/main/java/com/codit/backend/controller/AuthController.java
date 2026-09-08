package com.codit.backend.controller;

import com.codit.backend.dto.AuthTokenResponse;
import com.codit.backend.dto.LoginRequest;
import com.codit.backend.dto.TokenRefreshResponse;
import com.codit.backend.exception.AuthErrorCode;
import com.codit.backend.exception.AuthException;
import com.codit.backend.security.BearerTokenExtractor;
import com.codit.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login/{provider}")
    public ResponseEntity<AuthTokenResponse> login(
            @PathVariable String provider,
            @Valid @RequestBody LoginRequest request) {
        AuthTokenResponse response = authService.loginWithOAuth(provider, request.getCode(), request.getRedirectUri());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenRefreshResponse> refresh(
            @RequestHeader(value = "Authorization", required = false) String bearerToken) {
        String token = extractToken(bearerToken);
        return ResponseEntity.ok(authService.refresh(token));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestHeader(value = "Authorization", required = false) String bearerToken) {
        String token = extractToken(bearerToken);
        authService.logout(token);
        return ResponseEntity.ok().build();
    }

    private String extractToken(String bearerToken) {
        String token = BearerTokenExtractor.extract(bearerToken);
        if (token == null) {
            throw new AuthException(AuthErrorCode.UNAUTHENTICATED);
        }
        return token;
    }
}
