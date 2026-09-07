package com.codit.backend.controller.dto;

import com.codit.backend.domain.Tag;

public record TagResponse(Long id, String name, String category) {

    public static TagResponse from(Tag tag) {
        return new TagResponse(tag.getId(), tag.getName(), tag.getCategory());
    }
}
