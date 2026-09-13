package com.codit.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.codit.backend.domain.Tag;
import com.codit.backend.exception.InvalidRequestException;
import com.codit.backend.exception.TagErrorCode;
import com.codit.backend.exception.TagException;
import com.codit.backend.repository.AttemptRepository;
import com.codit.backend.repository.TagRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TagService {

    private static final String CUSTOM_CATEGORY = "CUSTOM";

    private final TagRepository tagRepository;
    private final AttemptRepository attemptRepository;

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

    @Transactional
    public Tag renameTag(Long id, String name) {
        Tag tag = findEditableCustomTag(id);
        if (name == null || name.isBlank()) {
            throw new InvalidRequestException("name은 필수입니다.");
        }

        String normalizedName = name.trim().toLowerCase();
        Optional<Tag> conflict = tagRepository.findByNormalizedName(normalizedName);
        if (conflict.isPresent() && !conflict.get().getId().equals(id)) {
            throw new TagException(TagErrorCode.TAG_NAME_CONFLICT);
        }

        tag.rename(name.trim(), normalizedName);
        return tag;
    }

    public void deleteTag(Long id) {
        Tag tag = findEditableCustomTag(id);
        if (attemptRepository.existsByTagsContaining(tag)) {
            throw new TagException(TagErrorCode.TAG_IN_USE);
        }
        tagRepository.delete(tag);
    }

    private Tag findEditableCustomTag(Long id) {
        Tag tag = tagRepository.findById(id)
            .orElseThrow(() -> new TagException(TagErrorCode.TAG_NOT_FOUND));
        if (!tag.getCategory().equals(CUSTOM_CATEGORY)) {
            throw new TagException(TagErrorCode.TAG_NOT_EDITABLE);
        }
        return tag;
    }

    private TagUpsertResult createTag(String name, String normalizedName) {
        try {
            Tag saved = tagRepository.save(new Tag(name, normalizedName, CUSTOM_CATEGORY));
            return new TagUpsertResult(saved, true);
        } catch (DataIntegrityViolationException e) {
            Tag existing = tagRepository.findByNormalizedName(normalizedName).orElseThrow();
            return new TagUpsertResult(existing, false);
        }
    }
}
