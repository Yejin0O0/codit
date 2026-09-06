# Issue 42: [결과 기록] 풀이 결과 저장 API

> 참조: `spec-fixed.md`, `prd.md`(ADR-1~4), `api-contract.md`

## 시그니처

### 백엔드 (Java)

```java
// domain/AttemptResult.java
public enum AttemptResult {
    CORRECT, WRONG, HOLD
}

// domain/Attempt.java
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Attempt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String problemId;

    @Column(nullable = false)
    private int elapsedTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttemptResult result;

    @Column(columnDefinition = "text")
    private String memo;                 // nullable

    @ManyToMany
    @JoinTable(name = "attempt_tag",
        joinColumns = @JoinColumn(name = "attempt_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id"))
    private List<Tag> tags = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Attempt(Long userId, String problemId, int elapsedTime,
                   AttemptResult result, String memo, List<Tag> tags) { ... }
}

// repository/AttemptRepository.java
public interface AttemptRepository extends JpaRepository<Attempt, Long> {
}

// service/AttemptCreateCommand.java
public record AttemptCreateCommand(
    String problemId,
    Integer elapsedTime,
    String result,
    List<Long> tagIds,
    String memo
) {
}

// service/AttemptService.java
@Service
@RequiredArgsConstructor
public class AttemptService {
    private final AttemptRepository attemptRepository;
    private final TagRepository tagRepository;

    // 검증 → Tag 조회 → Attempt 저장. 반환은 저장된 Attempt.
    public Attempt createAttempt(Long userId, AttemptCreateCommand command);
}

// controller/dto/CreateAttemptRequest.java
public record CreateAttemptRequest(
    String problemId,
    Integer elapsedTime,
    String result,
    List<Long> tagIds,
    String memo
) {
}

// controller/dto/AttemptResponse.java
public record AttemptResponse(
    Long id,
    String problemId,
    int elapsedTime,
    AttemptResult result,
    List<TagResponse> tags,          // PR #41 controller/dto/TagResponse 재사용
    String memo,
    LocalDateTime createdAt
) {
}

// controller/AttemptController.java
@RestController
@RequestMapping("/api/attempts")
@RequiredArgsConstructor
public class AttemptController {
    private final AttemptService attemptService;

    @PostMapping
    public ResponseEntity<AttemptResponse> createAttempt(
        @AuthenticationPrincipal Long userId,
        @RequestBody CreateAttemptRequest request);   // → 201 Created
}
```

### 에러 케이스

`AttemptService.createAttempt`가 아래 조건에서 `InvalidRequestException`을 던진다.
`GlobalExceptionHandler`(develop 기존)가 `400 { "code": "INVALID_REQUEST", "message": ... }`로 변환한다.

| 조건 | 예외 |
|------|------|
| `problemId`가 `null`이거나 공백만 | `InvalidRequestException` |
| `elapsedTime`이 `null` | `InvalidRequestException` |
| `elapsedTime`이 음수 | `InvalidRequestException` |
| `result`가 `null` | `InvalidRequestException` |
| `result`가 `CORRECT` / `WRONG` / `HOLD` 외의 문자열 | `InvalidRequestException` |
| `tagIds`가 `null`이거나 빈 배열 | `InvalidRequestException` |
| `tagIds`에 `tag` 테이블에 없는 id가 하나라도 있음 | `InvalidRequestException` (이때 `attemptRepository.save`는 호출되지 않음) |

인증 실패(토큰 없음/위조/만료)는 이 이슈의 코드가 아니라 `JwtAuthenticationFilter` +
`JwtAuthenticationEntryPoint`가 `401 { "code": "UNAUTHENTICATED" }`로 자동 처리한다.

---

## 테스트 시나리오

### 정상

- [정상] `AttemptService.createAttempt` — should save attempt with result CORRECT and null memo when valid input is given
- [정상] `AttemptService.createAttempt` — should save attempt with result WRONG and the given memo
- [정상] `AttemptService.createAttempt` — should save attempt with result HOLD
- [정상] `AttemptService.createAttempt` — should store the userId passed as parameter (not any value from command)
- [정상] `AttemptService.createAttempt` — should link all Tag entities resolved from tagIds to the saved attempt
- [정상] `AttemptService.createAttempt` — should save attempt when memo is null
- [정상] `AttemptController POST /api/attempts` — should return 201 with saved attempt body (id, problemId, elapsedTime, result, tags, memo, createdAt) when authenticated and request is valid
- [정상] `AttemptController POST /api/attempts` — should pass the authentication principal userId to the service
- [정상] `AttemptController POST /api/attempts` — should return tags as objects with id, name, category in the response body

### 경계

- [경계] `AttemptService.createAttempt` — should accept elapsedTime of exactly 0
- [경계] `AttemptService.createAttempt` — should accept exactly one tagId (minimum count)

### 예외

- [예외] `AttemptService.createAttempt` — should reject when problemId is null
- [예외] `AttemptService.createAttempt` — should reject when problemId is blank
- [예외] `AttemptService.createAttempt` — should reject when elapsedTime is null
- [예외] `AttemptService.createAttempt` — should reject when elapsedTime is negative
- [예외] `AttemptService.createAttempt` — should reject when result is null
- [예외] `AttemptService.createAttempt` — should reject when result is not one of CORRECT, WRONG, HOLD
- [예외] `AttemptService.createAttempt` — should reject when tagIds is null
- [예외] `AttemptService.createAttempt` — should reject when tagIds is empty
- [예외] `AttemptService.createAttempt` — should reject and not call attemptRepository.save when tagIds contains an id not present in the tag table
- [예외] `AttemptController POST /api/attempts` — should return 401 when the request has no authentication
- [예외] `AttemptController POST /api/attempts` — should return 400 with code INVALID_REQUEST when the service throws InvalidRequestException

---

## AC 커버리지

| AC | 커버 시나리오 |
| --- | --- |
| AC-1 (유효 요청 → 201 + 저장 결과) | [정상] createAttempt CORRECT / [정상] Controller 201 with body |
| AC-2 (userId는 JWT에서 추출·저장) | [정상] should store userId passed as parameter / [정상] Controller passes principal userId |
| AC-3 (result 누락/오류 → 400) | [예외] result is null / [예외] result not one of CORRECT,WRONG,HOLD / [예외] Controller 400 INVALID_REQUEST |
| AC-4 (tagIds 0개 → 400) | [예외] tagIds is empty / [예외] tagIds is null |
| AC-5 (없는 tagId → 400, 생성 안 됨) | [예외] tagIds contains id not in tag table (and save not called) |
| AC-6 (memo null 저장 가능) | [정상] save when memo is null / [정상] CORRECT with null memo |
| AC-7 (elapsedTime 음수 → 400) | [예외] elapsedTime is negative / [예외] elapsedTime is null / [경계] elapsedTime exactly 0 |
| AC-8 (미인증 → 401) | [예외] Controller 401 when no authentication |
