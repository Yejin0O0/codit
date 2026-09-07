package com.codit.backend.controller;

import com.codit.backend.controller.dto.AttemptResponse;
import com.codit.backend.controller.dto.CreateAttemptRequest;
import com.codit.backend.service.AttemptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/attempts")
@RequiredArgsConstructor
public class AttemptController {

    private final AttemptService attemptService;

    @PostMapping
    public ResponseEntity<AttemptResponse> createAttempt(
            @AuthenticationPrincipal Long userId,
            @RequestBody CreateAttemptRequest request) {
        return ResponseEntity.ok().build();
    }
}
