package com.codit.backend.controller;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import com.codit.backend.controller.dto.IdentifyProblemRequest;
import com.codit.backend.domain.Problem;
import com.codit.backend.exception.InvalidRequestException;
import com.codit.backend.security.JwtTokenProvider;
import com.codit.backend.service.ProblemService;
import com.codit.backend.service.ProblemUpsertResult;

import tools.jackson.databind.ObjectMapper;

@WebMvcTest(ProblemController.class)
@AutoConfigureMockMvc(addFilters = false)
class ProblemControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProblemService problemService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldReturn201CreatedWithProblemBodyWhenNewProblemIsCreated() throws Exception {
        Problem created = new Problem("7965", "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=7965");
        ReflectionTestUtils.setField(created, "id", 13L);
        given(problemService.upsertProblem("7965", "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=7965"))
            .willReturn(new ProblemUpsertResult(created, true));

        mockMvc.perform(post("/api/problems")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new IdentifyProblemRequest("7965", "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=7965"))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(13))
            .andExpect(jsonPath("$.problemId").value("7965"))
            .andExpect(jsonPath("$.url").value("https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=7965"))
            .andExpect(jsonPath("$.createdAt").exists());
    }

    @Test
    void shouldReturn200OkWithExistingProblemBodyWhenProblemAlreadyExists() throws Exception {
        Problem existing = new Problem("7965", "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=7965");
        ReflectionTestUtils.setField(existing, "id", 12L);
        given(problemService.upsertProblem("7965", "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=7965"))
            .willReturn(new ProblemUpsertResult(existing, false));

        mockMvc.perform(post("/api/problems")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new IdentifyProblemRequest("7965", "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=7965"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(12))
            .andExpect(jsonPath("$.problemId").value("7965"))
            .andExpect(jsonPath("$.url").value("https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=7965"));
    }

    @Test
    void shouldSucceedWithoutAuthorizationHeader() throws Exception {
        Problem created = new Problem("7965", "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=7965");
        given(problemService.upsertProblem("7965", "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=7965"))
            .willReturn(new ProblemUpsertResult(created, true));

        mockMvc.perform(post("/api/problems")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new IdentifyProblemRequest("7965", "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=7965"))))
            .andExpect(status().isCreated());
    }

    @Test
    void shouldReturn400WithInvalidRequestCodeWhenProblemIdIsMissing() throws Exception {
        given(problemService.upsertProblem(null, "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=7965"))
            .willThrow(new InvalidRequestException("problemId와 url은 필수입니다."));

        mockMvc.perform(post("/api/problems")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new IdentifyProblemRequest(null, "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=7965"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
            .andExpect(jsonPath("$.message").value("problemId와 url은 필수입니다."));
    }

    @Test
    void shouldReturn400WithInvalidRequestCodeWhenUrlIsMissing() throws Exception {
        given(problemService.upsertProblem("7965", null))
            .willThrow(new InvalidRequestException("problemId와 url은 필수입니다."));

        mockMvc.perform(post("/api/problems")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new IdentifyProblemRequest("7965", null))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
            .andExpect(jsonPath("$.message").value("problemId와 url은 필수입니다."));
    }

    @Test
    void shouldReturn400WithInvalidRequestCodeWhenProblemIdIsBlank() throws Exception {
        given(problemService.upsertProblem("   ", "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=7965"))
            .willThrow(new InvalidRequestException("problemId와 url은 필수입니다."));

        mockMvc.perform(post("/api/problems")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new IdentifyProblemRequest("   ", "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=7965"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
    }
}
