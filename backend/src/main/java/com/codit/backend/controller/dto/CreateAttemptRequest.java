package com.codit.backend.controller.dto;

import java.util.List;

public record CreateAttemptRequest(
        String problemId,
        Integer elapsedTime,
        String result,
        List<Long> tagIds,
        String memo
) {
}
