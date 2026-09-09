package com.codit.backend.service;

import com.codit.backend.client.GoogleOAuthClient;
import com.codit.backend.client.GoogleProfile;
import com.codit.backend.domain.RefreshToken;
import com.codit.backend.domain.Role;
import com.codit.backend.domain.SocialAccount;
import com.codit.backend.domain.User;
import com.codit.backend.dto.AuthTokenResponse;
import com.codit.backend.dto.TokenRefreshResponse;
import com.codit.backend.dto.UserProfile;
import com.codit.backend.exception.AuthErrorCode;
import com.codit.backend.exception.AuthException;
import com.codit.backend.repository.RefreshTokenRepository;
import com.codit.backend.repository.SocialAccountRepository;
import com.codit.backend.repository.UserRepository;
import com.codit.backend.security.JwtTokenProvider;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final Logger LOG = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final GoogleOAuthClient googleOAuthClient;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;

    @Override
    @Transactional
    public AuthTokenResponse loginWithOAuth(String provider, String code, String redirectUri) {
        if (!"GOOGLE".equals(provider)) {
            throw new AuthException(AuthErrorCode.UNSUPPORTED_PROVIDER);
        }

        GoogleProfile profile;
        try {
            profile = googleOAuthClient.getProfile(code, redirectUri);
        } catch (Exception e) {
            LOG.error("Google OAuth 실패 — redirectUri={} error={}", redirectUri, e.getMessage(), e);
            throw new AuthException(AuthErrorCode.OAUTH_FAILED);
        }

        User user = socialAccountRepository.findByProviderAndProviderId(provider, profile.getSub())
                .map(SocialAccount::getUser)
                .orElseGet(() -> findOrCreateUser(provider, profile));

        String accessToken = jwtTokenProvider.generateAccessToken(user.getId());
        long expiresAt = computeAccessTokenExpiresAt();

        UserProfile userProfile = UserProfile.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .role(user.getRole() != null ? user.getRole().name() : Role.USER.name())
                .build();

        rotateRefreshToken(user);

        return AuthTokenResponse.builder()
                .accessToken(accessToken)
                .expiresAt(expiresAt)
                .user(userProfile)
                .build();
    }

    private User findOrCreateUser(String provider, GoogleProfile profile) {
        User user = userRepository.findByEmail(profile.getEmail()).orElseGet(() -> createUser(profile));
        try {
            socialAccountRepository.save(SocialAccount.builder()
                    .user(user)
                    .provider(provider)
                    .providerId(profile.getSub())
                    .providerEmail(profile.getEmail())
                    .build());
        } catch (DataIntegrityViolationException e) {
            // 동시 요청이 먼저 같은 (provider, providerId)로 SocialAccount 를 만든 경우: 그 계정을 사용한다.
            user = socialAccountRepository.findByProviderAndProviderId(provider, profile.getSub())
                    .map(SocialAccount::getUser)
                    .orElseThrow(() -> e);
        }
        return user;
    }

    private User createUser(GoogleProfile profile) {
        try {
            return userRepository.save(User.builder()
                    .email(profile.getEmail())
                    .nickname(profile.getName())
                    .role(Role.USER)
                    .createdAt(LocalDateTime.now())
                    .build());
        } catch (DataIntegrityViolationException e) {
            // 동시 요청이 먼저 같은 이메일로 User 를 만든 경우: 그 User 를 재사용한다.
            return userRepository.findByEmail(profile.getEmail()).orElseThrow(() -> e);
        }
    }

    @Override
    @Transactional
    public TokenRefreshResponse refresh(String accessToken) {
        User user = findUserByToken(accessToken);
        RefreshToken refreshToken = refreshTokenRepository.findByUser(user)
                .orElseThrow(() -> new AuthException(AuthErrorCode.REFRESH_TOKEN_NOT_FOUND));
        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AuthException(AuthErrorCode.REFRESH_TOKEN_EXPIRED);
        }
        String newAccessToken = jwtTokenProvider.generateAccessToken(user.getId());
        long expiresAt = computeAccessTokenExpiresAt();
        rotateRefreshToken(user);
        return TokenRefreshResponse.builder()
                .accessToken(newAccessToken)
                .expiresAt(expiresAt)
                .build();
    }

    private long computeAccessTokenExpiresAt() {
        return System.currentTimeMillis() + jwtTokenProvider.getAccessTokenExpirySeconds() * 1000;
    }

    private void rotateRefreshToken(User user) {
        // delete+insert 대신 기존 row를 제자리에서 갱신한다 — 동시에 여러 refresh 요청이
        // (다른 탭/기기 등에서) 들어와도 row가 지워졌다 다시 생기는 창이 없어, 두 요청이
        // findByUser에서 서로 다른 row를 보는 일이 없다(RefreshToken#rotate 참고).
        String newToken = UUID.randomUUID().toString();
        LocalDateTime newExpiresAt = LocalDateTime.now().plusSeconds(jwtTokenProvider.getRefreshTokenExpirySeconds());

        refreshTokenRepository.findByUser(user)
                .ifPresentOrElse(
                        existing -> existing.rotate(newToken, newExpiresAt),
                        () -> insertRefreshToken(user, newToken, newExpiresAt));
    }

    private void insertRefreshToken(User user, String newToken, LocalDateTime newExpiresAt) {
        // "row 없음" 분기는 findByUser -> save 사이에 락이 없는 check-then-act라, 같은 유저의
        // row가 아직 없는 상태(최초 로그인 직후 등)에 동시 refresh 요청 2개가 들어오면 둘 다
        // insert를 시도할 수 있다. RefreshToken.user에 걸어둔 unique 제약(user_id)이 뒤늦게
        // 도착한 쪽을 DataIntegrityViolationException으로 떨어뜨리므로, 그 경우 먼저 insert된
        // row를 찾아 제자리에서 회전시킨다.
        try {
            refreshTokenRepository.save(RefreshToken.builder()
                    .user(user)
                    .token(newToken)
                    .expiresAt(newExpiresAt)
                    .build());
        } catch (DataIntegrityViolationException e) {
            RefreshToken winner = refreshTokenRepository.findByUser(user).orElseThrow(() -> e);
            winner.rotate(newToken, newExpiresAt);
        }
    }

    private User findUserByToken(String token) {
        long userId = jwtTokenProvider.getUserIdIgnoreExpiry(token);
        return userRepository.findById(userId)
                .orElseThrow(() -> new AuthException(AuthErrorCode.UNAUTHENTICATED));
    }

    @Override
    @Transactional
    public void logout(String accessToken) {
        User user = findUserByToken(accessToken);
        refreshTokenRepository.deleteByUser(user);
    }
}
