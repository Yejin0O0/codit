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
import com.codit.backend.exception.InvalidRequestException;
import com.codit.backend.repository.AttemptRepository;
import com.codit.backend.repository.TagRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
        given(tagRepository.findAllById(List.of(1L, 2L))).willReturn(List.of(tag("DFS"), tag("그리디")));
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
}
