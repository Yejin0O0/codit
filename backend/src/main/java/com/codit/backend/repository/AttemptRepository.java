package com.codit.backend.repository;

import com.codit.backend.domain.Attempt;
import com.codit.backend.domain.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttemptRepository extends JpaRepository<Attempt, Long> {
    boolean existsByTagsContaining(Tag tag);
}
