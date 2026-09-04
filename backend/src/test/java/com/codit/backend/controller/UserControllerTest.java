package com.codit.backend.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.codit.backend.dto.UserProfile;
import com.codit.backend.exception.AuthErrorCode;
import com.codit.backend.exception.AuthException;
import com.codit.backend.exception.GlobalExceptionHandler;
import com.codit.backend.security.CurrentUserArgumentResolver;
import com.codit.backend.security.JwtTokenProvider;
import com.codit.backend.security.WebConfig;
import com.codit.backend.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(UserController.class)
@Import({WebConfig.class, CurrentUserArgumentResolver.class, GlobalExceptionHandler.class})
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @Test
    @DisplayName("유효한 Bearer 토큰이면 200과 UserProfile을 반환해야 한다")
    void shouldReturn200WithUserProfileWhenValidBearerToken() throws Exception {
        when(jwtTokenProvider.getUserId("valid-token")).thenReturn(1L);
        UserProfile profile = UserProfile.builder()
                .id(1L)
                .email("test@gmail.com")
                .nickname("Test User")
                .role("USER")
                .build();
        when(userService.getMyInfo(1L)).thenReturn(profile);

        mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@gmail.com"));
    }

    @Test
    @DisplayName("Authorization 헤더가 없으면 401을 반환해야 한다")
    void shouldReturn401WhenAuthorizationHeaderMissing() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("userId에 해당하는 User가 없으면 404를 반환해야 한다")
    void shouldReturn404WhenUserNotFound() throws Exception {
        when(jwtTokenProvider.getUserId("valid-token")).thenReturn(999L);
        when(userService.getMyInfo(999L)).thenThrow(new AuthException(AuthErrorCode.USER_NOT_FOUND));

        mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer valid-token"))
                .andExpect(status().isNotFound());
    }
}
