package com.codit.backend.service;

import com.codit.backend.domain.AttemptResult;
import com.codit.backend.domain.Tag;
import java.util.List;

public record AttemptHistoryDetail(
        String problemId,
        AttemptResult latestResult,
        int attemptCount,
        List<Tag> tags,
        List<AttemptHistoryEntry> attempts) {
}
