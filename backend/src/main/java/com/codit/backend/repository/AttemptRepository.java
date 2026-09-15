package com.codit.backend.repository;

import com.codit.backend.domain.Attempt;
import com.codit.backend.domain.Tag;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AttemptRepository extends JpaRepository<Attempt, Long> {

    boolean existsByTagsContaining(Tag tag);

    @Query("SELECT DISTINCT a FROM Attempt a LEFT JOIN FETCH a.tags "
         + "WHERE a.userId = :userId ORDER BY a.createdAt ASC")
    List<Attempt> findAllByUserIdWithTags(@Param("userId") Long userId);

    @Query("SELECT DISTINCT a FROM Attempt a LEFT JOIN FETCH a.tags "
         + "WHERE a.userId = :userId AND a.problemId = :problemId ORDER BY a.createdAt ASC")
    List<Attempt> findAllByUserIdAndProblemIdWithTags(
            @Param("userId") Long userId, @Param("problemId") String problemId);
}
