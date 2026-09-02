package com.codit.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.codit.backend.controller.dto.IdentifyProblemRequest;
import com.codit.backend.controller.dto.ProblemResponse;
import com.codit.backend.service.ProblemService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
public class ProblemController {

    private final ProblemService problemService;

    @PostMapping
    public ResponseEntity<ProblemResponse> identifyProblem(@RequestBody IdentifyProblemRequest request) {
        return null;
    }
}
