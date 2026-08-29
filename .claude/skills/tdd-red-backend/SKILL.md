---
name: tdd-red-backend
description: >
  Spring Boot 백엔드의 승인된 시나리오를 실패하는 JUnit 5 테스트 코드로 변환하는 스킬.
  "/tdd-red-backend N" 또는 tdd-red가 백엔드 레이어로 위임할 때 사용합니다.
  issue-{N}.md의 시나리오를 JUnit 5 + Mockito 테스트 코드로 작성하고,
  각 테스트가 AssertionError로 실패하는지 확인합니다.
---

# TDD Red — 백엔드 (Spring Boot)

`docs/features/{feature명}/issue-{N}.md`의 시나리오를 **실패하는 JUnit 5 테스트 코드**로 변환한다.
테스트는 반드시 **AssertionError**로 실패해야 한다 (컴파일 에러 또는 NullPointerException은 Red 미완성).

```
issue-{N}.md (시그니처 + 시나리오)
    ↓ 시나리오 → 레이어별로 묶기 (Controller / Service / Repository)
    ↓ 스텁 클래스 생성 (시그니처만, 구현 없음)
    ↓ @Test 메서드 작성 → 즉시 실행 → AssertionError 확인
    ↓ 다음 시나리오
테스트 파일들 (전부 AssertionError 실패 상태)
```

---

## 시작 전: 입력 확인

- **이슈 번호**: `$ARGUMENTS`에서 추출.
- **시나리오 파일**: `docs/features/{feature명}/issue-{N}.md`를 읽는다.
  - 없으면: "`issue-{N}.md`가 없습니다. `/test-scenarios {N}`을 먼저 실행해주세요." 안내 후 중단.
- **시그니처 섹션**: 파일 상단의 시그니처에서 패키지 경로, 메서드 시그니처, 반환 타입을 파악한다.

---

## 테스트 환경

- **프레임워크**: JUnit 5 (`@Test`, `@ExtendWith`, `@BeforeEach`)
- **Mock**: Mockito (`@Mock`, `@InjectMocks`, `@MockitoBean`)
- **단언**: AssertJ (`assertThat`, `assertThatThrownBy`)
- **HTTP 테스트**: MockMvc (`@WebMvcTest`)
- **기본 패키지**: `com.codit.backend`

---

## 테스트 파일 매핑

시나리오의 대상 레이어를 보고 테스트 슬라이스와 스텁 위치를 결정한다.

| 대상 레이어 | 테스트 어노테이션 | 테스트 파일 위치 | 스텁 파일 위치 |
|---|---|---|---|
| Controller | `@WebMvcTest` | `test/.../controller/{대상}Test.java` | `main/.../controller/{대상}.java` |
| Service | `@ExtendWith(MockitoExtension.class)` | `test/.../service/{대상}Test.java` | `main/.../service/{대상}.java` |
| Repository | `@DataJpaTest` | `test/.../repository/{대상}Test.java` | `main/.../repository/{대상}.java` |

시그니처에 경로가 명시된 경우 그것을 우선한다.

---

## 스텁 클래스 패턴

테스트가 컴파일에 성공하되 동작은 하지 않는 껍데기. 반환 타입에 맞는 기본값(null / 0 / false)만 반환한다.

### Service 스텁

```java
// main/.../service/ItemService.java
@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;

    public Item create(String name) {
        return null;
    }

    public List<Item> findAll() {
        return List.of();
    }
}
```

### Controller 스텁

```java
// main/.../controller/ItemController.java
@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;

    @PostMapping
    public ResponseEntity<ItemResponse> create(@RequestBody @Valid ItemRequest request) {
        return null;
    }

    @GetMapping
    public ResponseEntity<List<ItemResponse>> findAll() {
        return null;
    }
}
```

### Repository 스텁

JPA Repository는 인터페이스이므로 스텁을 별도로 만들지 않는다. `@DataJpaTest`가 실제 구현체를 주입한다.
쿼리 메서드만 인터페이스에 시그니처로 추가한다:

```java
// main/.../repository/ItemRepository.java
public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findByNameContaining(String keyword);
}
```

---

## 테스트 코드 패턴

### Service 테스트 (`@ExtendWith(MockitoExtension.class)`)

```java
@ExtendWith(MockitoExtension.class)
class ItemServiceTest {

    @Mock
    private ItemRepository itemRepository;

    @InjectMocks
    private ItemService itemService;

    @Test
    void should_return_saved_item_when_valid_name_given() {
        // given
        given(itemRepository.save(any())).willReturn(null);

        // when
        Item result = itemService.create("sample");

        // then
        assertThat(result).isNotNull();                    // 스텁은 null → 실패 → 진짜 Red
        assertThat(result.getName()).isEqualTo("sample");
    }

    @Test
    void should_throw_when_name_is_blank() {
        assertThatThrownBy(() -> itemService.create(""))
            .isInstanceOf(IllegalArgumentException.class);  // 스텁은 null 반환 → 실패 → 진짜 Red
    }
}
```

### Controller 테스트 (`@WebMvcTest`)

```java
@WebMvcTest(ItemController.class)
class ItemControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ItemService itemService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void should_return_201_when_valid_request_given() throws Exception {
        // given
        given(itemService.create(any())).willReturn(new Item("sample"));

        // when & then
        mockMvc.perform(post("/api/items")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new ItemRequest("sample"))))
            .andExpect(status().isCreated())               // 스텁은 null 반환 → NullPointerException → 스텁 수정 필요
            .andExpect(jsonPath("$.name").value("sample"));
    }

    @Test
    void should_return_400_when_name_is_blank() throws Exception {
        mockMvc.perform(post("/api/items")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new ItemRequest(""))))
            .andExpect(status().isBadRequest());
    }
}
```

### Repository 테스트 (`@DataJpaTest`)

```java
@DataJpaTest
class ItemRepositoryTest {

    @Autowired
    private ItemRepository itemRepository;

    @Test
    void should_find_items_when_keyword_matches_name() {
        // given
        itemRepository.save(new Item("sample-item"));

        // when
        List<Item> result = itemRepository.findByNameContaining("sample");

        // then
        assertThat(result).hasSize(1);                     // 쿼리 메서드 없으면 컴파일 에러 → 스텁 추가 필요
        assertThat(result.get(0).getName()).isEqualTo("sample-item");
    }
}
```

---

## 실패 유형 판단

| 실패 유형 | 의미 | 조치 |
|---|---|---|
| `AssertionError` | 진짜 Red — 정상 | 다음 시나리오로 이동 |
| 컴파일 에러 | 스텁 클래스/메서드 누락 | 스텁에 시그니처 추가 후 재실행 |
| `NullPointerException` | 스텁이 null 반환하는데 호출부가 체이닝 | 스텁이 최소한의 객체를 반환하도록 수정 (로직 X, 객체 생성만) |
| pass | 이미 구현된 기능 | 사용자에게 알리고 다음 시나리오로 이동 |

**NullPointerException이 발생하면 Red 미완성이다.** 테스트가 스텁의 반환값에 `.메서드()`를 체이닝하는 경우, 스텁이 빈 객체를 반환하도록 수정한다:

```java
// NullPointerException 발생 시 스텁 수정 예시
public Item create(String name) {
    return new Item(); // null 대신 빈 객체 — 로직은 없고 NPE만 방지
}
```

---

## 실행 순서

### 1단계: 시나리오를 레이어별로 묶기

`issue-{N}.md`의 시나리오를 Controller / Service / Repository 단위로 그룹화한다.
의존성 순서(Repository → Service → Controller)로 처리한다.

### 2단계: 레이어별 스텁 생성 + 테스트 작성 + 실패 확인

레이어 하나를 처리할 때:

1. 스텁 클래스가 없으면 먼저 생성한다.
2. 테스트 클래스가 없으면 뼈대를 작성한다.
3. 시나리오 하나를 `@Test` 메서드로 추가한다.
4. 저장 후 즉시 실행한다:
   ```bash
   cd backend && ./gradlew test --tests "com.codit.backend.{패키지}.{클래스명}" 2>&1
   ```
5. **AssertionError**로 실패하는지 확인한다. 실패를 확인한 뒤 다음 시나리오를 추가한다.

### 3단계: 전체 실행

모든 레이어 완료 후:

```bash
cd backend && ./gradlew test 2>&1
```

결과를 아래 형식으로 요약한다:

```
테스트 클래스                      실패 수   실패 유형
──────────────────────────────────────────────────
ItemServiceTest                      4개     AssertionError
ItemControllerTest                   3개     AssertionError
ItemRepositoryTest                   2개     AssertionError
```

---

## 제약

- 스텁 클래스(빈 껍데기)는 생성/수정 가능하다. 스텁에 실제 비즈니스 로직을 넣는 것은 Green 단계이므로 금지.
- 테스트 파일은 자유롭게 생성/수정한다.
- `@Disabled` 사용 금지 — 모든 `@Test`는 실행되어 **AssertionError**로 실패해야 한다.
- 컴파일 에러나 NullPointerException은 Red 미완성 — 반드시 AssertionError 상태로 전환한다.
- `@SpringBootTest`는 전체 컨텍스트를 띄워 느리므로 사용하지 않는다. 레이어에 맞는 슬라이스 어노테이션을 사용한다.
