package com.codit.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
import org.springframework.test.util.ReflectionTestUtils;

import com.codit.backend.domain.Tag;
import com.codit.backend.exception.InvalidRequestException;
import com.codit.backend.exception.TagErrorCode;
import com.codit.backend.exception.TagException;
import com.codit.backend.repository.AttemptRepository;
import com.codit.backend.repository.TagRepository;

@ExtendWith(MockitoExtension.class)
class TagServiceTest {

    @Mock
    private TagRepository tagRepository;

    @Mock
    private AttemptRepository attemptRepository;

    @InjectMocks
    private TagService tagService;

    private Tag customTag(Long id, String name, String normalizedName) {
        Tag tag = new Tag(name, normalizedName, "CUSTOM");
        ReflectionTestUtils.setField(tag, "id", id);
        return tag;
    }

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

    @Test
    void shouldRenameTagAndReturnUpdatedTagWhenValidNewNameGivenForCustomTag() {
        Tag existing = customTag(26L, "이분그래프", "이분그래프");
        given(tagRepository.findById(26L)).willReturn(Optional.of(existing));
        given(tagRepository.findByNormalizedName("이분 그래프")).willReturn(Optional.empty());

        Tag result = tagService.renameTag(26L, "이분 그래프");

        assertThat(result.getName()).isEqualTo("이분 그래프");
        assertThat(result.getCategory()).isEqualTo("CUSTOM");
    }

    @Test
    void shouldSucceedWithoutConflictWhenRenamingToItsOwnCurrentName() {
        Tag existing = customTag(26L, "이분그래프", "이분그래프");
        given(tagRepository.findById(26L)).willReturn(Optional.of(existing));
        given(tagRepository.findByNormalizedName("이분그래프")).willReturn(Optional.of(existing));

        Tag result = tagService.renameTag(26L, "이분그래프");

        assertThat(result.getName()).isEqualTo("이분그래프");
    }

    @Test
    void shouldNormalizeNameWithTrimAndLowercaseBeforeConflictCheck() {
        Tag existing = customTag(26L, "이분그래프", "이분그래프");
        given(tagRepository.findById(26L)).willReturn(Optional.of(existing));
        given(tagRepository.findByNormalizedName("dfs")).willReturn(Optional.empty());

        tagService.renameTag(26L, " DFS ");

        verify(tagRepository).findByNormalizedName(eq("dfs"));
    }

    @Test
    void shouldThrowTagNotFoundWhenRenamingNonExistentTagId() {
        given(tagRepository.findById(999L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> tagService.renameTag(999L, "이분 그래프"))
            .isInstanceOf(TagException.class)
            .extracting(e -> ((TagException) e).getErrorCode())
            .isEqualTo(TagErrorCode.TAG_NOT_FOUND);
    }

    @Test
    void shouldThrowTagNotFoundWhenDeletingNonExistentTagId() {
        given(tagRepository.findById(999L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> tagService.deleteTag(999L))
            .isInstanceOf(TagException.class)
            .extracting(e -> ((TagException) e).getErrorCode())
            .isEqualTo(TagErrorCode.TAG_NOT_FOUND);
    }

    @Test
    void shouldThrowTagNotEditableWhenRenamingCoreTag() {
        Tag core = new Tag("DFS", "dfs", "CORE");
        ReflectionTestUtils.setField(core, "id", 6L);
        given(tagRepository.findById(6L)).willReturn(Optional.of(core));

        assertThatThrownBy(() -> tagService.renameTag(6L, "새이름"))
            .isInstanceOf(TagException.class)
            .extracting(e -> ((TagException) e).getErrorCode())
            .isEqualTo(TagErrorCode.TAG_NOT_EDITABLE);
    }

    @Test
    void shouldThrowTagNotEditableWhenDeletingCoreTag() {
        Tag core = new Tag("DFS", "dfs", "CORE");
        ReflectionTestUtils.setField(core, "id", 6L);
        given(tagRepository.findById(6L)).willReturn(Optional.of(core));

        assertThatThrownBy(() -> tagService.deleteTag(6L))
            .isInstanceOf(TagException.class)
            .extracting(e -> ((TagException) e).getErrorCode())
            .isEqualTo(TagErrorCode.TAG_NOT_EDITABLE);
    }

    @Test
    void shouldThrowTagNotEditableWhenRenamingCategoryTag() {
        Tag category = new Tag("연결 리스트", "연결 리스트", "자료구조");
        ReflectionTestUtils.setField(category, "id", 12L);
        given(tagRepository.findById(12L)).willReturn(Optional.of(category));

        assertThatThrownBy(() -> tagService.renameTag(12L, "새이름"))
            .isInstanceOf(TagException.class)
            .extracting(e -> ((TagException) e).getErrorCode())
            .isEqualTo(TagErrorCode.TAG_NOT_EDITABLE);
    }

    @Test
    void shouldThrowTagNotEditableWhenDeletingCategoryTag() {
        Tag category = new Tag("연결 리스트", "연결 리스트", "자료구조");
        ReflectionTestUtils.setField(category, "id", 12L);
        given(tagRepository.findById(12L)).willReturn(Optional.of(category));

        assertThatThrownBy(() -> tagService.deleteTag(12L))
            .isInstanceOf(TagException.class)
            .extracting(e -> ((TagException) e).getErrorCode())
            .isEqualTo(TagErrorCode.TAG_NOT_EDITABLE);
    }

    @Test
    void shouldThrowInvalidRequestExceptionWhenRenamingWithBlankName() {
        Tag existing = customTag(26L, "이분그래프", "이분그래프");
        given(tagRepository.findById(26L)).willReturn(Optional.of(existing));

        assertThatThrownBy(() -> tagService.renameTag(26L, "   "))
            .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void shouldThrowInvalidRequestExceptionWhenRenamingWithNullName() {
        Tag existing = customTag(26L, "이분그래프", "이분그래프");
        given(tagRepository.findById(26L)).willReturn(Optional.of(existing));

        assertThatThrownBy(() -> tagService.renameTag(26L, null))
            .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void shouldThrowTagNameConflictWhenNormalizedNewNameMatchesDifferentExistingTag() {
        Tag existing = customTag(26L, "이분그래프", "이분그래프");
        Tag other = new Tag("DFS", "dfs", "CORE");
        ReflectionTestUtils.setField(other, "id", 6L);
        given(tagRepository.findById(26L)).willReturn(Optional.of(existing));
        given(tagRepository.findByNormalizedName("dfs")).willReturn(Optional.of(other));

        assertThatThrownBy(() -> tagService.renameTag(26L, "dfs"))
            .isInstanceOf(TagException.class)
            .extracting(e -> ((TagException) e).getErrorCode())
            .isEqualTo(TagErrorCode.TAG_NAME_CONFLICT);
    }

    @Test
    void shouldDeleteTagWhenCustomTagIsNotReferencedByAnyAttempt() {
        Tag existing = customTag(26L, "이분그래프", "이분그래프");
        given(tagRepository.findById(26L)).willReturn(Optional.of(existing));
        given(attemptRepository.existsByTagsContaining(existing)).willReturn(false);

        tagService.deleteTag(26L);

        verify(tagRepository).delete(existing);
    }

    @Test
    void shouldThrowTagInUseWhenDeletingTagReferencedByAtLeastOneAttempt() {
        Tag existing = customTag(26L, "이분그래프", "이분그래프");
        given(tagRepository.findById(26L)).willReturn(Optional.of(existing));
        given(attemptRepository.existsByTagsContaining(existing)).willReturn(true);

        assertThatThrownBy(() -> tagService.deleteTag(26L))
            .isInstanceOf(TagException.class)
            .extracting(e -> ((TagException) e).getErrorCode())
            .isEqualTo(TagErrorCode.TAG_IN_USE);

        verify(tagRepository, never()).delete(any());
    }
}
