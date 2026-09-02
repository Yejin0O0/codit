package com.codit.backend.client;

import org.springframework.stereotype.Component;

@Component
public class GoogleOAuthClientImpl implements GoogleOAuthClient {

    @Override
    public GoogleProfile getProfile(String code, String redirectUri) {
        return null;
    }
}
