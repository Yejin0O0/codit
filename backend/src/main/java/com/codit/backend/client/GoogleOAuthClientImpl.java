package com.codit.backend.client;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

@Component
public class GoogleOAuthClientImpl implements GoogleOAuthClient {

    private final RestClient restClient;
    private final GoogleOAuthProperties properties;

    public GoogleOAuthClientImpl(RestClient.Builder restClientBuilder, GoogleOAuthProperties properties) {
        this.restClient = restClientBuilder.build();
        this.properties = properties;
    }

    @Override
    public GoogleProfile getProfile(String code, String redirectUri) {
        GoogleTokenResponse tokenResponse = exchangeCodeForToken(code, redirectUri);
        if (tokenResponse == null || tokenResponse.accessToken() == null) {
            throw new IllegalStateException("Google 토큰 응답에 access_token이 없습니다");
        }
        return fetchUserInfo(tokenResponse.accessToken());
    }

    private GoogleTokenResponse exchangeCodeForToken(String code, String redirectUri) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code", code);
        form.add("client_id", properties.clientId());
        form.add("client_secret", properties.clientSecret());
        form.add("redirect_uri", redirectUri);
        form.add("grant_type", "authorization_code");

        return restClient.post()
                .uri(properties.tokenUri())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(GoogleTokenResponse.class);
    }

    private GoogleProfile fetchUserInfo(String accessToken) {
        GoogleUserInfoResponse userInfo = restClient.get()
                .uri(properties.userInfoUri())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .retrieve()
                .body(GoogleUserInfoResponse.class);

        return GoogleProfile.builder()
                .sub(userInfo.sub())
                .email(userInfo.email())
                .name(userInfo.name())
                .build();
    }
}
