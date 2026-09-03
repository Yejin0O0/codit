package com.codit.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.codit.backend.domain.Problem;
import com.codit.backend.exception.InvalidRequestException;
import com.codit.backend.repository.ProblemRepository;

@ExtendWith(MockitoExtension.class)
class ProblemServiceTest {

    @Mock
    private ProblemRepository problemRepository;

    private ProblemService problemService;

    @Test
    void shouldCreateNewProblemAndReturnCreatedTrueWhenProblemIdDoesNotExist() {
        problemService = new ProblemService(problemRepository);
        given(problemRepository.findByProblemId("7965")).willReturn(Optional.empty());
        given(problemRepository.save(any())).willReturn(new Problem("7965", "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=7965"));

        ProblemUpsertResult result = problemService.upsertProblem("7965", "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=7965");

        assertThat(result.created()).isTrue();
        assertThat(result.problem().getProblemId()).isEqualTo("7965");
    }

    @Test
    void shouldReturnExistingProblemAndCreatedFalseWhenProblemIdAlreadyExists() {
        problemService = new ProblemService(problemRepository);
        Problem existing = new Problem("7965", "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=7965");
        given(problemRepository.findByProblemId("7965")).willReturn(Optional.of(existing));

        ProblemUpsertResult result = problemService.upsertProblem("7965", "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=7965");

        assertThat(result.created()).isFalse();
        assertThat(result.problem()).isSameAs(existing);
        verify(problemRepository, never()).save(any());
    }

    @Test
    void shouldRejectWhenProblemIdIsWhitespaceOnlyString() {
        problemService = new ProblemService(problemRepository);

        assertThatThrownBy(() -> problemService.upsertProblem("   ", "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=7965"))
            .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void shouldRejectWhenUrlIsWhitespaceOnlyString() {
        problemService = new ProblemService(problemRepository);

        assertThatThrownBy(() -> problemService.upsertProblem("7965", "   "))
            .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void shouldThrowInvalidRequestExceptionWhenProblemIdIsNull() {
        problemService = new ProblemService(problemRepository);

        assertThatThrownBy(() -> problemService.upsertProblem(null, "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=7965"))
            .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void shouldThrowInvalidRequestExceptionWhenUrlIsNull() {
        problemService = new ProblemService(problemRepository);

        assertThatThrownBy(() -> problemService.upsertProblem("7965", null))
            .isInstanceOf(InvalidRequestException.class);
    }
}
