package com.codit.backend.service;

import com.codit.backend.domain.Tag;

public record TagUpsertResult(Tag tag, boolean created) {
}
