package com.codit.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.codit.backend.client.GoogleOAuthClient;
import com.codit.backend.client.GoogleProfile;
import com.codit.backend.domain.RefreshToken;
import com.codit.backend.domain.SocialAccount;
import com.codit.backend.domain.User;
import com.codit.backend.dto.AuthTokenResponse;
import com.codit.backend.dto.TokenRefreshResponse;
import com.codit.backend.exception.AuthErrorCode;
import com.codit.backend.exception.AuthException;
import com.codit.backend.repository.RefreshTokenRepository;
import com.codit.backend.repository.SocialAccountRepository;
import com.codit.backend.repository.UserRepository;
import com.codit.backend.security.JwtTokenProvider;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SocialAccountRepository socialAccountRepository;

    @Mock
    private GoogleOAuthClient googleOAuthClient;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

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
        when(jwtTokenProvider.generateAccessToken(anyLong())).thenReturn("mock-jwt-token");

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
    @DisplayName("반환된 accessToken은 jwtTokenProvider가 로그인한 User.id로 발급한 JWT여야 한다")
    void loginWithOAuthShouldReturnJwtAccessTokenIssuedForLoggedInUserId() {
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
        when(jwtTokenProvider.generateAccessToken(1L)).thenReturn("mock-jwt-token");

        AuthTokenResponse result = authService.loginWithOAuth("GOOGLE", "auth-code", "http://redirect");

        assertThat(result.getAccessToken()).isEqualTo("mock-jwt-token");
    }

    @Test
    @DisplayName("동시 요청이 먼저 같은 이메일로 User를 만들면 그 User를 재사용해야 한다")
    void loginWithOAuthShouldReuseExistingUserWhenConcurrentInsertViolatesEmailUniqueness() {
        GoogleProfile profile = GoogleProfile.builder()
                .sub("google-sub-123")
                .email("test@gmail.com")
                .name("Test User")
                .build();
        when(googleOAuthClient.getProfile(anyString(), anyString())).thenReturn(profile);
        when(socialAccountRepository.findByProviderAndProviderId("GOOGLE", "google-sub-123"))
                .thenReturn(Optional.empty());
        User winnerUser = User.builder().id(1L).email("test@gmail.com").nickname("Test User").build();
        when(userRepository.findByEmail("test@gmail.com"))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(winnerUser));
        when(userRepository.save(any(User.class))).thenThrow(new DataIntegrityViolationException("duplicate email"));
        when(socialAccountRepository.save(any(SocialAccount.class))).thenReturn(SocialAccount.builder().build());

        AuthTokenResponse result = authService.loginWithOAuth("GOOGLE", "auth-code", "http://redirect");

        assertThat(result.getUser().getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("동시 요청이 먼저 같은 (provider, providerId)로 SocialAccount를 만들면 그 계정의 User를 사용해야 한다")
    void loginWithOAuthShouldReuseExistingUserWhenConcurrentInsertViolatesSocialAccountUniqueness() {
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
        User winnerUser = User.builder().id(2L).email("test@gmail.com").nickname("Test User").build();
        SocialAccount winnerAccount = SocialAccount.builder().user(winnerUser).build();
        when(socialAccountRepository.save(any(SocialAccount.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate social account"));
        when(socialAccountRepository.findByProviderAndProviderId("GOOGLE", "google-sub-123"))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(winnerAccount));

        AuthTokenResponse result = authService.loginWithOAuth("GOOGLE", "auth-code", "http://redirect");

        assertThat(result.getUser().getId()).isEqualTo(2L);
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

    @Test
    @DisplayName("OAuth 로그인 성공 시 Refresh Token을 DB에 저장한다")
    void loginWithOAuthShouldSaveRefreshTokenToDatabaseOnSuccess() {
        GoogleProfile profile = GoogleProfile.builder()
                .sub("google-sub-123").email("test@gmail.com").name("Test User").build();
        when(googleOAuthClient.getProfile(anyString(), anyString())).thenReturn(profile);
        when(socialAccountRepository.findByProviderAndProviderId(anyString(), anyString()))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        User savedUser = User.builder().id(1L).email("test@gmail.com").nickname("Test User").build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(socialAccountRepository.save(any(SocialAccount.class))).thenReturn(SocialAccount.builder().build());

        authService.loginWithOAuth("GOOGLE", "auth-code", "http://redirect");

        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("만료됐지만 서명이 유효한 Access Token으로 refresh 호출 시 새 Access Token을 반환하고 Refresh Token을 교체한다")
    void refreshShouldReturnNewAccessTokenAndRotateRefreshTokenWhenExpiredAccessTokenGiven() {
        User user = User.builder().id(1L).email("test@gmail.com").nickname("Test User").build();
        RefreshToken storedRefreshToken = RefreshToken.builder()
                .user(user).token("old-refresh-token").expiresAt(LocalDateTime.now().plusDays(7)).build();
        when(jwtTokenProvider.getUserIdIgnoreExpiry("expired-access-token")).thenReturn(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(refreshTokenRepository.findByUser(user)).thenReturn(Optional.of(storedRefreshToken));
        when(jwtTokenProvider.generateAccessToken(1L)).thenReturn("new-access-token");
        when(jwtTokenProvider.getAccessTokenExpirySeconds()).thenReturn(3600L);
        when(jwtTokenProvider.getRefreshTokenExpirySeconds()).thenReturn(604800L);

        TokenRefreshResponse result = authService.refresh("expired-access-token");

        assertThat(result).isNotNull();
        assertThat(result.getAccessToken()).isEqualTo("new-access-token");
        assertThat(storedRefreshToken.getToken()).isNotEqualTo("old-refresh-token");
    }

    @Test
    @DisplayName("refresh는 기존 Refresh Token row를 delete+insert 하지 않고 제자리에서 갱신해야 한다 (중복 INSERT로 인한 findByUser 500 방지)")
    void refreshShouldRotateExistingRefreshTokenInPlaceWithoutDeleteOrReinsert() {
        User user = User.builder().id(1L).email("test@gmail.com").nickname("Test User").build();
        LocalDateTime originalExpiresAt = LocalDateTime.now().plusDays(7);
        RefreshToken storedRefreshToken = RefreshToken.builder()
                .user(user).token("old-refresh-token").expiresAt(originalExpiresAt).build();
        when(jwtTokenProvider.getUserIdIgnoreExpiry("expired-access-token")).thenReturn(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(refreshTokenRepository.findByUser(user)).thenReturn(Optional.of(storedRefreshToken));
        when(jwtTokenProvider.generateAccessToken(1L)).thenReturn("new-access-token");
        when(jwtTokenProvider.getAccessTokenExpirySeconds()).thenReturn(3600L);
        when(jwtTokenProvider.getRefreshTokenExpirySeconds()).thenReturn(604800L);

        authService.refresh("expired-access-token");

        // delete+insert 방식은 두 번째 rotation부터 findByUser가 2건을 매칭해 500을 유발했다.
        // 같은 row를 제자리에서 갱신하면 그 창(window)이 아예 없다.
        verify(refreshTokenRepository, never()).deleteByUser(any(User.class));
        verify(refreshTokenRepository, never()).save(any(RefreshToken.class));
        assertThat(storedRefreshToken.getToken()).isNotEqualTo("old-refresh-token");
        assertThat(storedRefreshToken.getExpiresAt()).isAfter(originalExpiresAt.minusSeconds(1));
    }

    @Test
    @DisplayName("row가 없는 유저에게 동시 refresh 요청 2개가 들어와도 두 번째는 예외 없이 기존 row를 회전시킨다 (findByUser 500 재발 방지)")
    void refreshShouldRotateWinnerRowWhenConcurrentInsertViolatesUserUniqueness() {
        User user = User.builder().id(1L).email("test@gmail.com").nickname("Test User").build();
        RefreshToken winnerRow = RefreshToken.builder()
                .user(user).token("winner-token").expiresAt(LocalDateTime.now().plusDays(7)).build();
        when(jwtTokenProvider.getUserIdIgnoreExpiry("access-token")).thenReturn(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        // 최초 조회 시점엔 row가 없다가(로그인 직후 등), save가 unique 제약(user_id)에 걸리고
        // 재조회하면 동시 요청이 먼저 만든 row(winnerRow)가 보이는 시나리오.
        when(refreshTokenRepository.findByUser(user))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(winnerRow));
        when(refreshTokenRepository.save(any(RefreshToken.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate user_id"));
        when(jwtTokenProvider.generateAccessToken(1L)).thenReturn("new-access-token");
        when(jwtTokenProvider.getAccessTokenExpirySeconds()).thenReturn(3600L);
        when(jwtTokenProvider.getRefreshTokenExpirySeconds()).thenReturn(604800L);

        TokenRefreshResponse result = authService.refresh("access-token");

        assertThat(result.getAccessToken()).isEqualTo("new-access-token");
        assertThat(winnerRow.getToken()).isNotEqualTo("winner-token");
    }

    @Test
    @DisplayName("Bearer 토큰 서명이 유효하지 않으면 refresh가 UNAUTHENTICATED를 던진다")
    void refreshShouldThrowUnauthenticatedWhenTokenSignatureIsInvalid() {
        when(jwtTokenProvider.getUserIdIgnoreExpiry("invalid-token"))
                .thenThrow(new AuthException(AuthErrorCode.UNAUTHENTICATED));

        AuthException exception = assertThrows(AuthException.class,
                () -> authService.refresh("invalid-token"));

        assertThat(exception.getErrorCode()).isEqualTo(AuthErrorCode.UNAUTHENTICATED);
    }

    @Test
    @DisplayName("해당 userId의 Refresh Token이 DB에 없으면 refresh가 REFRESH_TOKEN_NOT_FOUND를 던진다")
    void refreshShouldThrowRefreshTokenNotFoundWhenNoRefreshTokenInDb() {
        User user = User.builder().id(1L).email("test@gmail.com").nickname("Test User").build();
        when(jwtTokenProvider.getUserIdIgnoreExpiry("access-token")).thenReturn(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(refreshTokenRepository.findByUser(user)).thenReturn(Optional.empty());

        AuthException exception = assertThrows(AuthException.class,
                () -> authService.refresh("access-token"));

        assertThat(exception.getErrorCode()).isEqualTo(AuthErrorCode.REFRESH_TOKEN_NOT_FOUND);
    }

    @Test
    @DisplayName("Refresh Token의 expiresAt이 과거이면 refresh가 REFRESH_TOKEN_EXPIRED를 던진다")
    void refreshShouldThrowRefreshTokenExpiredWhenRefreshTokenIsExpired() {
        User user = User.builder().id(1L).email("test@gmail.com").nickname("Test User").build();
        RefreshToken expiredRefreshToken = RefreshToken.builder()
                .user(user).token("expired-refresh-token").expiresAt(LocalDateTime.now().minusDays(1)).build();
        when(jwtTokenProvider.getUserIdIgnoreExpiry("access-token")).thenReturn(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(refreshTokenRepository.findByUser(user)).thenReturn(Optional.of(expiredRefreshToken));

        AuthException exception = assertThrows(AuthException.class,
                () -> authService.refresh("access-token"));

        assertThat(exception.getErrorCode()).isEqualTo(AuthErrorCode.REFRESH_TOKEN_EXPIRED);
    }

    @Test
    @DisplayName("유효한 Access Token으로 logout 호출 시 DB에서 Refresh Token을 삭제한다")
    void logoutShouldDeleteRefreshTokenFromDatabaseWhenValidAccessTokenGiven() {
        User user = User.builder().id(1L).email("test@gmail.com").nickname("Test User").build();
        when(jwtTokenProvider.getUserIdIgnoreExpiry("access-token")).thenReturn(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        authService.logout("access-token");

        verify(refreshTokenRepository).deleteByUser(user);
    }

    @Test
    @DisplayName("DB에 Refresh Token이 없어도 logout이 오류 없이 완료된다")
    void logoutShouldCompleteWithoutErrorWhenNoRefreshTokenInDb() {
        User user = User.builder().id(1L).email("test@gmail.com").nickname("Test User").build();
        when(jwtTokenProvider.getUserIdIgnoreExpiry("access-token")).thenReturn(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        authService.logout("access-token");

        // 구현이 deleteByUser를 호출해야 한다 (JPA는 대상 없으면 조용히 완료)
        verify(refreshTokenRepository).deleteByUser(user);
    }

    @Test
    @DisplayName("Bearer 토큰 서명이 유효하지 않으면 logout이 UNAUTHENTICATED를 던진다")
    void logoutShouldThrowUnauthenticatedWhenTokenSignatureIsInvalid() {
        when(jwtTokenProvider.getUserIdIgnoreExpiry("invalid-token"))
                .thenThrow(new AuthException(AuthErrorCode.UNAUTHENTICATED));

        AuthException exception = assertThrows(AuthException.class,
                () -> authService.logout("invalid-token"));

        assertThat(exception.getErrorCode()).isEqualTo(AuthErrorCode.UNAUTHENTICATED);
    }
}
