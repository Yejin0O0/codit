package com.codit.backend.service;

import com.codit.backend.client.GoogleOAuthClient;
import com.codit.backend.dto.AuthTokenResponse;
import com.codit.backend.repository.SocialAccountRepository;
import com.codit.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final GoogleOAuthClient googleOAuthClient;

    public AuthServiceImpl(
            UserRepository userRepository,
            SocialAccountRepository socialAccountRepository,
            GoogleOAuthClient googleOAuthClient) {
        this.userRepository = userRepository;
        this.socialAccountRepository = socialAccountRepository;
        this.googleOAuthClient = googleOAuthClient;
    }

    @Override
    public AuthTokenResponse loginWithOAuth(String provider, String code, String redirectUri) {
        return null;
    }
}
