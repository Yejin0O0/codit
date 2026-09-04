package com.codit.backend.service;

import com.codit.backend.client.GoogleOAuthClient;
import com.codit.backend.client.GoogleProfile;
import com.codit.backend.domain.Role;
import com.codit.backend.domain.SocialAccount;
import com.codit.backend.domain.User;
import com.codit.backend.dto.AuthTokenResponse;
import com.codit.backend.dto.UserProfile;
import com.codit.backend.exception.AuthErrorCode;
import com.codit.backend.exception.AuthException;
import com.codit.backend.repository.SocialAccountRepository;
import com.codit.backend.repository.UserRepository;
import com.codit.backend.security.JwtTokenProvider;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final long TOKEN_EXPIRY_MS = 3_600_000L;

    private final UserRepository userRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final GoogleOAuthClient googleOAuthClient;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
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
        long expiresAt = System.currentTimeMillis() + TOKEN_EXPIRY_MS;

        UserProfile userProfile = UserProfile.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .role(user.getRole() != null ? user.getRole().name() : Role.USER.name())
                .build();

        return AuthTokenResponse.builder()
                .accessToken(accessToken)
                .expiresAt(expiresAt)
                .user(userProfile)
                .build();
    }

    private User findOrCreateUser(String provider, GoogleProfile profile) {
        User user = userRepository.findByEmail(profile.getEmail()).orElseGet(() -> {
            User newUser = User.builder()
                    .email(profile.getEmail())
                    .nickname(profile.getName())
                    .role(Role.USER)
                    .createdAt(LocalDateTime.now())
                    .build();
            return userRepository.save(newUser);
        });
        socialAccountRepository.save(SocialAccount.builder()
                .user(user)
                .provider(provider)
                .providerId(profile.getSub())
                .providerEmail(profile.getEmail())
                .build());
        return user;
    }
}
