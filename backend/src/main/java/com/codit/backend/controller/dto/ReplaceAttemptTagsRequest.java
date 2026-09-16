package com.codit.backend.controller.dto;

import java.util.List;

public record ReplaceAttemptTagsRequest(List<Long> tagIds) {
}
