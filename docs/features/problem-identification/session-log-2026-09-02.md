# 세션 로그 — 2026-09-02 (이슈 #5: 문제 식별 저장 API)

> `progress-notes.md`가 "다음에 뭘 해야 하는지"를 위한 요약이라면, 이 파일은 "오늘 왜 그렇게 결정했는지"까지 포함한 상세 기록이다. 나중에 "왜 이렇게 만들었지?"가 궁금할 때 참고.

## 오늘 진행한 tdd-loop 단계

```
[완료] 1. /test-scenarios 5   — 시그니처 결정 포인트 2개 확정, 시나리오 11개 도출
[완료] 2. /tdd-red 5          — JUnit 5 실패 테스트 11개 작성 (전부 AssertionError 확인)
[완료] 3. /tdd-green 5        — 최소 구현, 11개 테스트 Green 전환, jacoco 100%
[완료] 4. /ac-verifier 5      — AC 4개 독립 검증 → 전부 "부분 충족" 판정, 갭 3개 보강
[완료] 5. /tdd-refactor 5     — 리팩토링 후보 1건 검토 → 과한 추상화로 판단해 변경 없이 종료
[다음] 6. /security-review 5
[ ]   7. /create-pr 5
```

---

## 1. `/test-scenarios 5` — 시그니처·시나리오 확정

이전 세션에서 시그니처 제안까지 하고 중단된 상태였음. 결정 포인트 2개에 답변:

- **Service 반환 구조**: 안 A 확정 — `ProblemUpsertResult(problem, created)` 반환, upsert 판단을 Service에 캡슐화 (Controller가 Repository를 직접 아는 것보다 계층 경계가 명확함)
- **필수값 검증 방식**: 안 A 확정 — Service에서 수동 체크 + `InvalidRequestException`, `spring-boot-starter-validation` 같은 새 의존성 없이 처리

시나리오 11개(정상 5 / 경계 2 / 예외 4) 도출 후 AC 4개와 전부 매핑 확인. `issue-5.md`에 저장.

## 2. `/tdd-red 5` — 실패 테스트 작성

`Problem` 엔티티, `ProblemRepository`, `ProblemService`/`ProblemController` 스텁, DTO(record) 3종, `InvalidRequestException`을 만들고 테스트 11개(Service 6 / Controller 5) 작성. 전부 `AssertionError`로 실패하는 진짜 Red 상태 확인.

**환경 이슈**: `build.gradle`에 JPA/DB 관련 의존성이 전혀 없어서 `spring-boot-starter-data-jpa`(엔티티 컴파일용), `com.h2database:h2`(기존 `@SpringBootTest` 컨텍스트 로딩용)를 추가함. Spring Boot 4 / Jackson 3 환경이라 `@WebMvcTest`가 `org.springframework.boot.webmvc.test.autoconfigure` 패키지로, `ObjectMapper`가 `tools.jackson.databind` 패키지로 이동한 걸 확인하고 맞춰서 import.

## 3. `/tdd-green 5` — 최소 구현

`ProblemService.upsertProblem`에 검증 + upsert(`Optional.map`/`orElseGet`) 로직 구현, `ProblemController`에 200/201 분기 + `Problem`→`ProblemResponse` 매핑 구현, `GlobalExceptionHandler` + `ErrorResponse`로 `InvalidRequestException`을 `400 {code: "INVALID_REQUEST", message}`로 변환. 11개 테스트 전부 Green, jacoco 라인 커버리지 100% (미커버 라인 없음).

## 4. `/ac-verifier 5` — AC 독립 검증

테스트 통과와 별개로 "이슈 #5의 AC 4개가 실제 의도대로 충족됐는가"를 별도 에이전트로 검증. **4개 전부 "부분 충족"** 판정:

| AC | 핵심 갭 |
|---|---|
| AC-1 (신규 생성 201) | 응답 바디의 `id`/`url`/`createdAt`을 테스트가 검증 안 함 |
| AC-2 (기존 조회 200, 중복 방지) | "저장이 호출되지 않았다"를 명시적으로 검증 안 함 + 동시 요청 시 DB unique 제약 위반이 500으로 노출됨 |
| AC-3 (400 에러) | `message` 필드 미검증 + 잘못된 요청 바디(빈 바디/Content-Type) 시 다른 에러 형식 노출 |
| AC-4 (인증 불필요) | Spring Security 자체가 없어서 "우연히" 통과 — 향후 인증 기능 추가 시 회귀 위험 |

**처리 방침**: 갭마다 3가지 방안을 비교해서 결정.
- **지금 보강** (비용 낮은 테스트 추가): AC-1 응답 필드 단언, AC-2 `verify(..., never()).save(...)`, AC-3 `message` 단언 + blank 컨트롤러 테스트 1개 추가
- **문서에만 기록하고 보류** (이슈 범위 밖 판단): AC-2 동시성 처리, AC-3 잘못된 요청 바디 처리, AC-4 `SecurityConfig` 선제 작성 — `issue-5.md`의 "알려진 제약 / 향후 과제" 섹션에 근거와 함께 기록

`ReflectionTestUtils.setField`로 테스트용 `Problem`에 `id`를 강제 주입해서 응답 필드 검증을 가능하게 함. 테스트 13개로 증가, 전부 Green 유지.

## 5. `/tdd-refactor 5` — 리팩토링 검토

`CLAUDE.md`가 프로젝트에 없어서 기존 코드 패턴만 보고 판단. 변경된 백엔드 파일 10개 검토 결과 후보 1건 발견: `ProblemService.upsertProblem`이 "검증"과 "upsert"를 한 메서드에서 담당(단일 책임 관점에서 분리 여지). 다만 메서드가 6줄로 짧아 분리해도 얻는 이득이 적고, 프로젝트의 "미래 요구사항을 예측한 추상화 금지" 원칙에 비춰 **적용하지 않기로 결정**. 코드 변경 없이 종료.

---

## 대화 중 나온 주요 논의와 결정

### `Problem` 엔티티 필드 재검토 — 지은님 원본 명세와의 불일치 발견

작업 중 지은님이 작성한 팀 원본 명세서("문제 식별 API 명세서")를 확인했더니, 지금 구현과 두 가지가 갈렸다:

- 원본 명세엔 `title`(선택) 필드가 있고 `url` 필드가 없음
- 지금 구현은 `title`을 완전히 제외하고 `url`을 필수로 추가함

`api-contract.md`의 "설계 변경 이력"이 "지은님 스펙을 기준으로 재정렬"이라고만 적혀 있었는데, 실제로는 필드 구성이 정반대였음. 대화를 통해 다음을 확정:

- **`title` 제외**: 지은님 명세의 "팀 확정 필요 항목 #2"(title 파싱 필요 여부, 미결이었음)에 대한 답으로, 이번 이슈에서 DOM 파싱을 구현하지 않기로 확정
- **`url` 필수 추가**: 사용자가 스터디 박스 경유든 일반 목록 경유든 어떤 경로로 문제에 진입해도, `contestProbId`로 정규화된 "기본 문제 페이지" URL을 저장해서 이후 기능(바로가기 등)에서 일관되게 쓸 수 있게 하기 위함

`api-contract.md`의 설계 변경 이력을 이 근거로 다시 작성함. 지은님의 원본 명세서 자체는 이 레포에 없는 외부 문서라 직접 수정하지 못했고, 사용자가 직접 업데이트하기로 함.

### 실제 SWEA URL 구조 검증

사용자가 실제 SWEA 문제 페이지 URL 2개를 확인해줌:

```
스터디 박스 경유: https://swexpertacademy.com/main/talk/solvingClub/problemView.do?solveclubId=...&contestProbId=AWkIlHWqBYcDFAXC&probBoxId=...&type=PROBLEM&...
일반 목록 경유:   https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=AZ8R8haaeYnHBITH&categoryId=AZ8R8haaeYnHBITH&...
```

두 경로 모두 `contestProbId`가 쿼리 파라미터로 공통 존재함을 확인. 이걸로:
- `contestProbId` 값이 문서 예시(`"7965"` 같은 숫자)와 달리 실제로는 영숫자 문자열이라는 걸 확인 — `problemId: String` 타입 결정이 옳았음이 검증됨
- `api-contract.md`, 테스트 픽스처의 도메인 오탈자(`swea.skku.edu` → `swexpertacademy.com`)를 실제 값으로 수정

### URL 정규화 책임을 프론트엔드로 결정

백엔드는 받은 `url`을 그대로 저장할 뿐 가공하지 않는다는 게 확인되면서, "누가 정규화된 URL을 만들 것인가"가 쟁점이 됨. 안 A(프론트가 `contestProbId`로 정규화된 URL을 조립해서 전송) vs 안 B(백엔드가 `problemId`만으로 URL을 조립) 중 **안 A로 결정** — `contestProbId` 파싱이 이미 프론트(Issue 2) 책임 영역이고, 백엔드가 SWEA URL 패턴을 하드코딩해서 알 필요가 없기 때문. `issues.md`의 Issue 2에 정규화 코드 예시와 "categoryId가 항상 contestProbId와 같은지 확인 필요"라는 검증 필요 항목을 추가해서 프론트 담당자에게 전달할 수 있게 정리함.

---

## 오늘 변경된 파일

**백엔드 구현 (`backend/src/main/java/com/codit/backend/`)**
- `domain/Problem.java` (신규)
- `repository/ProblemRepository.java` (신규)
- `service/ProblemService.java`, `service/ProblemUpsertResult.java` (신규)
- `controller/ProblemController.java`, `controller/dto/IdentifyProblemRequest.java`, `controller/dto/ProblemResponse.java` (신규)
- `exception/InvalidRequestException.java`, `exception/ErrorResponse.java`, `exception/GlobalExceptionHandler.java` (신규)

**백엔드 테스트 (`backend/src/test/java/com/codit/backend/`)**
- `service/ProblemServiceTest.java` (신규, 6개 → 최종 그대로 6개, 검증 1건 보강)
- `controller/ProblemControllerTest.java` (신규, 5개 → 최종 6개로 증가, 응답 필드 단언 보강)

**`backend/build.gradle`**
- `spring-boot-starter-data-jpa`, `com.h2database:h2`(testRuntimeOnly), `jacoco` 플러그인 추가

**문서 (`docs/features/problem-identification/`)**
- `issue-5.md` (신규) — 시그니처, 테스트 시나리오, AC 커버리지, "알려진 제약/향후 과제" 섹션
- `api-contract.md` — 도메인 수정, 설계 변경 이력 재작성, 200 응답 `createdAt` 반영
- `issues.md` — Issue 2(프론트엔드)에 URL 정규화 요구사항 추가
- `progress-notes.md` — 진행 상태 갱신

## 오늘 커밋 (로컬, `feat/문제-식별-문제-식별-저장-api` 브랜치, `personal` 원격에 push 완료)

```
b83f3dc docs: 이슈 #5 시그니처 확정 및 테스트 시나리오 도출         (14:31)
2096b8e test: 이슈 #5 문제 식별 API 실패 테스트(Red) 작성           (15:54)
af0ce3b feat: 이슈 #5 문제 식별 저장 API 최소 구현(Green)           (16:55)
23d1eb3 test: 이슈 #5 ac-verifier 발견 갭 보강 및 알려진 제약 기록  (17:38)
```

## 최종 상태

- 테스트: 13개 전부 Green (`ProblemServiceTest` 6, `ProblemControllerTest` 6, `BackendApplicationTests` 1)
- jacoco 커버리지: 신규 클래스 전부 100%
- `personal` 원격까지 push 완료, `origin`(팀 레포)엔 아직 안 올림 (PR 시점에 올릴 예정)

## 다음 세션에서 이어서 할 것

`/security-review 5` 실행 → 통과하면 `/create-pr 5` (base: `feature/problem-identification`, Closes #5).

재개 방법: 새 세션에서 "`docs/features/problem-identification/session-log-2026-09-02.md`와 `progress-notes.md` 보고 이어서 `/security-review 5` 진행해줘"라고 요청.
