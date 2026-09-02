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

---

## 알려진 제약 / 향후 과제

`ac-verifier`가 AC 4개를 "부분 충족"으로 판정하면서 발견한 갭 중, 이번 이슈 범위를 넘어선다고 판단해 지금은 처리하지 않고 남겨두는 것들.

1. **동시 요청 시 500 위험** (AC-2 관련) — 같은 `problemId`로 두 요청이 동시에 들어오면 둘 다 `findByProblemId`에서 empty를 보고 둘 다 `save`를 시도할 수 있다. 이때 두 번째 저장은 `Problem.problemId`의 DB unique 제약 위반(`DataIntegrityViolationException`)으로 실패하는데, `GlobalExceptionHandler`에 이 예외를 처리하는 핸들러가 없어 500으로 응답한다. 이 API는 "사용자가 익스텐션 아이콘을 클릭"하는 단일 동작으로만 트리거되어 실제 동시 요청 가능성은 낮다고 판단해 지금은 처리하지 않음. 실제로 문제가 되면 별도 이슈로 `GlobalExceptionHandler`에 `DataIntegrityViolationException` 핸들러(재조회 후 정상 응답 또는 409 Conflict) 추가 검토.

2. **잘못된 요청 바디 처리** (AC-3 관련) — JSON 바디를 아예 안 보내거나 `Content-Type`이 다르면 Spring이 `HttpMessageNotReadableException`을 던지는데, 이것도 `GlobalExceptionHandler`가 처리하지 않아 우리가 정한 `{code: "INVALID_REQUEST", message}` 형식이 아닌 Spring 기본 에러 형식으로 응답된다. 이 API를 호출하는 유일한 클라이언트가 우리가 직접 만드는 익스텐션(Issue 2)이라 형식이 깨진 요청이 나올 가능성이 낮다고 판단해 보류. 처리하려면 새 시나리오 도출부터 다시 밟아야 함.

3. **Security 부재로 인한 우연한 통과** (AC-4 관련) — 지금 `Authorization` 헤더 없이도 성공하는 이유는 "인증이 불필요하도록 설계해서"가 아니라 `spring-boot-starter-security` 의존성 자체가 프로젝트에 없어서다. **향후 로그인/인증 기능 이슈에서 Spring Security를 추가할 때, `SecurityConfig`에 `/api/problems`를 `permitAll()`로 명시적으로 열어두는 걸 반드시 확인해야 한다** — 안 그러면 이 API가 의도치 않게 401로 막힐 수 있다.
