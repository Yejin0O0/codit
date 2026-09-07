package com.codit.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthTokenResponse {

    private String accessToken;

    private long expiresAt;

    private UserProfile user;
}
