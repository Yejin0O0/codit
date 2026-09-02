package com.codit.backend.service;

import org.springframework.stereotype.Service;

import com.codit.backend.repository.ProblemRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProblemService {

    private final ProblemRepository problemRepository;

    public ProblemUpsertResult upsertProblem(String problemId, String url) {
        return new ProblemUpsertResult(null, false);
    }
}
