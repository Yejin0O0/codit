package com.codit.backend.service;

import com.codit.backend.dto.AuthTokenResponse;
import com.codit.backend.dto.TokenRefreshResponse;

public interface AuthService {

    AuthTokenResponse loginWithOAuth(String provider, String code, String redirectUri);

    TokenRefreshResponse refresh(String accessToken);

    void logout(String accessToken);
}
