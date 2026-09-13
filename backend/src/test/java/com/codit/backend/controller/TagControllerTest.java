package com.codit.backend.controller;

import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import com.codit.backend.controller.dto.CreateTagRequest;
import com.codit.backend.controller.dto.UpdateTagRequest;
import com.codit.backend.domain.Tag;
import com.codit.backend.exception.GlobalExceptionHandler;
import com.codit.backend.exception.InvalidRequestException;
import com.codit.backend.exception.TagErrorCode;
import com.codit.backend.exception.TagException;
import com.codit.backend.security.JwtAuthenticationEntryPoint;
import com.codit.backend.security.JwtTokenProvider;
import com.codit.backend.security.SecurityConfig;
import com.codit.backend.service.TagService;
import com.codit.backend.service.TagUpsertResult;

import tools.jackson.databind.ObjectMapper;

@WebMvcTest(TagController.class)
@Import({SecurityConfig.class, JwtAuthenticationEntryPoint.class, GlobalExceptionHandler.class})
class TagControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TagService tagService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldReturn200WithTagListWhenGetTags() throws Exception {
        Tag dfs = new Tag("DFS", "dfs", "CORE");
        ReflectionTestUtils.setField(dfs, "id", 6L);
        given(tagService.getAllTags()).willReturn(List.of(dfs));

        mockMvc.perform(get("/api/tags"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(6))
            .andExpect(jsonPath("$[0].name").value("DFS"))
            .andExpect(jsonPath("$[0].category").value("CORE"));
    }

    @Test
    void shouldReturn201WithCreatedTagWhenNewTagIsCreated() throws Exception {
        Tag created = new Tag("이분 그래프", "이분 그래프", "CUSTOM");
        ReflectionTestUtils.setField(created, "id", 26L);
        given(tagService.upsertTag("이분 그래프")).willReturn(new TagUpsertResult(created, true));

        mockMvc.perform(post("/api/tags")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateTagRequest("이분 그래프"))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(26))
            .andExpect(jsonPath("$.name").value("이분 그래프"))
            .andExpect(jsonPath("$.category").value("CUSTOM"));
    }

    @Test
    void shouldReturn200WithExistingTagWhenTagAlreadyExists() throws Exception {
        Tag existing = new Tag("DFS", "dfs", "CORE");
        ReflectionTestUtils.setField(existing, "id", 6L);
        given(tagService.upsertTag("dfs")).willReturn(new TagUpsertResult(existing, false));

        mockMvc.perform(post("/api/tags")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateTagRequest("dfs"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(6))
            .andExpect(jsonPath("$.name").value("DFS"));
    }

    @Test
    void shouldReturn400WithInvalidRequestCodeWhenNameIsBlank() throws Exception {
        given(tagService.upsertTag("   ")).willThrow(new InvalidRequestException("name은 필수입니다."));

        mockMvc.perform(post("/api/tags")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateTagRequest("   "))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
            .andExpect(jsonPath("$.message").value("name은 필수입니다."));
    }

    @Test
    void shouldSucceedWithoutAuthorizationHeader() throws Exception {
        given(tagService.getAllTags()).willReturn(List.of());

        mockMvc.perform(get("/api/tags"))
            .andExpect(status().isOk());
    }

    @Test
    void shouldSucceedWithoutAuthorizationHeaderForPost() throws Exception {
        Tag created = new Tag("이분 그래프", "이분 그래프", "CUSTOM");
        given(tagService.upsertTag("이분 그래프")).willReturn(new TagUpsertResult(created, true));

        mockMvc.perform(post("/api/tags")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateTagRequest("이분 그래프"))))
            .andExpect(status().isCreated());
    }

    @Test
    void shouldIncludeAccessControlAllowOriginHeaderWhenOriginHeaderIsPresent() throws Exception {
        given(tagService.getAllTags()).willReturn(List.of());

        mockMvc.perform(get("/api/tags").header("Origin", "chrome-extension://dcocnpglepbapllbgakbknajbcjpelkp"))
            .andExpect(status().isOk())
            .andExpect(header().exists("Access-Control-Allow-Origin"));
    }

    @Test
    void shouldRespondToPreflightOptionsRequestWithCorsHeaders() throws Exception {
        mockMvc.perform(options("/api/tags")
                .header("Origin", "chrome-extension://dcocnpglepbapllbgakbknajbcjpelkp")
                .header("Access-Control-Request-Method", "POST"))
            .andExpect(status().isOk())
            .andExpect(header().exists("Access-Control-Allow-Origin"));
    }

    @Test
    void shouldReturn200WithUpdatedTagBodyWhenRenameSucceeds() throws Exception {
        Tag updated = new Tag("이분 그래프", "이분 그래프", "CUSTOM");
        ReflectionTestUtils.setField(updated, "id", 26L);
        given(tagService.renameTag(26L, "이분 그래프")).willReturn(updated);

        mockMvc.perform(put("/api/tags/26")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpdateTagRequest("이분 그래프"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(26))
            .andExpect(jsonPath("$.name").value("이분 그래프"))
            .andExpect(jsonPath("$.category").value("CUSTOM"));
    }

    @Test
    void shouldReturn204WhenDeleteSucceeds() throws Exception {
        mockMvc.perform(delete("/api/tags/26"))
            .andExpect(status().isNoContent());
    }

    @Test
    void shouldReturn404WithTagNotFoundCodeWhenUpdatingNonExistentTag() throws Exception {
        given(tagService.renameTag(999L, "이분 그래프")).willThrow(new TagException(TagErrorCode.TAG_NOT_FOUND));

        mockMvc.perform(put("/api/tags/999")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpdateTagRequest("이분 그래프"))))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("TAG_NOT_FOUND"));
    }

    @Test
    void shouldReturn404WithTagNotFoundCodeWhenDeletingNonExistentTag() throws Exception {
        willThrow(new TagException(TagErrorCode.TAG_NOT_FOUND)).given(tagService).deleteTag(999L);

        mockMvc.perform(delete("/api/tags/999"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("TAG_NOT_FOUND"));
    }

    @Test
    void shouldReturn403WithTagNotEditableCodeWhenUpdatingCoreTag() throws Exception {
        given(tagService.renameTag(6L, "새이름")).willThrow(new TagException(TagErrorCode.TAG_NOT_EDITABLE));

        mockMvc.perform(put("/api/tags/6")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpdateTagRequest("새이름"))))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.code").value("TAG_NOT_EDITABLE"));
    }

    @Test
    void shouldReturn403WithTagNotEditableCodeWhenDeletingCoreTag() throws Exception {
        willThrow(new TagException(TagErrorCode.TAG_NOT_EDITABLE)).given(tagService).deleteTag(6L);

        mockMvc.perform(delete("/api/tags/6"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.code").value("TAG_NOT_EDITABLE"));
    }

    @Test
    void shouldReturn409WithTagNameConflictCodeWhenNewNameConflictsWithAnotherTag() throws Exception {
        given(tagService.renameTag(26L, "dfs")).willThrow(new TagException(TagErrorCode.TAG_NAME_CONFLICT));

        mockMvc.perform(put("/api/tags/26")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpdateTagRequest("dfs"))))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("TAG_NAME_CONFLICT"));
    }

    @Test
    void shouldReturn400WithInvalidRequestCodeWhenUpdateNameIsBlank() throws Exception {
        given(tagService.renameTag(26L, "   ")).willThrow(new InvalidRequestException("name은 필수입니다."));

        mockMvc.perform(put("/api/tags/26")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpdateTagRequest("   "))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
    }

    @Test
    void shouldReturn409WithTagInUseCodeWhenDeletingTagReferencedByAttempt() throws Exception {
        willThrow(new TagException(TagErrorCode.TAG_IN_USE)).given(tagService).deleteTag(26L);

        mockMvc.perform(delete("/api/tags/26"))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("TAG_IN_USE"));
    }
}
