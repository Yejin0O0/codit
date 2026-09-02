# Issue 5: [문제 식별] 문제 식별 저장 API (백엔드)

## 시그니처

### 백엔드 (Java)

**Problem 엔티티**

```java
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Problem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String problemId;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Problem(String problemId, String url) {
        this.problemId = problemId;
        this.url = url;
        this.createdAt = LocalDateTime.now();
    }
}
```

**ProblemRepository**

```java
public interface ProblemRepository extends JpaRepository<Problem, Long> {
    Optional<Problem> findByProblemId(String problemId);
}
```

**ProblemService** (결정 포인트 1: 안 A 확정 — upsert 판단을 Service에 캡슐화)

```java
@Service
@RequiredArgsConstructor
public class ProblemService {

    private final ProblemRepository problemRepository;

    public ProblemUpsertResult upsertProblem(String problemId, String url) {
        if (problemId == null || problemId.isBlank() || url == null || url.isBlank()) {
            throw new InvalidRequestException("problemId와 url은 필수입니다.");
        }
        return problemRepository.findByProblemId(problemId)
            .map(existing -> new ProblemUpsertResult(existing, false))
            .orElseGet(() -> new ProblemUpsertResult(
                problemRepository.save(new Problem(problemId, url)), true));
    }
}

public record ProblemUpsertResult(Problem problem, boolean created) {}
```

**ProblemController**

```java
@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
public class ProblemController {

    private final ProblemService problemService;

    @PostMapping
    public ResponseEntity<ProblemResponse> identifyProblem(@RequestBody IdentifyProblemRequest request) {
        ProblemUpsertResult result = problemService.upsertProblem(request.problemId(), request.url());
        HttpStatus status = result.created() ? HttpStatus.CREATED : HttpStatus.OK;
        return ResponseEntity.status(status).body(toResponse(result.problem()));
    }
}

public record IdentifyProblemRequest(String problemId, String url) {}

public record ProblemResponse(Long id, String problemId, String url, LocalDateTime createdAt) {}
```

### 에러 케이스

**필수값 누락** (결정 포인트 2: 안 A 확정 — 수동 체크 + 커스텀 예외, 새 의존성 없음)

```java
public class InvalidRequestException extends RuntimeException {
    public InvalidRequestException(String message) {
        super(message);
    }
}

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<ErrorResponse> handleInvalidRequest(InvalidRequestException e) {
        return ResponseEntity.badRequest().body(new ErrorResponse("INVALID_REQUEST", e.getMessage()));
    }
}

public record ErrorResponse(String code, String message) {}
```

- `problemId` 또는 `url`이 null이거나 blank이면 `ProblemService.upsertProblem()`이 `InvalidRequestException`을 던진다.
- `GlobalExceptionHandler`가 이를 잡아 `400 { code: "INVALID_REQUEST", message }`로 변환한다.
- `Authorization` 헤더는 검사하지 않는다 (인증 불필요, ADR-1).

---

## 테스트 시나리오

### 정상

- [정상] `ProblemService.upsertProblem` — should create new Problem and return `created=true` when problemId does not exist
- [정상] `ProblemService.upsertProblem` — should return existing Problem and `created=false` when problemId already exists
- [정상] `ProblemController.identifyProblem` — should return 201 Created with problem body when new problem is created
- [정상] `ProblemController.identifyProblem` — should return 200 OK with existing problem body when problem already exists (no duplicate created)
- [정상] `ProblemController.identifyProblem` — should succeed without Authorization header

### 경계

- [경계] `ProblemService.upsertProblem` — should reject when problemId is whitespace-only string
- [경계] `ProblemService.upsertProblem` — should reject when url is whitespace-only string

### 예외

- [예외] `ProblemService.upsertProblem` — should throw InvalidRequestException when problemId is null
- [예외] `ProblemService.upsertProblem` — should throw InvalidRequestException when url is null
- [예외] `ProblemController.identifyProblem` — should return 400 with `{code: "INVALID_REQUEST"}` when problemId is missing
- [예외] `ProblemController.identifyProblem` — should return 400 with `{code: "INVALID_REQUEST"}` when url is missing

---

## AC 커버리지

| AC | 커버 시나리오 |
|----|--------------|
| AC-1 (problemId로 요청 시 Problem 없으면 신규 생성, 201) | [정상] upsertProblem — created=true / [정상] identifyProblem — 201 |
| AC-2 (Problem 이미 있으면 기존 데이터 200, 중복 생성 안 됨) | [정상] upsertProblem — created=false / [정상] identifyProblem — 200 |
| AC-3 (problemId 또는 url 누락 시 400 INVALID_REQUEST) | [예외] upsertProblem — problemId/url null (2건) / [예외] identifyProblem — 400 (2건) |
| AC-4 (Authorization 헤더 없이도 정상 동작) | [정상] identifyProblem — Authorization 헤더 없이 성공 |
