# attempt-recording 이슈 분해

FE/BE 역할 분리 워크플로우에 따라 2개 이슈로 나눈다. BE 저장 API(Issue 1)가 먼저,
FE 통합(Issue 2)이 그 계약을 기준으로 진행한다.

---

## Issue 1: [결과 기록] 풀이 결과 저장 API (백엔드) — GitHub #42

### 설명

문제 풀이를 마친 사용자가 결과(정답/오답/보류)·메모·유형 태그·소요 시간을 하나의
`Attempt`로 저장하는 REST API를 구현한다. 로그인 필수이며 `userId`는 요청 JWT에서
추출한다(`@AuthenticationPrincipal`, PR #34 Spring Security). 태그는 이슈 #40의
`tag` 테이블 숫자 id로 참조한다(`@ManyToMany`).

신규 파일:
- `domain/Attempt.java`, `domain/AttemptResult.java` (enum: `CORRECT` / `WRONG` / `HOLD`)
- `repository/AttemptRepository.java`
- `service/AttemptService.java` (+ 필요 시 결과 DTO)
- `controller/AttemptController.java`
- `controller/dto/CreateAttemptRequest.java`, `controller/dto/AttemptResponse.java`

### 완료 조건 (Acceptance Criteria)

- [ ] 로그인 사용자가 `{ problemId, elapsedTime, result, tagIds, memo? }`로 `POST /api/attempts` 요청 시 `Attempt`가 생성되고 `201 Created`와 저장 결과(`id`, `problemId`, `elapsedTime`, `result`, `tags`, `memo`, `createdAt`)를 반환한다
- [ ] `userId`는 요청 바디가 아니라 JWT에서 추출해 저장한다
- [ ] `result`가 `CORRECT` / `WRONG` / `HOLD` 외의 값이거나 누락이면 `400`(`{ code, message }`)을 반환한다
- [ ] `tagIds`가 비어 있으면(0개) `400`을 반환한다
- [ ] `tagIds`에 `tag` 테이블에 존재하지 않는 id가 하나라도 있으면 `400`을 반환하고 `Attempt`를 생성하지 않는다 (부분 저장 없음)
- [ ] `memo`가 없어도(`null`) 저장된다
- [ ] `elapsedTime`이 음수면 `400`을 반환한다
- [ ] 유효한 인증 토큰이 없으면 `401`을 반환한다 (`SecurityConfig` 기본 정책)

### 시나리오

**시나리오 A — 정답 저장 (메모 없음)**

**Given** 로그인한 사용자가 `problemId`, `elapsedTime`, `result=CORRECT`, `tagIds=[4]`, `memo=null`로 요청한다
**When** `POST /api/attempts`를 호출한다
**Then** `Attempt`가 생성되고 `201`과 함께 `userId`(JWT), `result=CORRECT`, `memo=null`, 태그 정보가 담긴 저장 결과를 반환한다

**시나리오 B — 오답 저장 (메모 있음)**

**Given** 로그인한 사용자가 `result=WRONG`, `tagIds=[6]`, `memo="그리디로 접근했는데 반례 존재"`로 요청한다
**When** `POST /api/attempts`를 호출한다
**Then** `Attempt`가 생성되고 `201`과 함께 `memo`에 작성 내용이 담긴 결과를 반환한다

**시나리오 C — 보류 저장**

**Given** 로그인한 사용자가 `result=HOLD`, `tagIds=[16]`, `memo=null`로 요청한다
**When** `POST /api/attempts`를 호출한다
**Then** `Attempt`가 생성되고 `201`과 함께 `result=HOLD`인 결과를 반환한다

**시나리오 D — 존재하지 않는 태그 id**

**Given** `tagIds`에 `tag` 테이블에 없는 id가 포함되어 있다
**When** `POST /api/attempts`를 호출한다
**Then** `400 Bad Request`를 반환하고 `Attempt`가 생성되지 않는다

**시나리오 E — result 누락/오류**

**Given** `result`가 없거나 `CORRECT/WRONG/HOLD` 외의 값이다
**When** `POST /api/attempts`를 호출한다
**Then** `400 Bad Request`와 `{ code, message }`를 반환한다

**시나리오 F — 태그 미선택**

**Given** `tagIds`가 빈 배열이다
**When** `POST /api/attempts`를 호출한다
**Then** `400 Bad Request`를 반환한다

**시나리오 G — 미인증 요청**

**Given** 유효한 JWT가 없는 요청이다
**When** `POST /api/attempts`를 호출한다
**Then** `401 Unauthorized`를 반환한다

### 의존

- **이슈 #40 (유형 태그 조회/등록 API)** — `tag` 테이블·`TagRepository`가 develop에 있어야 `@ManyToMany`·id 검증이 가능하다. api-contract는 mock 기준으로 먼저 진행 가능.
- PR #34 (Spring Security) — 이미 develop 반영됨.

### shared-types 변경

- `packages/shared-types/src/index.ts`의 `Attempt` interface를 백엔드 계약에 맞게 재정의 (현재는 `language`·`submittedAt` 등 구버전). `result`는 `CORRECT | WRONG | HOLD`.

---

## Issue 2: [결과 기록] 완료 → 결과·메모·태그 입력 → 저장 (프론트엔드)

> FE 담당(동환/예진)이 직접 기획·등록한다. 아래는 참고용 스케치.

### 설명

"완료" 버튼으로 스톱워치를 멈춘 뒤 결과 선택 → (오답/정답 메모) → 태그 선택 →
"저장"까지의 흐름을 완성하고, 최종적으로 `POST /api/attempts`에 연결한다. 결과 화면·
메모 화면·태그 선택 화면은 이미 구현되어 있으므로(`entrypoints/content/screens`),
주로 API 연동과 미완성 Attempt의 `chrome.storage` 보관/복원이 대상이다.

의존: **Issue 1** (`api-contract.md` 확정 후 mock 기준 병렬 가능), 이슈 #40 FE 연동
(문자열 카탈로그 → 서버 숫자 태그 id).

### 완료 조건 (참고)

- [ ] "완료" → 결과 선택 → (메모) → 태그 선택 → "저장" 흐름이 이어진다
- [ ] 저장 시 `tagIds`는 서버 숫자 id로 전송한다 (문자열 카탈로그 id 아님)
- [ ] 결과 미선택 상태로 이탈 시 `chrome.storage`에 보관하고 다음 팝업에서 이어간다
- [ ] `POST /api/attempts` 실패 시 입력값을 유지한 채 에러·재시도를 보여준다
- [ ] 인증 토큰을 `Authorization: Bearer` 헤더로 전송한다
