package com.codit.backend.service;

import java.util.List;

public record AttemptCreateCommand(
        String problemId,
        Integer elapsedTime,
        String result,
        List<Long> tagIds,
        String memo
) {
}
