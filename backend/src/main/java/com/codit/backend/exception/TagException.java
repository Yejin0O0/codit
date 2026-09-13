package com.codit.backend.exception;

public class TagException extends RuntimeException {

    private final TagErrorCode errorCode;

    public TagException(TagErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public TagErrorCode getErrorCode() {
        return errorCode;
    }
}
