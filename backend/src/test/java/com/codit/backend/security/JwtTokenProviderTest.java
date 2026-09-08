package com.codit.backend.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class JwtTokenProviderTest {

    private static final String SECRET = "test-secret-key-for-jwt-token-provider-min-32-bytes";

    private final JwtTokenProvider jwtTokenProvider = new JwtTokenProvider(new JwtProperties(SECRET, 3600, 604800));

    @Test
    @DisplayName("발급한 토큰에서 동일한 userId를 꺼낼 수 있어야 한다")
    void shouldReturnSameUserIdWhenTokenGeneratedByProvider() {
        String token = jwtTokenProvider.generateAccessToken(42L);

        long userId = jwtTokenProvider.getUserId(token);

        assertThat(userId).isEqualTo(42L);
    }

    @Test
    @DisplayName("만료된 토큰이면 예외를 던져야 한다")
    void shouldThrowWhenTokenIsExpired() {
        JwtTokenProvider expiredProvider = new JwtTokenProvider(new JwtProperties(SECRET, -10, 604800));
        String expiredToken = expiredProvider.generateAccessToken(42L);

        assertThatThrownBy(() -> jwtTokenProvider.getUserId(expiredToken))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("서명이 위조된 토큰이면 예외를 던져야 한다")
    void shouldThrowWhenTokenSignatureIsTampered() {
        String token = jwtTokenProvider.generateAccessToken(42L);
        String base = token != null ? token : "stub-token";
        String tamperedToken = base.substring(0, Math.max(base.length() - 1, 0)) + (base.endsWith("A") ? "B" : "A");

        assertThatThrownBy(() -> jwtTokenProvider.getUserId(tamperedToken))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("만료됐지만 서명이 유효한 토큰이면 getUserIdIgnoreExpiry가 userId를 반환한다")
    void getUserIdIgnoreExpiryShouldReturnUserIdWhenTokenExpiredButSignatureValid() {
        JwtTokenProvider expiredProvider = new JwtTokenProvider(new JwtProperties(SECRET, -10, 604800));
        String expiredToken = expiredProvider.generateAccessToken(99L);

        long userId = jwtTokenProvider.getUserIdIgnoreExpiry(expiredToken);

        assertThat(userId).isEqualTo(99L);
    }

    @Test
    @DisplayName("서명이 유효하지 않으면 getUserIdIgnoreExpiry가 예외를 던진다")
    void getUserIdIgnoreExpiryShouldThrowWhenTokenSignatureIsInvalid() {
        JwtTokenProvider otherProvider = new JwtTokenProvider(
                new JwtProperties("different-secret-key-for-testing-min-32-bytes", 3600, 604800));
        String tokenWithWrongSignature = otherProvider.generateAccessToken(42L);

        assertThatThrownBy(() -> jwtTokenProvider.getUserIdIgnoreExpiry(tokenWithWrongSignature))
                .isInstanceOf(RuntimeException.class);
    }
}
