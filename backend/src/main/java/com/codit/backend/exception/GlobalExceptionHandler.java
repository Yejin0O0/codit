package com.codit.backend.exception;

import com.codit.backend.dto.ErrorResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<ErrorResponse> handleAuthException(AuthException e) {
        return ResponseEntity
            .status(e.getErrorCode().getHttpStatus())
            .body(new ErrorResponse(e.getErrorCode().name(), e.getMessage()));
    }
}
