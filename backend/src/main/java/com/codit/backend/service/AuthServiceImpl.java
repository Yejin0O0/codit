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
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

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
        // findByUser는 단일 결과를 기대하는 Optional 반환 메서드이므로,
        // 기존 row를 지우지 않고 매번 새로 저장하면 두 번째 rotation부터
        // 2건 이상 매칭되어 IncorrectResultSizeDataAccessException이 발생한다.
        refreshTokenRepository.deleteByUser(user);
        refreshTokenRepository.save(buildRefreshToken(user));
    }

    private RefreshToken buildRefreshToken(User user) {
        return RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
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
