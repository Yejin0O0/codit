package com.codit.backend.client;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "google.oauth")
public record GoogleOAuthProperties(String clientId, String clientSecret, String tokenUri, String userInfoUri) {
}
