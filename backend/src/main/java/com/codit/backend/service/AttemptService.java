package com.codit.backend.service;

import com.codit.backend.domain.Attempt;
import com.codit.backend.domain.AttemptResult;
import com.codit.backend.domain.Tag;
import com.codit.backend.exception.AttemptErrorCode;
import com.codit.backend.exception.AttemptException;
import com.codit.backend.exception.InvalidRequestException;
import com.codit.backend.repository.AttemptRepository;
import com.codit.backend.repository.TagRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AttemptService {

    private static final String INVALID_RESULT_MESSAGE = "result는 CORRECT, WRONG, HOLD 중 하나여야 합니다.";

    private final AttemptRepository attemptRepository;
    private final TagRepository tagRepository;

    public Attempt createAttempt(Long userId, AttemptCreateCommand command) {
        String problemId = command.problemId();
        if (problemId == null || problemId.isBlank()) {
            throw new InvalidRequestException("problemId는 필수입니다.");
        }

        Integer elapsedTime = command.elapsedTime();
        if (elapsedTime == null || elapsedTime < 0) {
            throw new InvalidRequestException("elapsedTime은 0 이상이어야 합니다.");
        }

        AttemptResult result = parseResult(command.result());
        List<Tag> tags = resolveTags(command.tagIds());

        Attempt attempt = new Attempt(userId, problemId, elapsedTime, result, command.memo(), tags);
        return attemptRepository.save(attempt);
    }

    @Transactional
    public Attempt replaceTags(Long userId, Long attemptId, List<Long> tagIds) {
        Attempt attempt = attemptRepository.findById(attemptId)
            .filter(a -> a.getUserId().equals(userId))
            .orElseThrow(() -> new AttemptException(AttemptErrorCode.ATTEMPT_NOT_FOUND));
        if (tagIds == null || tagIds.isEmpty()) {
            throw new AttemptException(AttemptErrorCode.MIN_TAG_REQUIRED);
        }
        attempt.replaceTags(findTagsByIds(tagIds));
        try {
            attemptRepository.flush();
        } catch (ObjectOptimisticLockingFailureException e) {
            throw new AttemptException(AttemptErrorCode.ATTEMPT_CONFLICT);
        }
        return attempt;
    }

    private List<Tag> resolveTags(List<Long> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            throw new InvalidRequestException("태그를 1개 이상 선택해야 합니다.");
        }
        return findTagsByIds(tagIds);
    }

    private List<Tag> findTagsByIds(List<Long> tagIds) {
        if (tagIds.stream().anyMatch(Objects::isNull)) {
            throw new InvalidRequestException("태그 id에 빈 값이 포함될 수 없습니다.");
        }
        List<Long> distinctTagIds = tagIds.stream().distinct().toList();
        Map<Long, Tag> tagsById = new LinkedHashMap<>();
        tagRepository.findAllById(distinctTagIds).forEach(tag -> tagsById.put(tag.getId(), tag));
        if (tagsById.size() != distinctTagIds.size()) {
            throw new InvalidRequestException("존재하지 않는 태그가 포함되어 있습니다.");
        }
        return distinctTagIds.stream().map(tagsById::get).toList();
    }

    private AttemptResult parseResult(String value) {
        if (value == null) {
            throw new InvalidRequestException(INVALID_RESULT_MESSAGE);
        }
        try {
            return AttemptResult.valueOf(value);
        } catch (IllegalArgumentException e) {
            throw new InvalidRequestException(INVALID_RESULT_MESSAGE);
        }
    }
}
