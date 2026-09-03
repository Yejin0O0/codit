package com.codit.backend.service;

import com.codit.backend.domain.Problem;

public record ProblemUpsertResult(Problem problem, boolean created) {
}
