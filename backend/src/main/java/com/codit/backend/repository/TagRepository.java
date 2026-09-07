package com.codit.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.codit.backend.domain.Tag;

public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findByNormalizedName(String normalizedName);
}
