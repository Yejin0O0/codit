package com.codit.backend.exception;

public class AttemptException extends RuntimeException {

    private final AttemptErrorCode errorCode;

    public AttemptException(AttemptErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public AttemptErrorCode getErrorCode() {
        return errorCode;
    }
}
