package com.codit.backend.controller;

import com.codit.backend.controller.dto.AttemptResponse;
import com.codit.backend.controller.dto.CreateAttemptRequest;
import com.codit.backend.controller.dto.TagResponse;
import com.codit.backend.domain.Attempt;
import com.codit.backend.service.AttemptCreateCommand;
import com.codit.backend.service.AttemptService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
        AttemptCreateCommand command = new AttemptCreateCommand(
                request.problemId(), request.elapsedTime(), request.result(),
                request.tagIds(), request.memo());
        Attempt attempt = attemptService.createAttempt(userId, command);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(attempt));
    }

    private AttemptResponse toResponse(Attempt attempt) {
        List<TagResponse> tags = attempt.getTags().stream()
                .map(TagResponse::from)
                .toList();
        return new AttemptResponse(
                attempt.getId(), attempt.getProblemId(), attempt.getElapsedTime(),
                attempt.getResult(), tags, attempt.getMemo(), attempt.getCreatedAt());
    }
}
