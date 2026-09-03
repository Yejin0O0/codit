package com.codit.backend.service;

import org.springframework.stereotype.Service;

import com.codit.backend.domain.Problem;
import com.codit.backend.exception.InvalidRequestException;
import com.codit.backend.repository.ProblemRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProblemService {

    private final ProblemRepository problemRepository;

    public ProblemUpsertResult upsertProblem(String problemId, String url) {
        if (problemId == null || problemId.isBlank() || url == null || url.isBlank()) {
            throw new InvalidRequestException("problemId와 url은 필수입니다.");
        }
        return problemRepository.findByProblemId(problemId)
            .map(existing -> new ProblemUpsertResult(existing, false))
            .orElseGet(() -> new ProblemUpsertResult(
                problemRepository.save(new Problem(problemId, url)), true));
    }
}
