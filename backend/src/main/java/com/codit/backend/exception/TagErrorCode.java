package com.codit.backend.exception;

import org.springframework.http.HttpStatus;

public enum TagErrorCode {

    TAG_NOT_FOUND(HttpStatus.NOT_FOUND, "태그를 찾을 수 없습니다"),
    TAG_NOT_EDITABLE(HttpStatus.FORBIDDEN, "CORE/카테고리 태그는 수정하거나 삭제할 수 없습니다"),
    TAG_NAME_CONFLICT(HttpStatus.CONFLICT, "이미 존재하는 태그 이름입니다"),
    TAG_IN_USE(HttpStatus.CONFLICT, "이 태그는 기록에 사용 중입니다");

    private final HttpStatus httpStatus;
    private final String message;

    TagErrorCode(HttpStatus httpStatus, String message) {
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
