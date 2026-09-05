package com.codit.backend.service;

import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import com.codit.backend.domain.Tag;
import com.codit.backend.exception.InvalidRequestException;
import com.codit.backend.repository.TagRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;

    public List<Tag> getAllTags() {
        return tagRepository.findAll();
    }

    public TagUpsertResult upsertTag(String name) {
        if (name == null || name.isBlank()) {
            throw new InvalidRequestException("name은 필수입니다.");
        }

        String normalizedName = name.trim().toLowerCase();
        return tagRepository.findByNormalizedName(normalizedName)
            .map(existing -> new TagUpsertResult(existing, false))
            .orElseGet(() -> createTag(name.trim(), normalizedName));
    }

    private TagUpsertResult createTag(String name, String normalizedName) {
        try {
            Tag saved = tagRepository.save(new Tag(name, normalizedName, "CUSTOM"));
            return new TagUpsertResult(saved, true);
        } catch (DataIntegrityViolationException e) {
            Tag existing = tagRepository.findByNormalizedName(normalizedName).orElseThrow();
            return new TagUpsertResult(existing, false);
        }
    }
}
