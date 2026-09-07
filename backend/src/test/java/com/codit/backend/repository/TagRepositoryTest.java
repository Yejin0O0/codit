package com.codit.backend.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.jdbc.Sql;

import com.codit.backend.domain.Tag;

@DataJpaTest
class TagRepositoryTest {

    @Autowired
    private TagRepository tagRepository;

    @Test
    void shouldFindTagByNormalizedNameWhenSaved() {
        tagRepository.save(new Tag("테스트전용태그", "테스트전용태그", "CUSTOM"));

        Tag found = tagRepository.findByNormalizedName("테스트전용태그").orElseThrow();

        assertThat(found.getName()).isEqualTo("테스트전용태그");
        assertThat(found.getCategory()).isEqualTo("CUSTOM");
    }

    @Test
    void shouldThrowDataIntegrityViolationExceptionWhenNormalizedNameDuplicated() {
        tagRepository.saveAndFlush(new Tag("테스트전용태그", "테스트전용태그", "CUSTOM"));

        assertThatThrownBy(() -> tagRepository.saveAndFlush(new Tag("테스트전용태그", "테스트전용태그", "CUSTOM")))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @Sql("/data.sql")
    void shouldSeedExactly25TagsWithElevenCoreAndFourteenCategoryTags() {
        List<Tag> all = tagRepository.findAll();

        assertThat(all).hasSize(25);
        assertThat(all.stream().filter(tag -> tag.getCategory().equals("CORE")).count()).isEqualTo(11);
        assertThat(all.stream().filter(tag -> !tag.getCategory().equals("CORE")).count()).isEqualTo(14);
    }
}
