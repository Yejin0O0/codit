package com.codit.backend.security;

import com.codit.backend.dto.ErrorResponse;
import com.codit.backend.exception.AuthErrorCode;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public JwtAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException, ServletException {
        AuthErrorCode errorCode = AuthErrorCode.UNAUTHENTICATED;
        response.setStatus(errorCode.getHttpStatus().value());
        response.setContentType("application/json");
        response.getWriter().write(
                objectMapper.writeValueAsString(new ErrorResponse(errorCode.name(), errorCode.getMessage())));
    }
}
