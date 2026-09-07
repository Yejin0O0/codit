package com.codit.backend.service;

import com.codit.backend.domain.Attempt;
import com.codit.backend.domain.AttemptResult;
import com.codit.backend.domain.Tag;
import com.codit.backend.exception.InvalidRequestException;
import com.codit.backend.repository.AttemptRepository;
import com.codit.backend.repository.TagRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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

    private List<Tag> resolveTags(List<Long> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            throw new InvalidRequestException("태그를 1개 이상 선택해야 합니다.");
        }
        List<Long> distinctTagIds = tagIds.stream().distinct().toList();
        List<Tag> tags = tagRepository.findAllById(distinctTagIds);
        if (tags.size() != distinctTagIds.size()) {
            throw new InvalidRequestException("존재하지 않는 태그가 포함되어 있습니다.");
        }
        return tags;
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
