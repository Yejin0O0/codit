package com.codit.backend.client;

public interface GoogleOAuthClient {

    GoogleProfile getProfile(String code, String redirectUri);
}
