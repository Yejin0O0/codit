package com.codit.backend.repository;

import com.codit.backend.domain.Attempt;
import com.codit.backend.domain.Tag;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AttemptRepository extends JpaRepository<Attempt, Long> {

    boolean existsByTagsContaining(Tag tag);

    // createdAt만으로는 동시 저장 시 동률이 나올 수 있어 id를 2차 정렬 기준으로 둔다
    // (id는 IDENTITY 자동증가라 항상 삽입 순서를 안정적으로 보존한다).
    @Query("SELECT DISTINCT a FROM Attempt a LEFT JOIN FETCH a.tags "
         + "WHERE a.userId = :userId ORDER BY a.createdAt ASC, a.id ASC")
    List<Attempt> findAllByUserIdWithTags(@Param("userId") Long userId);

    @Query("SELECT DISTINCT a FROM Attempt a LEFT JOIN FETCH a.tags "
         + "WHERE a.userId = :userId AND a.problemId = :problemId ORDER BY a.createdAt ASC, a.id ASC")
    List<Attempt> findAllByUserIdAndProblemIdWithTags(
            @Param("userId") Long userId, @Param("problemId") String problemId);
}
