package com.codit.backend.service;

import com.codit.backend.domain.Attempt;
import com.codit.backend.domain.AttemptResult;
import com.codit.backend.domain.Tag;
import com.codit.backend.exception.AttemptErrorCode;
import com.codit.backend.exception.AttemptException;
import com.codit.backend.exception.InvalidRequestException;
import com.codit.backend.repository.AttemptRepository;
import com.codit.backend.repository.TagRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
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

    public List<AttemptHistorySummary> getHistory(Long userId) {
        List<Attempt> attempts = attemptRepository.findAllByUserIdWithTags(userId);
        Map<String, List<Attempt>> byProblemId = attempts.stream()
                .collect(Collectors.groupingBy(Attempt::getProblemId, LinkedHashMap::new, Collectors.toList()));

        List<AttemptHistorySummary> summaries = byProblemId.values().stream()
                .map(this::toSummary)
                .collect(Collectors.toCollection(ArrayList::new));
        summaries.sort(Comparator.comparing(AttemptHistorySummary::latestSolvedAt).reversed());
        return summaries;
    }

    public AttemptHistoryDetail getHistoryDetail(Long userId, String problemId) {
        List<Attempt> attempts = attemptRepository.findAllByUserIdAndProblemIdWithTags(userId, problemId);
        if (attempts.isEmpty()) {
            throw new AttemptException(AttemptErrorCode.ATTEMPT_NOT_FOUND);
        }

        // attempts는 createdAt 오름차순이므로 뒤에서부터 채우면 seq 내림차순(최신순)이
        // 바로 나온다 — 정렬을 별도로 호출할 필요가 없다.
        List<AttemptHistoryEntry> entries = new ArrayList<>();
        for (int i = attempts.size() - 1; i >= 0; i--) {
            entries.add(new AttemptHistoryEntry(i + 1, attempts.get(i)));
        }

        Attempt latest = mostRecent(attempts);
        return new AttemptHistoryDetail(problemId, latest.getResult(), attempts.size(),
                unionTags(attempts), entries);
    }

    private AttemptHistorySummary toSummary(List<Attempt> problemAttempts) {
        Attempt latest = mostRecent(problemAttempts);
        return new AttemptHistorySummary(
                latest.getProblemId(), latest.getResult(), problemAttempts.size(),
                latest.getElapsedTime(), latest.getCreatedAt(), unionTags(problemAttempts));
    }

    /** attempts는 createdAt 오름차순으로 주어진다고 가정한다 — 마지막 원소가 가장 최근 시도다. */
    private Attempt mostRecent(List<Attempt> attempts) {
        return attempts.get(attempts.size() - 1);
    }

    /** 여러 attempt에 걸친 태그를 id 기준으로 중복 없이 합친다. */
    private List<Tag> unionTags(List<Attempt> attempts) {
        Map<Long, Tag> tagsById = new LinkedHashMap<>();
        for (Attempt attempt : attempts) {
            for (Tag tag : attempt.getTags()) {
                tagsById.putIfAbsent(tag.getId(), tag);
            }
        }
        return new ArrayList<>(tagsById.values());
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
