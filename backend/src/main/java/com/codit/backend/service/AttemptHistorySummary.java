package com.codit.backend.service;

import com.codit.backend.domain.AttemptResult;
import com.codit.backend.domain.Tag;
import java.time.Instant;
import java.util.List;

public record AttemptHistorySummary(
        String problemId,
        AttemptResult latestResult,
        int attemptCount,
        int latestElapsedTime,
        Instant latestSolvedAt,
        List<Tag> tags) {
}
