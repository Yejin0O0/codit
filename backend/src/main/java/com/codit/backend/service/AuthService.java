package com.codit.backend.service;

import com.codit.backend.dto.AuthTokenResponse;

public interface AuthService {

    AuthTokenResponse loginWithOAuth(String provider, String code, String redirectUri);
}
