package com.codit.backend.controller;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.codit.backend.dto.AuthTokenResponse;
import com.codit.backend.dto.LoginRequest;
import com.codit.backend.dto.UserProfile;
import com.codit.backend.exception.AuthErrorCode;
import com.codit.backend.exception.AuthException;
import com.codit.backend.security.JwtTokenProvider;
import com.codit.backend.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

@WebMvcTest(AuthController.class)
@Import(com.codit.backend.exception.GlobalExceptionHandler.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("로그인 성공 시 200과 AuthTokenResponse를 반환해야 한다")
    void loginShouldReturn200WithAuthTokenResponseOnSuccess() throws Exception {
        UserProfile userProfile = UserProfile.builder()
                .id(1L)
                .email("test@gmail.com")
                .nickname("Test User")
                .role("USER")
                .build();
        AuthTokenResponse response = AuthTokenResponse.builder()
                .accessToken("jwt-token")
                .expiresAt(System.currentTimeMillis() + 3600000L)
                .user(userProfile)
                .build();
        when(authService.loginWithOAuth(anyString(), anyString(), anyString())).thenReturn(response);

        mockMvc.perform(post("/api/auth/login/GOOGLE")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("auth-code", "http://redirect"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("jwt-token"))
                .andExpect(jsonPath("$.user.nickname").value("Test User"));
    }

    @Test
    @DisplayName("code가 없으면 400을 반환해야 한다")
    void loginShouldReturn400WhenCodeIsNull() throws Exception {
        mockMvc.perform(post("/api/auth/login/GOOGLE")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(null, "http://redirect"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("지원하지 않는 provider이면 400을 반환해야 한다")
    void loginShouldReturn400ForUnsupportedProvider() throws Exception {
        when(authService.loginWithOAuth(anyString(), anyString(), anyString()))
                .thenThrow(new AuthException(AuthErrorCode.UNSUPPORTED_PROVIDER));

        mockMvc.perform(post("/api/auth/login/KAKAO")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("auth-code", "http://redirect"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Google code 교환 실패 시 401을 반환해야 한다")
    void loginShouldReturn401WhenGoogleCodeExchangeFails() throws Exception {
        when(authService.loginWithOAuth(anyString(), anyString(), anyString()))
                .thenThrow(new AuthException(AuthErrorCode.OAUTH_FAILED));

        mockMvc.perform(post("/api/auth/login/GOOGLE")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("bad-code", "http://redirect"))))
                .andExpect(status().isUnauthorized());
    }
}
