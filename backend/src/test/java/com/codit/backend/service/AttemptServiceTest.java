package com.codit.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.codit.backend.domain.Attempt;
import com.codit.backend.domain.AttemptResult;
import com.codit.backend.domain.Tag;
import com.codit.backend.exception.AttemptErrorCode;
import com.codit.backend.exception.AttemptException;
import com.codit.backend.exception.InvalidRequestException;
import com.codit.backend.repository.AttemptRepository;
import com.codit.backend.repository.TagRepository;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AttemptServiceTest {

    private static final String PROBLEM_ID = "AZ8R8haaeYnHBITH";

    @Mock
    private AttemptRepository attemptRepository;

    @Mock
    private TagRepository tagRepository;

    @InjectMocks
    private AttemptService attemptService;

    private AttemptCreateCommand command(String result, List<Long> tagIds, String memo) {
        return new AttemptCreateCommand(PROBLEM_ID, 342, result, tagIds, memo);
    }

    private Tag tag(String name) {
        return new Tag(name, name.toLowerCase(), "CORE");
    }

    private Tag tag(Long id, String name) {
        Tag tag = tag(name);
        ReflectionTestUtils.setField(tag, "id", id);
        return tag;
    }

    private Tag tagWithId(long id, String name) {
        return tag(id, name);
    }

    private Attempt attemptAt(Long userId, String problemId, AttemptResult result, int elapsedTime,
            String memo, List<Tag> tags, Instant createdAt) {
        Attempt a = new Attempt(userId, problemId, elapsedTime, result, memo, tags);
        ReflectionTestUtils.setField(a, "createdAt", createdAt);
        return a;
    }

    // ── 정상 ──────────────────────────────────────────────

    @Test
    void shouldSaveAttemptWithResultCorrectAndNullMemoWhenValidInput() {
        given(tagRepository.findAllById(List.of(1L))).willReturn(List.of(tag("구현")));
        given(attemptRepository.save(any(Attempt.class))).willAnswer(inv -> inv.getArgument(0));

        Attempt result = attemptService.createAttempt(1L, command("CORRECT", List.of(1L), null));

        assertThat(result).isNotNull();
        assertThat(result.getResult()).isEqualTo(AttemptResult.CORRECT);
        assertThat(result.getMemo()).isNull();
    }

    @Test
    void shouldSaveAttemptWithResultWrongAndGivenMemo() {
        given(tagRepository.findAllById(List.of(1L))).willReturn(List.of(tag("DFS")));
        given(attemptRepository.save(any(Attempt.class))).willAnswer(inv -> inv.getArgument(0));

        Attempt result = attemptService.createAttempt(1L, command("WRONG", List.of(1L), "반례 존재"));

        assertThat(result).isNotNull();
        assertThat(result.getResult()).isEqualTo(AttemptResult.WRONG);
        assertThat(result.getMemo()).isEqualTo("반례 존재");
    }

    @Test
    void shouldSaveAttemptWithResultHold() {
        given(tagRepository.findAllById(List.of(1L))).willReturn(List.of(tag("백트래킹")));
        given(attemptRepository.save(any(Attempt.class))).willAnswer(inv -> inv.getArgument(0));

        Attempt result = attemptService.createAttempt(1L, command("HOLD", List.of(1L), null));

        assertThat(result).isNotNull();
        assertThat(result.getResult()).isEqualTo(AttemptResult.HOLD);
    }

    @Test
    void shouldStoreUserIdPassedAsParameter() {
        given(tagRepository.findAllById(List.of(1L))).willReturn(List.of(tag("구현")));
        given(attemptRepository.save(any(Attempt.class))).willAnswer(inv -> inv.getArgument(0));

        Attempt result = attemptService.createAttempt(77L, command("CORRECT", List.of(1L), null));

        assertThat(result).isNotNull();
        assertThat(result.getUserId()).isEqualTo(77L);
    }

    @Test
    void shouldLinkAllTagsResolvedFromTagIds() {
        given(tagRepository.findAllById(List.of(1L, 2L))).willReturn(List.of(tag(1L, "DFS"), tag(2L, "그리디")));
        given(attemptRepository.save(any(Attempt.class))).willAnswer(inv -> inv.getArgument(0));

        Attempt result = attemptService.createAttempt(1L, command("CORRECT", List.of(1L, 2L), null));

        assertThat(result).isNotNull();
        assertThat(result.getTags()).hasSize(2);
    }

    @Test
    void shouldSaveAttemptWhenMemoIsNull() {
        given(tagRepository.findAllById(List.of(1L))).willReturn(List.of(tag("구현")));
        given(attemptRepository.save(any(Attempt.class))).willAnswer(inv -> inv.getArgument(0));

        Attempt result = attemptService.createAttempt(1L, command("CORRECT", List.of(1L), null));

        assertThat(result).isNotNull();
        assertThat(result.getMemo()).isNull();
    }

    // ── 경계 ──────────────────────────────────────────────

    @Test
    void shouldAcceptElapsedTimeOfExactlyZero() {
        given(tagRepository.findAllById(List.of(1L))).willReturn(List.of(tag("구현")));
        given(attemptRepository.save(any(Attempt.class))).willAnswer(inv -> inv.getArgument(0));

        Attempt result = attemptService.createAttempt(1L,
                new AttemptCreateCommand(PROBLEM_ID, 0, "CORRECT", List.of(1L), null));

        assertThat(result).isNotNull();
        assertThat(result.getElapsedTime()).isZero();
    }

    @Test
    void shouldAcceptExactlyOneTagId() {
        given(tagRepository.findAllById(List.of(1L))).willReturn(List.of(tag("구현")));
        given(attemptRepository.save(any(Attempt.class))).willAnswer(inv -> inv.getArgument(0));

        Attempt result = attemptService.createAttempt(1L, command("CORRECT", List.of(1L), null));

        assertThat(result).isNotNull();
        assertThat(result.getTags()).hasSize(1);
    }

    @Test
    void shouldAcceptDuplicateTagIdsAndLinkEachDistinctTagOnce() {
        given(tagRepository.findAllById(List.of(1L))).willReturn(List.of(tag("구현")));
        given(attemptRepository.save(any(Attempt.class))).willAnswer(inv -> inv.getArgument(0));

        Attempt result = attemptService.createAttempt(1L, command("CORRECT", List.of(1L, 1L), null));

        assertThat(result).isNotNull();
        assertThat(result.getTags()).hasSize(1);
    }

    // ── 예외 ──────────────────────────────────────────────

    @Test
    void shouldRejectWhenProblemIdIsNull() {
        assertThatThrownBy(() -> attemptService.createAttempt(1L,
                new AttemptCreateCommand(null, 342, "CORRECT", List.of(1L), null)))
                .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void shouldRejectWhenProblemIdIsBlank() {
        assertThatThrownBy(() -> attemptService.createAttempt(1L,
                new AttemptCreateCommand("   ", 342, "CORRECT", List.of(1L), null)))
                .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void shouldRejectWhenElapsedTimeIsNull() {
        assertThatThrownBy(() -> attemptService.createAttempt(1L,
                new AttemptCreateCommand(PROBLEM_ID, null, "CORRECT", List.of(1L), null)))
                .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void shouldRejectWhenElapsedTimeIsNegative() {
        assertThatThrownBy(() -> attemptService.createAttempt(1L,
                new AttemptCreateCommand(PROBLEM_ID, -1, "CORRECT", List.of(1L), null)))
                .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void shouldRejectWhenResultIsNull() {
        assertThatThrownBy(() -> attemptService.createAttempt(1L, command(null, List.of(1L), null)))
                .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void shouldRejectWhenResultIsNotOneOfCorrectWrongHold() {
        assertThatThrownBy(() -> attemptService.createAttempt(1L, command("BANANA", List.of(1L), null)))
                .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void shouldRejectWhenTagIdsIsNull() {
        assertThatThrownBy(() -> attemptService.createAttempt(1L, command("CORRECT", null, null)))
                .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void shouldRejectWhenTagIdsIsEmpty() {
        assertThatThrownBy(() -> attemptService.createAttempt(1L, command("CORRECT", List.of(), null)))
                .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void shouldRejectAndNotSaveWhenTagIdsContainsIdNotInTagTable() {
        given(tagRepository.findAllById(List.of(1L, 999L))).willReturn(List.of(tag("구현")));

        assertThatThrownBy(() -> attemptService.createAttempt(1L, command("CORRECT", List.of(1L, 999L), null)))
                .isInstanceOf(InvalidRequestException.class);
        verify(attemptRepository, never()).save(any());
    }

    @Test
    void shouldRejectWhenTagIdsContainsNullElement() {
        assertThatThrownBy(() -> attemptService.createAttempt(1L,
                command("CORRECT", Arrays.asList(1L, null), null)))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("빈 값");
        verify(attemptRepository, never()).save(any());
    }

    // ── replaceTags: 정상 ──────────────────────────────────

    private Attempt attemptOwnedBy(Long userId, Long attemptId, List<Tag> tags) {
        Attempt attempt = new Attempt(userId, PROBLEM_ID, 342, AttemptResult.CORRECT, null, tags);
        ReflectionTestUtils.setField(attempt, "id", attemptId);
        return attempt;
    }

    @Test
    void shouldReplaceAttemptTagsAndReturnUpdatedAttemptWhenValidTagIdsGivenForOwnersAttempt() {
        Attempt existing = attemptOwnedBy(1L, 10L, List.of(tag("구현")));
        given(attemptRepository.findById(10L)).willReturn(Optional.of(existing));
        given(tagRepository.findAllById(List.of(4L, 6L, 26L)))
                .willReturn(List.of(tag(4L, "A"), tag(6L, "B"), tag(26L, "C")));

        Attempt result = attemptService.replaceTags(1L, 10L, List.of(4L, 6L, 26L));

        assertThat(result.getTags()).hasSize(3);
    }

    @Test
    void shouldReturnTagsInRequestedTagIdOrderRegardlessOfRepositoryReturnOrder() {
        Attempt existing = attemptOwnedBy(1L, 10L, List.of(tag("구현")));
        given(attemptRepository.findById(10L)).willReturn(Optional.of(existing));
        given(tagRepository.findAllById(List.of(4L, 6L, 26L)))
                .willReturn(List.of(tag(26L, "C"), tag(4L, "A"), tag(6L, "B")));

        Attempt result = attemptService.replaceTags(1L, 10L, List.of(4L, 6L, 26L));

        assertThat(result.getTags()).extracting(Tag::getId).containsExactly(4L, 6L, 26L);
    }

    // ── replaceTags: 경계 ──────────────────────────────────

    @Test
    void shouldAcceptExactlyOneTagIdWhenReplacingTags() {
        Attempt existing = attemptOwnedBy(1L, 10L, List.of(tag("구현")));
        given(attemptRepository.findById(10L)).willReturn(Optional.of(existing));
        given(tagRepository.findAllById(List.of(6L))).willReturn(List.of(tag("DFS")));

        Attempt result = attemptService.replaceTags(1L, 10L, List.of(6L));

        assertThat(result.getTags()).hasSize(1);
    }

    @Test
    void shouldAcceptDuplicateTagIdsAndLinkEachDistinctTagOnceWhenReplacingTags() {
        Attempt existing = attemptOwnedBy(1L, 10L, List.of(tag("구현")));
        given(attemptRepository.findById(10L)).willReturn(Optional.of(existing));
        given(tagRepository.findAllById(List.of(6L))).willReturn(List.of(tag("DFS")));

        Attempt result = attemptService.replaceTags(1L, 10L, List.of(6L, 6L));

        assertThat(result.getTags()).hasSize(1);
    }

    // ── replaceTags: 예외 ──────────────────────────────────

    @Test
    void shouldThrowAttemptConflictWhenConcurrentReplaceCausesOptimisticLockFailure() {
        Attempt existing = attemptOwnedBy(1L, 10L, List.of(tag("구현")));
        given(attemptRepository.findById(10L)).willReturn(Optional.of(existing));
        given(tagRepository.findAllById(List.of(6L))).willReturn(List.of(tag(6L, "DFS")));
        org.mockito.Mockito.doThrow(new org.springframework.orm.ObjectOptimisticLockingFailureException(Attempt.class, 10L))
                .when(attemptRepository).flush();

        assertThatThrownBy(() -> attemptService.replaceTags(1L, 10L, List.of(6L)))
                .isInstanceOf(AttemptException.class)
                .extracting(e -> ((AttemptException) e).getErrorCode())
                .isEqualTo(AttemptErrorCode.ATTEMPT_CONFLICT);
    }

    @Test
    void shouldThrowAttemptNotFoundWhenReplacingTagsOnNonExistentAttempt() {
        given(attemptRepository.findById(999L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> attemptService.replaceTags(1L, 999L, List.of(6L)))
                .isInstanceOf(AttemptException.class)
                .extracting(e -> ((AttemptException) e).getErrorCode())
                .isEqualTo(AttemptErrorCode.ATTEMPT_NOT_FOUND);
    }

    @Test
    void shouldThrowAttemptNotFoundWhenReplacingTagsOnAnotherUsersAttempt() {
        Attempt ownedByUserA = attemptOwnedBy(100L, 10L, List.of(tag("구현")));
        given(attemptRepository.findById(10L)).willReturn(Optional.of(ownedByUserA));

        assertThatThrownBy(() -> attemptService.replaceTags(200L, 10L, List.of(6L)))
                .isInstanceOf(AttemptException.class)
                .extracting(e -> ((AttemptException) e).getErrorCode())
                .isEqualTo(AttemptErrorCode.ATTEMPT_NOT_FOUND);
    }

    @Test
    void shouldThrowMinTagRequiredWhenReplacingWithNullTagIds() {
        Attempt existing = attemptOwnedBy(1L, 10L, List.of(tag("구현")));
        given(attemptRepository.findById(10L)).willReturn(Optional.of(existing));

        assertThatThrownBy(() -> attemptService.replaceTags(1L, 10L, null))
                .isInstanceOf(AttemptException.class)
                .extracting(e -> ((AttemptException) e).getErrorCode())
                .isEqualTo(AttemptErrorCode.MIN_TAG_REQUIRED);
    }

    @Test
    void shouldThrowMinTagRequiredWhenReplacingWithEmptyTagIds() {
        Attempt existing = attemptOwnedBy(1L, 10L, List.of(tag("구현")));
        given(attemptRepository.findById(10L)).willReturn(Optional.of(existing));

        assertThatThrownBy(() -> attemptService.replaceTags(1L, 10L, List.of()))
                .isInstanceOf(AttemptException.class)
                .extracting(e -> ((AttemptException) e).getErrorCode())
                .isEqualTo(AttemptErrorCode.MIN_TAG_REQUIRED);
    }

    @Test
    void shouldThrowInvalidRequestExceptionWhenReplaceTagIdsContainsNullElement() {
        Attempt existing = attemptOwnedBy(1L, 10L, List.of(tag("구현")));
        given(attemptRepository.findById(10L)).willReturn(Optional.of(existing));

        assertThatThrownBy(() -> attemptService.replaceTags(1L, 10L, Arrays.asList(6L, null)))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("빈 값");
    }

    @Test
    void shouldThrowInvalidRequestExceptionAndNotReplaceWhenReplaceTagIdsContainsIdNotInTagTable() {
        Tag original = tag("구현");
        Attempt existing = attemptOwnedBy(1L, 10L, List.of(original));
        given(attemptRepository.findById(10L)).willReturn(Optional.of(existing));
        given(tagRepository.findAllById(List.of(6L, 999L))).willReturn(List.of(tag("DFS")));

        assertThatThrownBy(() -> attemptService.replaceTags(1L, 10L, List.of(6L, 999L)))
                .isInstanceOf(InvalidRequestException.class);

        assertThat(existing.getTags()).containsExactly(original);
    }

    // ── #88 getHistory — 정상/경계 ──────────────────────────

    @Test
    void shouldReturnOneSummaryPerDistinctProblemId() {
        Attempt p1 = attemptAt(1L, "P1", AttemptResult.WRONG, 100, null, List.of(),
                Instant.parse("2026-01-01T00:00:00Z"));
        Attempt p2 = attemptAt(1L, "P2", AttemptResult.CORRECT, 200, null, List.of(),
                Instant.parse("2026-01-02T00:00:00Z"));
        given(attemptRepository.findAllByUserIdWithTags(1L)).willReturn(List.of(p1, p2));

        List<AttemptHistorySummary> result = attemptService.getHistory(1L);

        assertThat(result).extracting(AttemptHistorySummary::problemId)
                .containsExactlyInAnyOrder("P1", "P2");
    }

    @Test
    void shouldSetLatestFieldsFromMostRecentAttempt() {
        Attempt older = attemptAt(1L, "P1", AttemptResult.WRONG, 100, null, List.of(),
                Instant.parse("2026-01-01T00:00:00Z"));
        Attempt newer = attemptAt(1L, "P1", AttemptResult.CORRECT, 200, null, List.of(),
                Instant.parse("2026-01-02T00:00:00Z"));
        given(attemptRepository.findAllByUserIdWithTags(1L)).willReturn(List.of(older, newer));

        AttemptHistorySummary summary = attemptService.getHistory(1L).get(0);

        assertThat(summary.latestResult()).isEqualTo(AttemptResult.CORRECT);
        assertThat(summary.latestElapsedTime()).isEqualTo(200);
        assertThat(summary.latestSolvedAt()).isEqualTo(Instant.parse("2026-01-02T00:00:00Z"));
    }

    @Test
    void shouldSetAttemptCountToNumberOfAttemptsForThatProblem() {
        Attempt a1 = attemptAt(1L, "P1", AttemptResult.WRONG, 100, null, List.of(),
                Instant.parse("2026-01-01T00:00:00Z"));
        Attempt a2 = attemptAt(1L, "P1", AttemptResult.WRONG, 120, null, List.of(),
                Instant.parse("2026-01-02T00:00:00Z"));
        Attempt a3 = attemptAt(1L, "P1", AttemptResult.CORRECT, 90, null, List.of(),
                Instant.parse("2026-01-03T00:00:00Z"));
        given(attemptRepository.findAllByUserIdWithTags(1L)).willReturn(List.of(a1, a2, a3));

        AttemptHistorySummary summary = attemptService.getHistory(1L).get(0);

        assertThat(summary.attemptCount()).isEqualTo(3);
    }

    @Test
    void shouldUnionTagsAcrossAttemptsOfSameProblemWithoutDuplicates() {
        Tag dfs = tagWithId(6L, "DFS");
        Tag greedy = tagWithId(4L, "그리디");
        Attempt a1 = attemptAt(1L, "P1", AttemptResult.WRONG, 100, null, List.of(dfs),
                Instant.parse("2026-01-01T00:00:00Z"));
        Attempt a2 = attemptAt(1L, "P1", AttemptResult.CORRECT, 200, null, List.of(dfs, greedy),
                Instant.parse("2026-01-02T00:00:00Z"));
        given(attemptRepository.findAllByUserIdWithTags(1L)).willReturn(List.of(a1, a2));

        AttemptHistorySummary summary = attemptService.getHistory(1L).get(0);

        assertThat(summary.tags()).extracting(Tag::getId).containsExactlyInAnyOrder(6L, 4L);
    }

    @Test
    void shouldSortSummariesByLatestSolvedAtDescending() {
        Attempt p1 = attemptAt(1L, "P1", AttemptResult.WRONG, 100, null, List.of(),
                Instant.parse("2026-01-01T00:00:00Z"));
        Attempt p2 = attemptAt(1L, "P2", AttemptResult.CORRECT, 200, null, List.of(),
                Instant.parse("2026-01-03T00:00:00Z"));
        Attempt p3 = attemptAt(1L, "P3", AttemptResult.HOLD, 300, null, List.of(),
                Instant.parse("2026-01-02T00:00:00Z"));
        given(attemptRepository.findAllByUserIdWithTags(1L)).willReturn(List.of(p1, p2, p3));

        List<AttemptHistorySummary> result = attemptService.getHistory(1L);

        assertThat(result).extracting(AttemptHistorySummary::problemId)
                .containsExactly("P2", "P3", "P1");
    }

    @Test
    void shouldReturnEmptyListWhenUserHasNoAttempts() {
        given(attemptRepository.findAllByUserIdWithTags(1L)).willReturn(List.of());

        assertThat(attemptService.getHistory(1L)).isEmpty();
    }

    @Test
    void shouldReturnSingleSummaryWithAttemptCountOneForSingleAttemptProblem() {
        Attempt only = attemptAt(1L, "P1", AttemptResult.CORRECT, 100, null, List.of(),
                Instant.parse("2026-01-01T00:00:00Z"));
        given(attemptRepository.findAllByUserIdWithTags(1L)).willReturn(List.of(only));

        List<AttemptHistorySummary> result = attemptService.getHistory(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).attemptCount()).isEqualTo(1);
    }

    @Test
    void shouldQueryHistoryOnlyForGivenUserId() {
        Attempt mine = attemptAt(1L, "P1", AttemptResult.CORRECT, 100, null, List.of(),
                Instant.parse("2026-01-01T00:00:00Z"));
        given(attemptRepository.findAllByUserIdWithTags(1L)).willReturn(List.of(mine));

        attemptService.getHistory(1L);

        verify(attemptRepository).findAllByUserIdWithTags(1L);
    }

    // ── #88 getHistoryDetail — 정상/경계 ─────────────────────

    @Test
    void shouldAssignSeqStartingAt1InChronologicalOrder() {
        Attempt a1 = attemptAt(1L, "P1", AttemptResult.WRONG, 100, null, List.of(),
                Instant.parse("2026-01-01T00:00:00Z"));
        Attempt a2 = attemptAt(1L, "P1", AttemptResult.CORRECT, 200, null, List.of(),
                Instant.parse("2026-01-02T00:00:00Z"));
        given(attemptRepository.findAllByUserIdAndProblemIdWithTags(1L, "P1")).willReturn(List.of(a1, a2));

        AttemptHistoryDetail detail = attemptService.getHistoryDetail(1L, "P1");

        assertThat(detail.attempts())
                .filteredOn(e -> e.seq() == 1)
                .extracting(e -> e.attempt().getElapsedTime())
                .containsExactly(100);
        assertThat(detail.attempts())
                .filteredOn(e -> e.seq() == 2)
                .extracting(e -> e.attempt().getElapsedTime())
                .containsExactly(200);
    }

    @Test
    void shouldReturnAttemptsSortedBySeqDescending() {
        Attempt a1 = attemptAt(1L, "P1", AttemptResult.WRONG, 100, null, List.of(),
                Instant.parse("2026-01-01T00:00:00Z"));
        Attempt a2 = attemptAt(1L, "P1", AttemptResult.WRONG, 120, null, List.of(),
                Instant.parse("2026-01-02T00:00:00Z"));
        Attempt a3 = attemptAt(1L, "P1", AttemptResult.CORRECT, 90, null, List.of(),
                Instant.parse("2026-01-03T00:00:00Z"));
        given(attemptRepository.findAllByUserIdAndProblemIdWithTags(1L, "P1"))
                .willReturn(List.of(a1, a2, a3));

        AttemptHistoryDetail detail = attemptService.getHistoryDetail(1L, "P1");

        assertThat(detail.attempts()).extracting(AttemptHistoryEntry::seq).containsExactly(3, 2, 1);
    }

    @Test
    void shouldAggregateDetailFieldsTheSameWayAsGetHistory() {
        Tag dfs = tagWithId(6L, "DFS");
        Attempt a1 = attemptAt(1L, "P1", AttemptResult.WRONG, 100, null, List.of(),
                Instant.parse("2026-01-01T00:00:00Z"));
        Attempt a2 = attemptAt(1L, "P1", AttemptResult.CORRECT, 200, null, List.of(dfs),
                Instant.parse("2026-01-02T00:00:00Z"));
        given(attemptRepository.findAllByUserIdAndProblemIdWithTags(1L, "P1")).willReturn(List.of(a1, a2));

        AttemptHistoryDetail detail = attemptService.getHistoryDetail(1L, "P1");

        assertThat(detail.problemId()).isEqualTo("P1");
        assertThat(detail.latestResult()).isEqualTo(AttemptResult.CORRECT);
        assertThat(detail.attemptCount()).isEqualTo(2);
        assertThat(detail.tags()).extracting(Tag::getId).containsExactly(6L);
    }

    @Test
    void shouldIncludeMemoAndTagsPerIndividualAttemptEntry() {
        Tag dfs = tagWithId(6L, "DFS");
        Attempt a1 = attemptAt(1L, "P1", AttemptResult.WRONG, 100, "메모1", List.of(dfs),
                Instant.parse("2026-01-01T00:00:00Z"));
        given(attemptRepository.findAllByUserIdAndProblemIdWithTags(1L, "P1")).willReturn(List.of(a1));

        AttemptHistoryEntry entry = attemptService.getHistoryDetail(1L, "P1").attempts().get(0);

        assertThat(entry.attempt().getMemo()).isEqualTo("메모1");
        assertThat(entry.attempt().getTags()).extracting(Tag::getId).containsExactly(6L);
    }

    @Test
    void shouldReturnSeq1ForProblemWithExactlyOneAttempt() {
        Attempt only = attemptAt(1L, "P1", AttemptResult.CORRECT, 100, null, List.of(),
                Instant.parse("2026-01-01T00:00:00Z"));
        given(attemptRepository.findAllByUserIdAndProblemIdWithTags(1L, "P1")).willReturn(List.of(only));

        AttemptHistoryDetail detail = attemptService.getHistoryDetail(1L, "P1");

        assertThat(detail.attempts()).hasSize(1);
        assertThat(detail.attempts().get(0).seq()).isEqualTo(1);
    }

    // ── #88 getHistoryDetail — 예외 ──────────────────────────

    @Test
    void shouldThrowAttemptNotFoundWhenUserHasNoAttemptsForGivenProblemId() {
        given(attemptRepository.findAllByUserIdAndProblemIdWithTags(1L, "UNKNOWN")).willReturn(List.of());

        assertThatThrownBy(() -> attemptService.getHistoryDetail(1L, "UNKNOWN"))
                .isInstanceOf(AttemptException.class)
                .extracting(e -> ((AttemptException) e).getErrorCode())
                .isEqualTo(AttemptErrorCode.ATTEMPT_NOT_FOUND);
    }

    @Test
    void shouldThrowAttemptNotFoundWhenProblemIdBelongsOnlyToAnotherUser() {
        given(attemptRepository.findAllByUserIdAndProblemIdWithTags(2L, "P1")).willReturn(List.of());

        assertThatThrownBy(() -> attemptService.getHistoryDetail(2L, "P1"))
                .isInstanceOf(AttemptException.class)
                .extracting(e -> ((AttemptException) e).getErrorCode())
                .isEqualTo(AttemptErrorCode.ATTEMPT_NOT_FOUND);
    }
}
