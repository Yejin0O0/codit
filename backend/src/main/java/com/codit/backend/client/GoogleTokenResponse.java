package com.codit.backend.client;

import com.fasterxml.jackson.annotation.JsonProperty;

record GoogleTokenResponse(@JsonProperty("access_token") String accessToken) {
}
