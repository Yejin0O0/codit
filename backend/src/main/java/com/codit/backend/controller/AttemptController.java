package com.codit.backend.controller;

import com.codit.backend.controller.dto.AttemptHistoryDetailResponse;
import com.codit.backend.controller.dto.AttemptHistoryItemResponse;
import com.codit.backend.controller.dto.AttemptHistoryListItemResponse;
import com.codit.backend.controller.dto.AttemptResponse;
import com.codit.backend.controller.dto.CreateAttemptRequest;
import com.codit.backend.controller.dto.ReplaceAttemptTagsRequest;
import com.codit.backend.controller.dto.TagResponse;
import com.codit.backend.domain.Attempt;
import com.codit.backend.domain.Tag;
import com.codit.backend.service.AttemptCreateCommand;
import com.codit.backend.service.AttemptHistoryDetail;
import com.codit.backend.service.AttemptHistoryEntry;
import com.codit.backend.service.AttemptHistorySummary;
import com.codit.backend.service.AttemptService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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

    @PutMapping("/{id}/tags")
    public ResponseEntity<AttemptResponse> replaceTags(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @RequestBody ReplaceAttemptTagsRequest request) {
        Attempt attempt = attemptService.replaceTags(userId, id, request.tagIds());
        return ResponseEntity.ok(toResponse(attempt));
    }

    @GetMapping
    public ResponseEntity<List<AttemptHistoryListItemResponse>> getHistory(
            @AuthenticationPrincipal Long userId) {
        List<AttemptHistoryListItemResponse> body = attemptService.getHistory(userId).stream()
                .map(this::toListItemResponse)
                .toList();
        return ResponseEntity.ok(body);
    }

    @GetMapping("/{problemId}")
    public ResponseEntity<AttemptHistoryDetailResponse> getHistoryDetail(
            @AuthenticationPrincipal Long userId, @PathVariable String problemId) {
        AttemptHistoryDetail detail = attemptService.getHistoryDetail(userId, problemId);
        return ResponseEntity.ok(toDetailResponse(detail));
    }

    private AttemptResponse toResponse(Attempt attempt) {
        return new AttemptResponse(
                attempt.getId(), attempt.getProblemId(), attempt.getElapsedTime(),
                attempt.getResult(), toTagResponses(attempt.getTags()), attempt.getMemo(), attempt.getCreatedAt());
    }

    private AttemptHistoryListItemResponse toListItemResponse(AttemptHistorySummary summary) {
        return new AttemptHistoryListItemResponse(
                summary.problemId(), summary.latestResult(), summary.attemptCount(),
                summary.latestElapsedTime(), summary.latestSolvedAt(), toTagResponses(summary.tags()));
    }

    private AttemptHistoryDetailResponse toDetailResponse(AttemptHistoryDetail detail) {
        List<AttemptHistoryItemResponse> attempts = detail.attempts().stream()
                .map(this::toHistoryItemResponse)
                .toList();
        return new AttemptHistoryDetailResponse(
                detail.problemId(), detail.latestResult(), detail.attemptCount(),
                toTagResponses(detail.tags()), attempts);
    }

    private AttemptHistoryItemResponse toHistoryItemResponse(AttemptHistoryEntry entry) {
        Attempt attempt = entry.attempt();
        return new AttemptHistoryItemResponse(
                entry.seq(), attempt.getResult(), attempt.getElapsedTime(),
                toTagResponses(attempt.getTags()), attempt.getMemo(), attempt.getCreatedAt());
    }

    private List<TagResponse> toTagResponses(List<Tag> tags) {
        return tags.stream()
                .map(TagResponse::from)
                .toList();
    }
}
