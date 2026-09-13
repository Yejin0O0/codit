package com.codit.backend.exception;

import org.springframework.http.HttpStatus;

public enum AttemptErrorCode {

    ATTEMPT_NOT_FOUND(HttpStatus.NOT_FOUND, "기록을 찾을 수 없습니다"),
    MIN_TAG_REQUIRED(HttpStatus.CONFLICT, "기록에는 최소 1개의 태그가 필요합니다");

    private final HttpStatus httpStatus;
    private final String message;

    AttemptErrorCode(HttpStatus httpStatus, String message) {
        this.httpStatus = httpStatus;
        this.message = message;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }

    public String getMessage() {
        return message;
    }
}
