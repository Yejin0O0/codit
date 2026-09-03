package com.codit.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.codit.backend.client.GoogleOAuthClient;
import com.codit.backend.client.GoogleProfile;
import com.codit.backend.domain.SocialAccount;
import com.codit.backend.domain.User;
import com.codit.backend.dto.AuthTokenResponse;
import com.codit.backend.exception.AuthErrorCode;
import com.codit.backend.exception.AuthException;
import com.codit.backend.repository.SocialAccountRepository;
import com.codit.backend.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SocialAccountRepository socialAccountRepository;

    @Mock
    private GoogleOAuthClient googleOAuthClient;

    @InjectMocks
    private AuthServiceImpl authService;

    @Test
    @DisplayName("신규 Google 사용자 로그인 시 User와 SocialAccount가 생성되어야 한다")
    void loginWithOAuthShouldCreateUserAndSocialAccountForNewGoogleUser() {
        GoogleProfile profile = GoogleProfile.builder()
                .sub("google-sub-123")
                .email("test@gmail.com")
                .name("Test User")
                .build();
        when(googleOAuthClient.getProfile(anyString(), anyString())).thenReturn(profile);
        when(socialAccountRepository.findByProviderAndProviderId("GOOGLE", "google-sub-123"))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.empty());
        User savedUser = User.builder().id(1L).email("test@gmail.com").nickname("Test User").build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(socialAccountRepository.save(any(SocialAccount.class))).thenReturn(SocialAccount.builder().build());

        authService.loginWithOAuth("GOOGLE", "auth-code", "http://redirect");

        verify(userRepository).save(any(User.class));
        verify(socialAccountRepository).save(any(SocialAccount.class));
    }

    @Test
    @DisplayName("accessToken과 사용자 정보가 담긴 AuthTokenResponse를 반환해야 한다")
    void loginWithOAuthShouldReturnAuthTokenResponseWithAccessTokenAndUser() {
        GoogleProfile profile = GoogleProfile.builder()
                .sub("google-sub-123")
                .email("test@gmail.com")
                .name("Test User")
                .build();
        when(googleOAuthClient.getProfile(anyString(), anyString())).thenReturn(profile);
        when(socialAccountRepository.findByProviderAndProviderId(anyString(), anyString()))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        User savedUser = User.builder().id(1L).email("test@gmail.com").nickname("Test User").build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(socialAccountRepository.save(any(SocialAccount.class))).thenReturn(SocialAccount.builder().build());

        AuthTokenResponse result = authService.loginWithOAuth("GOOGLE", "auth-code", "http://redirect");

        assertThat(result).isNotNull();
        assertThat(result.getAccessToken()).isNotNull();
        assertThat(result.getUser()).isNotNull();
    }

    @Test
    @DisplayName("Google 프로필 이름을 nickname으로 사용해야 한다")
    void loginWithOAuthShouldUseGoogleProfileNameAsNickname() {
        GoogleProfile profile = GoogleProfile.builder()
                .sub("google-sub-123")
                .email("test@gmail.com")
                .name("Test User")
                .build();
        when(googleOAuthClient.getProfile(anyString(), anyString())).thenReturn(profile);
        when(socialAccountRepository.findByProviderAndProviderId(anyString(), anyString()))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        User savedUser = User.builder().id(1L).email("test@gmail.com").nickname("Test User").build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(socialAccountRepository.save(any(SocialAccount.class))).thenReturn(SocialAccount.builder().build());

        AuthTokenResponse result = authService.loginWithOAuth("GOOGLE", "auth-code", "http://redirect");

        assertThat(result).isNotNull();
        assertThat(result.getUser().getNickname()).isEqualTo("Test User");
    }

    @Test
    @DisplayName("Google code 교환 실패 시 AuthException(OAUTH_FAILED)를 던져야 한다")
    void loginWithOAuthShouldThrowOauthFailedWhenCodeExchangeFails() {
        when(googleOAuthClient.getProfile(anyString(), anyString()))
                .thenThrow(new RuntimeException("OAuth exchange failed"));

        AuthException exception = assertThrows(AuthException.class,
                () -> authService.loginWithOAuth("GOOGLE", "bad-code", "http://redirect"));

        assertThat(exception.getErrorCode()).isEqualTo(AuthErrorCode.OAUTH_FAILED);
    }

    @Test
    @DisplayName("지원하지 않는 provider 입력 시 AuthException(UNSUPPORTED_PROVIDER)를 던져야 한다")
    void loginWithOAuthShouldThrowUnsupportedProviderForInvalidProvider() {
        AuthException exception = assertThrows(AuthException.class,
                () -> authService.loginWithOAuth("KAKAO", "auth-code", "http://redirect"));

        assertThat(exception.getErrorCode()).isEqualTo(AuthErrorCode.UNSUPPORTED_PROVIDER);
    }

    @Test
    @DisplayName("기존 Google 사용자 재로그인 시 User와 SocialAccount가 새로 생성되지 않아야 한다")
    void loginWithOAuthShouldNotCreateUserOrSocialAccountForExistingGoogleUser() {
        GoogleProfile profile = GoogleProfile.builder()
                .sub("google-sub-123")
                .email("test@gmail.com")
                .name("Test User")
                .build();
        when(googleOAuthClient.getProfile(anyString(), anyString())).thenReturn(profile);
        User existingUser = User.builder().id(1L).email("test@gmail.com").nickname("Test User").build();
        SocialAccount existingAccount = SocialAccount.builder().user(existingUser).build();
        when(socialAccountRepository.findByProviderAndProviderId("GOOGLE", "google-sub-123"))
                .thenReturn(Optional.of(existingAccount));

        authService.loginWithOAuth("GOOGLE", "auth-code", "http://redirect");

        verify(userRepository, never()).save(any(User.class));
        verify(socialAccountRepository, never()).save(any(SocialAccount.class));
    }

    @Test
    @DisplayName("Google API 타임아웃 시 AuthException(OAUTH_FAILED)를 던져야 한다")
    void loginWithOAuthShouldThrowOauthFailedWhenGoogleApiTimesOut() {
        when(googleOAuthClient.getProfile(anyString(), anyString()))
                .thenThrow(new RuntimeException("connection timed out"));

        AuthException exception = assertThrows(AuthException.class,
                () -> authService.loginWithOAuth("GOOGLE", "auth-code", "http://redirect"));

        assertThat(exception.getErrorCode()).isEqualTo(AuthErrorCode.OAUTH_FAILED);
    }
}
