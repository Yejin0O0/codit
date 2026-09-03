package com.codit.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.codit.backend.controller.dto.IdentifyProblemRequest;
import com.codit.backend.controller.dto.ProblemResponse;
import com.codit.backend.domain.Problem;
import com.codit.backend.service.ProblemService;
import com.codit.backend.service.ProblemUpsertResult;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
public class ProblemController {

    private final ProblemService problemService;

    @PostMapping
    public ResponseEntity<ProblemResponse> identifyProblem(@RequestBody IdentifyProblemRequest request) {
        ProblemUpsertResult result = problemService.upsertProblem(request.problemId(), request.url());
        HttpStatus status = result.created() ? HttpStatus.CREATED : HttpStatus.OK;
        return ResponseEntity.status(status).body(toResponse(result.problem()));
    }

    private ProblemResponse toResponse(Problem problem) {
        return new ProblemResponse(problem.getId(), problem.getProblemId(), problem.getUrl(), problem.getCreatedAt());
    }
}
