package com.codit.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import com.codit.backend.domain.Tag;
import com.codit.backend.exception.InvalidRequestException;
import com.codit.backend.repository.TagRepository;

@ExtendWith(MockitoExtension.class)
class TagServiceTest {

    @Mock
    private TagRepository tagRepository;

    @InjectMocks
    private TagService tagService;

    @Test
    void shouldReturnAllTagsFromRepository() {
        Tag dfs = new Tag("DFS", "dfs", "CORE");
        given(tagRepository.findAll()).willReturn(List.of(dfs));

        List<Tag> result = tagService.getAllTags();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("DFS");
    }

    @Test
    void shouldCreateNewCustomTagWhenNameDoesNotExist() {
        given(tagRepository.findByNormalizedName("이분 그래프")).willReturn(Optional.empty());
        Tag saved = new Tag("이분 그래프", "이분 그래프", "CUSTOM");
        given(tagRepository.save(any(Tag.class))).willReturn(saved);

        TagUpsertResult result = tagService.upsertTag("이분 그래프");

        assertThat(result.created()).isTrue();
        assertThat(result.tag().getName()).isEqualTo("이분 그래프");
        assertThat(result.tag().getCategory()).isEqualTo("CUSTOM");
    }

    @Test
    void shouldReturnExistingTagWithoutCreatingWhenExactNameAlreadyExists() {
        Tag existing = new Tag("DFS", "dfs", "CORE");
        given(tagRepository.findByNormalizedName("dfs")).willReturn(Optional.of(existing));

        TagUpsertResult result = tagService.upsertTag("DFS");

        assertThat(result.created()).isFalse();
        assertThat(result.tag()).isEqualTo(existing);
        verify(tagRepository, never()).save(any());
    }

    @Test
    void shouldReturnExistingCoreTagWhenInputDiffersOnlyByCase() {
        Tag existing = new Tag("DFS", "dfs", "CORE");
        given(tagRepository.findByNormalizedName("dfs")).willReturn(Optional.of(existing));

        TagUpsertResult result = tagService.upsertTag("dfs");

        assertThat(result.created()).isFalse();
        assertThat(result.tag().getName()).isEqualTo("DFS");
    }

    @Test
    void shouldReturnExistingTagWhenInputHasLeadingTrailingWhitespace() {
        Tag existing = new Tag("DFS", "dfs", "CORE");
        given(tagRepository.findByNormalizedName("dfs")).willReturn(Optional.of(existing));

        TagUpsertResult result = tagService.upsertTag(" DFS ");

        assertThat(result.created()).isFalse();
        assertThat(result.tag().getName()).isEqualTo("DFS");
    }

    @Test
    void shouldReturnExistingCategoryTagWhenInputHasLeadingTrailingWhitespace() {
        Tag existing = new Tag("연결 리스트", "연결 리스트", "자료구조");
        given(tagRepository.findByNormalizedName("연결 리스트")).willReturn(Optional.of(existing));

        TagUpsertResult result = tagService.upsertTag(" 연결 리스트 ");

        assertThat(result.created()).isFalse();
        assertThat(result.tag().getName()).isEqualTo("연결 리스트");
        assertThat(result.tag().getCategory()).isEqualTo("자료구조");
    }

    @Test
    void shouldThrowInvalidRequestExceptionWhenNameIsNull() {
        assertThatThrownBy(() -> tagService.upsertTag(null))
            .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void shouldThrowInvalidRequestExceptionWhenNameIsEmpty() {
        assertThatThrownBy(() -> tagService.upsertTag(""))
            .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void shouldThrowInvalidRequestExceptionWhenNameIsBlank() {
        assertThatThrownBy(() -> tagService.upsertTag("   "))
            .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void shouldReturnExistingTagWithoutThrowingWhenConcurrentInsertViolatesUniqueConstraint() {
        Tag existing = new Tag("DFS", "dfs", "CORE");
        given(tagRepository.findByNormalizedName("dfs"))
            .willReturn(Optional.empty())
            .willReturn(Optional.of(existing));
        given(tagRepository.save(any(Tag.class))).willThrow(new DataIntegrityViolationException("duplicate"));

        TagUpsertResult result = tagService.upsertTag("DFS");

        assertThat(result.created()).isFalse();
        assertThat(result.tag()).isEqualTo(existing);
    }
}
