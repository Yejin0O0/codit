---
name: tdd-green-backend
description: >
  Spring Boot 백엔드의 실패 중인 JUnit 5 테스트를 통과시키는 최소 구현을 작성하는 스킬.
  "/tdd-green-backend N" 또는 tdd-green이 백엔드 레이어로 위임할 때 사용합니다.
  테스트에 없는 기능을 임의로 구현하거나 테스트 파일을 수정하지 않습니다.
---

# TDD Green — 백엔드 (Spring Boot)

실패 중인 JUnit 5 테스트를 하나씩 통과시키는 **최소한의 구현 코드**를 작성한다.

```
실패 테스트 목록
    ↓ 첫 번째 실패 테스트 선택
    ↓ 최소 구현 작성
    ↓ 테스트 실행 → 통과 + 회귀 없음 확인
    ↓ issue-{N}.md 체크박스 업데이트
    ↓ 다음 실패 테스트
전체 통과 → 커버리지 측정 → 결과 요약
```

---

## 핵심 원칙

**테스트가 유일한 명세다**
테스트가 검증하지 않는 동작은 구현하지 않는다. 구현 충동이 생기면 "이걸 검증하는 테스트가 있는가?"를 먼저 묻는다.

**테스트 파일은 읽기 전용이다**
테스트를 통과시키기 위해 테스트를 바꾸는 것은 명세를 바꾸는 것이다. 테스트 수정이 필요하다고 판단되면 개발자에게 보고하고 중단한다.

**한 번에 한 시나리오만 진행한다**
첫 번째 실패 테스트 하나만 선택하고, 통과를 확인한 뒤 다음으로 넘어간다.

**가장 단순한 코드가 정답이다**
미래 요구사항을 예측한 추상화나 유연성 확보는 하지 않는다. 그 판단은 Refactor 단계의 몫이다.

**불필요한 방어 코드를 넣지 않는다**
테스트가 다루지 않는 null 체크, 예외 처리, 기본값 처리는 지금 구현할 필요가 없다.

**회귀 확인은 매번, 예외 없이 한다**
새 테스트를 통과시킨 뒤 반드시 전체 테스트를 실행한다. 회귀가 발생하면 구현 방향이 잘못됐다는 신호다.

**피드백 루프는 최대 5회다**
5회 수정해도 통과하지 못하면 개발자에게 보고하고 판단을 맡긴다.

---

## 시작 전: 입력 확인

- **이슈 번호**: `$ARGUMENTS`에서 추출.
- **시나리오 파일**: `docs/features/{feature명}/issue-{N}.md`를 읽는다.

---

## 1단계: 전체 테스트 실행

```bash
cd backend && ./gradlew test 2>&1
```

실패 테스트 목록을 확인한다.

---

## 2단계: 컴파일 에러 감지

테스트 수가 `issue-{N}.md`의 체크박스 총 건수와 불일치하거나 컴파일 에러가 발생하면,
스텁 클래스/메서드가 누락된 것이다.
`tdd-red-backend` 스킬의 스텁 패턴을 참고해 스텁을 생성하고 1단계로 돌아간다.

---

## 3단계: API 스펙 컨텍스트 로드

구현 전에 `docs/features/{feature명}/prd.md`의 **ADR 섹션**을 읽어 다음을 확인한다:

- 엔드포인트 경로, HTTP 메서드, 요청/응답 형식
- 에러 응답 코드 및 메시지 형식
- 레이어 간 책임 경계 (Controller / Service / Repository 역할 분리)

ADR에 없는 응답 형식이나 에러 코드는 임의로 추가하지 않는다.

---

## 4단계: 첫 번째 실패 테스트 구현

실패 테스트 목록 중 **첫 번째**를 선택해 통과시키는 최소한의 코드만 작성한다.

### 레이어별 구현 패턴

#### Service

비즈니스 로직만 구현한다. 도메인 객체를 반환하고, Repository 호출은 테스트가 요구하는 범위만 추가한다.

```java
@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;

    public Item create(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name must not be blank");
        }
        return itemRepository.save(new Item(name));
    }
}
```

#### Controller

Service에 위임하고 적절한 HTTP 상태 코드를 반환한다. 응답 변환 로직 외의 비즈니스 로직은 넣지 않는다.

```java
@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;

    @PostMapping
    public ResponseEntity<ItemResponse> create(@RequestBody @Valid ItemRequest request) {
        Item item = itemService.create(request.name());
        return ResponseEntity.status(HttpStatus.CREATED).body(ItemResponse.from(item));
    }
}
```

#### Repository

Spring Data JPA가 처리하므로 인터페이스에 쿼리 메서드 시그니처만 추가한다.

```java
public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findByNameContaining(String keyword);
}
```

#### 도메인 엔티티

테스트가 요구하는 필드와 생성자만 추가한다. 불필요한 편의 메서드는 Refactor 단계에서 판단한다.

```java
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Item {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    public Item(String name) {
        this.name = name;
    }
}
```

---

## 5단계: 테스트 실행 — 피드백 루프

특정 테스트 클래스만 실행할 때:

```bash
cd backend && ./gradlew test --tests "com.codit.backend.{패키지}.{클래스명}" 2>&1
```

전체 실행:

```bash
cd backend && ./gradlew test 2>&1
```

### 통과한 경우

대상 테스트가 통과하고 회귀가 없으면 → 6단계로 진행.

### 실패한 경우

에러 메시지를 읽고 원인을 분석해 코드를 수정한 뒤 반복한다.

**최대 5회 반복 후에도 실패하면** 개발자에게 보고하고 중단한다:
- 실패 중인 테스트 이름
- 에러 메시지 전문
- 시도한 수정 내역과 각각의 결과

---

## 6단계: 체크박스 업데이트

`docs/features/{feature명}/issue-{N}.md`에서 `- [ ]` → `- [x]`로 변경한다.

---

## 7단계: 다음 테스트로 이동

남은 실패 테스트가 있으면 4단계부터 반복한다.

---

## 8단계: 커버리지 측정

```bash
cd backend && ./gradlew test jacocoTestReport 2>&1
```

리포트는 `build/reports/jacoco/test/html/index.html`에서 확인한다.

미커버 라인을 확인하고 판단해 개발자에게 보고한다:

- **시나리오에서 빠진 케이스**: "이 라인은 테스트되지 않았습니다. 시나리오 추가를 검토해주세요."
- **도달 불가 코드 또는 방어 코드**: "이 라인은 현재 시나리오 범위 밖입니다."

커버리지를 올리기 위해 테스트를 추가하거나 구현을 바꾸지 않는다.

---

## 9단계: 결과 요약

```
테스트 클래스                      통과   실패
──────────────────────────────────────────
ItemServiceTest                      4      0
ItemControllerTest                   3      0
ItemRepositoryTest                   2      0
──────────────────────────────────────────
합계                                 9      0

커버리지 (주요 파일)
──────────────────────────────────────────
ItemService.java       Lines  96%  미커버: 42 (방어 코드)
ItemController.java    Lines 100%
ItemRepository.java    Lines 100%

미커버 라인 판단: ItemService 42는 시나리오에서 다루지 않은 방어 분기
```

---

## 제약

- 테스트 파일(`*Test.java`)은 읽기만 허용. 수정 금지.
- 테스트가 검증하지 않는 기능 구현 금지.
- `@SpringBootTest`는 전체 컨텍스트를 띄워 느리므로 사용하지 않는다. 레이어에 맞는 슬라이스 어노테이션(`@WebMvcTest`, `@DataJpaTest`, `@ExtendWith(MockitoExtension.class)`)을 사용한다.
- ADR에 없는 응답 형식·에러 코드 임의 추가 금지.
- 커버리지를 올리기 위한 테스트 추가 금지.
