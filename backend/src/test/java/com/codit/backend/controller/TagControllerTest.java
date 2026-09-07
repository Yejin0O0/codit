package com.codit.backend.controller;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import com.codit.backend.domain.Tag;
import com.codit.backend.exception.GlobalExceptionHandler;
import com.codit.backend.exception.InvalidRequestException;
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
}
