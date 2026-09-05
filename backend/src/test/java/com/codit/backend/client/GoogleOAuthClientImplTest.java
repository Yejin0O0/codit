package com.codit.backend.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class GoogleOAuthClientImplTest {

    private static final GoogleOAuthProperties PROPERTIES = new GoogleOAuthProperties(
            "client-id", "client-secret",
            "https://oauth2.googleapis.com/token",
            "https://www.googleapis.com/oauth2/v3/userinfo");

    private MockRestServiceServer mockServer;
    private GoogleOAuthClientImpl googleOAuthClient;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(builder).build();
        googleOAuthClient = new GoogleOAuthClientImpl(builder, PROPERTIES);
    }

    @Test
    @DisplayName("토큰 교환과 userinfo 호출이 모두 성공하면 sub/email/name이 채워진 GoogleProfile을 반환해야 한다")
    void shouldReturnGoogleProfileWhenTokenExchangeAndUserInfoSucceed() {
        mockServer.expect(requestTo(PROPERTIES.tokenUri()))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("{\"access_token\":\"google-access-token\"}", MediaType.APPLICATION_JSON));
        mockServer.expect(requestTo(PROPERTIES.userInfoUri()))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer google-access-token"))
                .andRespond(withSuccess(
                        "{\"sub\":\"google-sub-123\",\"email\":\"test@gmail.com\",\"name\":\"Test User\"}",
                        MediaType.APPLICATION_JSON));

        GoogleProfile profile = googleOAuthClient.getProfile("auth-code", "http://redirect");

        assertThat(profile).isNotNull();
        assertThat(profile.getSub()).isEqualTo("google-sub-123");
        assertThat(profile.getEmail()).isEqualTo("test@gmail.com");
        assertThat(profile.getName()).isEqualTo("Test User");
        mockServer.verify();
    }

    @Test
    @DisplayName("userinfo 응답에 name이 없으면 name을 null로 매핑해야 한다")
    void shouldMapNameAsNullWhenUserInfoResponseOmitsName() {
        mockServer.expect(requestTo(PROPERTIES.tokenUri()))
                .andRespond(withSuccess("{\"access_token\":\"google-access-token\"}", MediaType.APPLICATION_JSON));
        mockServer.expect(requestTo(PROPERTIES.userInfoUri()))
                .andRespond(withSuccess(
                        "{\"sub\":\"google-sub-123\",\"email\":\"test@gmail.com\"}", MediaType.APPLICATION_JSON));

        GoogleProfile profile = googleOAuthClient.getProfile("auth-code", "http://redirect");

        assertThat(profile).isNotNull();
        assertThat(profile.getName()).isNull();
    }

    @Test
    @DisplayName("토큰 엔드포인트가 4xx/5xx를 응답하면 예외를 던져야 한다")
    void shouldThrowWhenTokenEndpointRespondsWithError() {
        mockServer.expect(requestTo(PROPERTIES.tokenUri()))
                .andRespond(withStatus(HttpStatus.BAD_REQUEST));

        assertThatThrownBy(() -> googleOAuthClient.getProfile("bad-code", "http://redirect"))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("userinfo 엔드포인트가 4xx/5xx를 응답하면 예외를 던져야 한다")
    void shouldThrowWhenUserInfoEndpointRespondsWithError() {
        mockServer.expect(requestTo(PROPERTIES.tokenUri()))
                .andRespond(withSuccess("{\"access_token\":\"google-access-token\"}", MediaType.APPLICATION_JSON));
        mockServer.expect(requestTo(PROPERTIES.userInfoUri()))
                .andRespond(withStatus(HttpStatus.UNAUTHORIZED));

        assertThatThrownBy(() -> googleOAuthClient.getProfile("auth-code", "http://redirect"))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("토큰 응답에 access_token이 없으면 예외를 던져야 한다")
    void shouldThrowWhenTokenResponseHasNoAccessToken() {
        mockServer.expect(requestTo(PROPERTIES.tokenUri()))
                .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> googleOAuthClient.getProfile("auth-code", "http://redirect"))
                .isInstanceOf(RuntimeException.class);
    }
}
