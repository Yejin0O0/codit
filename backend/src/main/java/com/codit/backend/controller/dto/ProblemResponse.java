package com.codit.backend.controller.dto;

import java.time.LocalDateTime;

public record ProblemResponse(Long id, String problemId, String url, LocalDateTime createdAt) {
}
