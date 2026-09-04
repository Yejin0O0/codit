package com.codit.backend.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;

import com.codit.backend.exception.AuthErrorCode;
import com.codit.backend.exception.AuthException;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.web.context.request.NativeWebRequest;

@ExtendWith(MockitoExtension.class)
class CurrentUserArgumentResolverTest {

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private CurrentUserArgumentResolver resolver;

    @Mock
    private MethodParameter methodParameter;

    @Mock
    private NativeWebRequest webRequest;

    @Mock
    private HttpServletRequest httpServletRequest;

    @Test
    @DisplayName("@CurrentUserId + Long 타입일 때만 supportsParameter가 true를 반환해야 한다")
    void supportsParameterShouldReturnTrueOnlyForAnnotatedLongParameter() {
        when(methodParameter.hasParameterAnnotation(CurrentUserId.class)).thenReturn(true);
        doReturn(Long.class).when(methodParameter).getParameterType();

        boolean result = resolver.supportsParameter(methodParameter);

        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("유효한 Bearer 토큰이 있으면 userId를 반환해야 한다")
    void resolveArgumentShouldReturnUserIdWhenValidBearerTokenGiven() {
        when(webRequest.getNativeRequest()).thenReturn(httpServletRequest);
        when(httpServletRequest.getHeader("Authorization")).thenReturn("Bearer valid-token");
        when(jwtTokenProvider.getUserId("valid-token")).thenReturn(42L);

        Object result = resolver.resolveArgument(methodParameter, null, webRequest, null);

        assertThat(result).isEqualTo(42L);
    }

    @Test
    @DisplayName("Authorization 헤더가 없으면 AuthException(UNAUTHENTICATED)을 던져야 한다")
    void resolveArgumentShouldThrowUnauthenticatedWhenHeaderMissing() {
        when(webRequest.getNativeRequest()).thenReturn(httpServletRequest);
        when(httpServletRequest.getHeader("Authorization")).thenReturn(null);

        AuthException exception = assertThrows(AuthException.class,
                () -> resolver.resolveArgument(methodParameter, null, webRequest, null));

        assertThat(exception.getErrorCode()).isEqualTo(AuthErrorCode.UNAUTHENTICATED);
    }

    @Test
    @DisplayName("토큰이 무효/만료면 AuthException(UNAUTHENTICATED)을 던져야 한다")
    void resolveArgumentShouldThrowUnauthenticatedWhenTokenInvalid() {
        when(webRequest.getNativeRequest()).thenReturn(httpServletRequest);
        when(httpServletRequest.getHeader("Authorization")).thenReturn("Bearer invalid-token");
        when(jwtTokenProvider.getUserId("invalid-token")).thenThrow(new RuntimeException("invalid"));

        AuthException exception = assertThrows(AuthException.class,
                () -> resolver.resolveArgument(methodParameter, null, webRequest, null));

        assertThat(exception.getErrorCode()).isEqualTo(AuthErrorCode.UNAUTHENTICATED);
    }
}
