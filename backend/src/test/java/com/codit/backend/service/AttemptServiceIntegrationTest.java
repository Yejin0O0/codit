package com.codit.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.codit.backend.domain.Attempt;
import com.codit.backend.domain.AttemptResult;
import com.codit.backend.domain.Tag;
import com.codit.backend.repository.AttemptRepository;
import com.codit.backend.repository.TagRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.context.annotation.Import;

@DataJpaTest
@Import(AttemptService.class)
class AttemptServiceIntegrationTest {

    private static final String PROBLEM_ID = "AZ8R8haaeYnHBITH";

    @Autowired
    private AttemptRepository attemptRepository;

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private AttemptService attemptService;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void shouldPersistReplacedTagsToDatabaseWhenReplaceTagsCommits() {
        Tag tagA = tagRepository.save(new Tag("A", "a", "CUSTOM"));
        Tag tagB = tagRepository.save(new Tag("B", "b", "CUSTOM"));
        Attempt saved = attemptRepository.save(
                new Attempt(1L, PROBLEM_ID, 100, AttemptResult.CORRECT, null, List.of(tagA)));
        Long attemptId = saved.getId();

        attemptService.replaceTags(1L, attemptId, List.of(tagB.getId()));
        entityManager.flush();
        entityManager.clear();

        Attempt reloaded = attemptRepository.findById(attemptId).orElseThrow();
        assertThat(reloaded.getTags()).extracting(Tag::getId).containsExactly(tagB.getId());
    }
}
