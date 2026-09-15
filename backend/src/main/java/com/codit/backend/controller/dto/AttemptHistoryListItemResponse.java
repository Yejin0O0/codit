package com.codit.backend.controller.dto;

import com.codit.backend.domain.AttemptResult;
import java.time.Instant;
import java.util.List;

public record AttemptHistoryListItemResponse(
        String problemId,
        AttemptResult latestResult,
        int attemptCount,
        int latestElapsedTime,
        Instant latestSolvedAt,
        List<TagResponse> tags) {
}
