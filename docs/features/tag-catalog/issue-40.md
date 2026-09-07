# Issue 40: [유형 태그] 유형 태그 조회/등록 API

## 시그니처

### 백엔드 (Java)

```java
// domain/Tag.java
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Tag {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String normalizedName;

    @Column(nullable = false)
    private String category;

    public Tag(String name, String normalizedName, String category) { ... }
}

// repository/TagRepository.java
public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findByNormalizedName(String normalizedName);
}

// service/TagUpsertResult.java
public record TagUpsertResult(Tag tag, boolean created) {}

// service/TagService.java
@Service
public class TagService {
    public List<Tag> getAllTags();
    public TagUpsertResult upsertTag(String name);
}

// controller/dto/CreateTagRequest.java
public record CreateTagRequest(String name) {}

// controller/dto/TagResponse.java
public record TagResponse(Long id, String name, String category) {}

// controller/TagController.java
@RestController
@RequestMapping("/api/tags")
public class TagController {
    @GetMapping
    public ResponseEntity<List<TagResponse>> getTags();

    @PostMapping
    public ResponseEntity<TagResponse> createTag(@RequestBody CreateTagRequest request);
}
```

### 에러 케이스

- `TagService.upsertTag`: `name`이 `null`이거나 blank면 `InvalidRequestException` throw
  → `GlobalExceptionHandler`가 `400 {code: "INVALID_REQUEST", message}`로 변환
- 동시 생성으로 인한 DB unique 제약(`normalizedName`) 위반은 클라이언트에 노출하지
  않고, `TagService.upsertTag` 내부에서 `findByNormalizedName`으로 재조회해
  `TagUpsertResult(existing, false)`로 흡수한다

---

## 테스트 시나리오

### 정상

- [정상] `TagService.getAllTags` — 저장된 모든 태그를 반환
- [정상] `TagService.upsertTag` — 존재하지 않는 이름이면 `category: CUSTOM`인 새 태그 생성
- [정상] `TagService.upsertTag` — 정확히 일치하는 이름이 이미 있으면 기존 태그 반환(중복 생성 안 됨)
- [정상] `TagService.upsertTag` — 대소문자만 다른 이름(`"dfs"` vs `"DFS"`) 입력 시 기존 CORE 태그 반환
- [정상] `TagService.upsertTag` — 앞뒤 공백만 다른 이름 입력 시 기존 태그 반환
- [정상] `TagController GET /api/tags` — 200과 태그 목록 반환
- [정상] `TagController POST /api/tags` — 신규 생성 시 201과 생성된 태그(`category: CUSTOM`) 반환
- [정상] `TagController POST /api/tags` — 기존 태그 매칭 시 200과 기존 태그 반환
- [정상] `TagController` — Authorization 헤더 없이 호출 성공 (기존 `ProblemControllerTest` 패턴과 동일, `addFilters=false` 한계 있음)

### 경계

- 해당 없음 (태그 이름 길이 제한 등은 Out of Scope)

### 예외

- [예외] `TagService.upsertTag` — `name`이 `null`이면 `InvalidRequestException`
- [예외] `TagService.upsertTag` — `name`이 빈 문자열이면 `InvalidRequestException`
- [예외] `TagService.upsertTag` — `name`이 공백만 있으면 `InvalidRequestException`
- [예외] `TagService.upsertTag` — 저장 중 `DataIntegrityViolationException`(동시 생성 충돌) 발생 시, 예외를 던지지 않고 재조회한 기존 태그를 반환
- [예외] `TagController POST /api/tags` — `name` 누락/공백 시 400 + `{code: "INVALID_REQUEST"}`
- [예외] `TagControllerTest`(`@WebMvcTest` + `@Import({SecurityConfig, JwtAuthenticationEntryPoint, GlobalExceptionHandler})`, `UserControllerTest`와 동일 패턴 — `@SpringBootTest` 아님) — `/api/tags` 요청이 permitAll 설정으로 인증 없이 401 없이 통과하는지 검증
- [예외] `TagControllerTest` — `Origin` 헤더를 포함한 요청에 `Access-Control-Allow-Origin` 응답 헤더가 포함되는지 검증(CORS 설정 확인)

---

## AC 커버리지

| AC | 커버 시나리오 |
|----|--------------|
| AC-1 (GET 시 25개 CORE+카테고리 반환) | [정상] `getAllTags` / `GET /api/tags` 200 |
| AC-2 (신규 이름 → 201, CUSTOM) | [정상] `upsertTag` 신규 생성 / `POST` 201 |
| AC-3 (기존 이름, 대소문자·공백 무관 → 200) | [정상] `upsertTag` 대소문자/공백 매칭 / `POST` 200 |
| AC-4 (빈 이름 → 400) | [예외] `upsertTag` null/빈값/공백 / `POST` 400 |
| AC-5 (인증 불필요) | [정상] Authorization 헤더 없이 성공 + [예외] `TagControllerTest` permitAll 검증 |
| AC-6 (CORS, 익스텐션에서 호출 가능) | [예외] `TagControllerTest` CORS 헤더 검증 |
