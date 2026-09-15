package com.codit.backend.controller.dto;

import com.codit.backend.domain.AttemptResult;
import java.util.List;

public record AttemptHistoryDetailResponse(
        String problemId,
        AttemptResult latestResult,
        int attemptCount,
        List<TagResponse> tags,
        List<AttemptHistoryItemResponse> attempts) {
}
