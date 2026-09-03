package com.codit.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.codit.backend.domain.Problem;

public interface ProblemRepository extends JpaRepository<Problem, Long> {
    Optional<Problem> findByProblemId(String problemId);
}
