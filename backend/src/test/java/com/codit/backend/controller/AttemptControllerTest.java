package com.codit.backend.controller;

import static org.hamcrest.Matchers.endsWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.codit.backend.controller.dto.CreateAttemptRequest;
import com.codit.backend.domain.Attempt;
import com.codit.backend.domain.AttemptResult;
import com.codit.backend.domain.Tag;
import com.codit.backend.exception.GlobalExceptionHandler;
import com.codit.backend.exception.InvalidRequestException;
import com.codit.backend.security.JwtAuthenticationEntryPoint;
import com.codit.backend.security.JwtTokenProvider;
import com.codit.backend.security.SecurityConfig;
import com.codit.backend.service.AttemptService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

@WebMvcTest(AttemptController.class)
@Import({SecurityConfig.class, JwtAuthenticationEntryPoint.class, GlobalExceptionHandler.class})
class AttemptControllerTest {

    private static final String PROBLEM_ID = "AZ8R8haaeYnHBITH";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AttemptService attemptService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    private Attempt sampleAttempt() {
        Tag tag = new Tag("DFS", "dfs", "CORE");
        ReflectionTestUtils.setField(tag, "id", 6L);
        Attempt attempt = new Attempt(1L, PROBLEM_ID, 342, AttemptResult.CORRECT, null, List.of(tag));
        ReflectionTestUtils.setField(attempt, "id", 101L);
        return attempt;
    }

    private String body(String result, List<Long> tagIds, String memo) {
        return objectMapper.writeValueAsString(
                new CreateAttemptRequest(PROBLEM_ID, 342, result, tagIds, memo));
    }

    @Test
    void shouldReturn201WithSavedAttemptBodyWhenAuthenticatedAndRequestIsValid() throws Exception {
        given(jwtTokenProvider.getUserId("valid-token")).willReturn(1L);
        given(attemptService.createAttempt(eq(1L), any())).willReturn(sampleAttempt());

        mockMvc.perform(post("/api/attempts")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("CORRECT", List.of(6L), null)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(101))
                .andExpect(jsonPath("$.problemId").value(PROBLEM_ID))
                .andExpect(jsonPath("$.result").value("CORRECT"))
                .andExpect(jsonPath("$.createdAt").exists());
    }

    @Test
    void shouldPassAuthenticationPrincipalUserIdToService() throws Exception {
        given(jwtTokenProvider.getUserId("valid-token")).willReturn(42L);
        given(attemptService.createAttempt(eq(42L), any())).willReturn(sampleAttempt());

        mockMvc.perform(post("/api/attempts")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("CORRECT", List.of(6L), null)))
                .andExpect(status().isCreated());

        verify(attemptService).createAttempt(eq(42L), any());
    }

    @Test
    void shouldSerializeElapsedTimeAndMemoIntoResponseBody() throws Exception {
        given(jwtTokenProvider.getUserId("valid-token")).willReturn(1L);
        Tag tag = new Tag("DFS", "dfs", "CORE");
        ReflectionTestUtils.setField(tag, "id", 6L);
        Attempt attempt = new Attempt(1L, PROBLEM_ID, 500, AttemptResult.WRONG, "메모 내용", List.of(tag));
        ReflectionTestUtils.setField(attempt, "id", 7L);
        given(attemptService.createAttempt(any(), any())).willReturn(attempt);

        mockMvc.perform(post("/api/attempts")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("WRONG", List.of(6L), "메모 내용")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.elapsedTime").value(500))
                .andExpect(jsonPath("$.memo").value("메모 내용"));
    }

    @Test
    void shouldSerializeCreatedAtAsUtcInstant() throws Exception {
        given(jwtTokenProvider.getUserId("valid-token")).willReturn(1L);
        given(attemptService.createAttempt(any(), any())).willReturn(sampleAttempt());

        mockMvc.perform(post("/api/attempts")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("CORRECT", List.of(6L), null)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.createdAt").value(endsWith("Z")));
    }

    @Test
    void shouldIgnoreUserIdInRequestBodyAndUseJwtUserId() throws Exception {
        given(jwtTokenProvider.getUserId("valid-token")).willReturn(1L);
        given(attemptService.createAttempt(eq(1L), any())).willReturn(sampleAttempt());

        String rawJson = "{\"userId\":999,\"problemId\":\"" + PROBLEM_ID
                + "\",\"elapsedTime\":342,\"result\":\"CORRECT\",\"tagIds\":[6],\"memo\":null}";

        mockMvc.perform(post("/api/attempts")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(rawJson))
                .andExpect(status().isCreated());

        verify(attemptService).createAttempt(eq(1L), any());
    }

    @Test
    void shouldReturnTagsWithIdNameCategoryInResponseBody() throws Exception {
        given(jwtTokenProvider.getUserId("valid-token")).willReturn(1L);
        given(attemptService.createAttempt(any(), any())).willReturn(sampleAttempt());

        mockMvc.perform(post("/api/attempts")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("CORRECT", List.of(6L), null)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tags[0].id").value(6))
                .andExpect(jsonPath("$.tags[0].name").value("DFS"))
                .andExpect(jsonPath("$.tags[0].category").value("CORE"));
    }

    @Test
    void shouldReturn401WhenRequestHasNoAuthentication() throws Exception {
        mockMvc.perform(post("/api/attempts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("CORRECT", List.of(6L), null)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturn400WithNonEmptyCodeAndMessageWhenServiceThrowsInvalidRequestException() throws Exception {
        given(jwtTokenProvider.getUserId("valid-token")).willReturn(1L);
        given(attemptService.createAttempt(any(), any()))
                .willThrow(new InvalidRequestException("result는 CORRECT, WRONG, HOLD 중 하나여야 합니다."));

        mockMvc.perform(post("/api/attempts")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("BANANA", List.of(6L), null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void shouldReturn400WithContractErrorWhenElapsedTimeIsNotANumber() throws Exception {
        given(jwtTokenProvider.getUserId("valid-token")).willReturn(1L);

        String rawJson = "{\"problemId\":\"" + PROBLEM_ID
                + "\",\"elapsedTime\":\"abc\",\"result\":\"CORRECT\",\"tagIds\":[6],\"memo\":null}";

        mockMvc.perform(post("/api/attempts")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(rawJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void shouldReturn400WithContractErrorWhenTagIdsContainsNonNumericValue() throws Exception {
        given(jwtTokenProvider.getUserId("valid-token")).willReturn(1L);

        String rawJson = "{\"problemId\":\"" + PROBLEM_ID
                + "\",\"elapsedTime\":342,\"result\":\"CORRECT\",\"tagIds\":[true],\"memo\":null}";

        mockMvc.perform(post("/api/attempts")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(rawJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }
}
