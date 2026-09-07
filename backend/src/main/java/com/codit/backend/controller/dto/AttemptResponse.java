package com.codit.backend.controller.dto;

import com.codit.backend.domain.AttemptResult;
import java.time.LocalDateTime;
import java.util.List;

public record AttemptResponse(
        Long id,
        String problemId,
        int elapsedTime,
        AttemptResult result,
        List<TagResponse> tags,
        String memo,
        LocalDateTime createdAt
) {
}
