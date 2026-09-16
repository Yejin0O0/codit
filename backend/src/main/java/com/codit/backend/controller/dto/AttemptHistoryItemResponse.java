package com.codit.backend.controller.dto;

import com.codit.backend.domain.AttemptResult;
import java.time.Instant;
import java.util.List;

public record AttemptHistoryItemResponse(
        int seq,
        AttemptResult result,
        int elapsedTime,
        List<TagResponse> tags,
        String memo,
        Instant createdAt) {
}
