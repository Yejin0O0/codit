# problem-identification 이슈 분해

FE/BE 역할 분리 워크플로우에 따라 2개 이슈로 나눈다. `api-contract.md` 확정 후 두 이슈는 병렬 진행 가능하다.

---

## Issue 1: [문제 식별] 문제 식별 저장 API (백엔드)

> api-contract 단계에서 팀 기존 스펙(담당: 지은, `POST /api/problems`)을 기준으로 재설계됨. 최초 설계(`ProblemIdentification` 로그 + JWT 인증)는 폐기하고, 사용자별 활동 기록은 향후 `Attempt` 이슈로 미룸. 자세한 내용은 `api-contract.md`, `prd.md` ADR-1 참고.

### 설명

익스텐션이 파싱한 `problemId`(SWEA `contestProbId`)와 `url`을 받아 `Problem` 테이블에 upsert하는 REST API를 구현한다. `Problem`은 특정 사용자에 속하지 않는 공개 마스터 데이터이므로 인증이 필요 없다.

신규 파일:
- `Problem` 엔티티
- `ProblemRepository`
- `ProblemService`
- `ProblemController`

### 완료 조건 (Acceptance Criteria)

- [ ] `problemId`로 요청 시 해당 `Problem`이 없으면 새로 생성하고 `201 Created`를 반환한다
- [ ] `problemId`로 요청 시 해당 `Problem`이 이미 있으면 기존 데이터를 `200 OK`로 반환한다 (중복 생성 안 됨)
- [ ] `problemId` 또는 `url`이 없으면 `400 Bad Request`(`{code: "INVALID_REQUEST", message}`)를 반환한다
- [ ] `Authorization` 헤더 없이도 정상 동작한다 (인증 불필요)

### 시나리오

**시나리오 A — 신규 문제 등록**

**Given** 요청한 `problemId`의 `Problem`이 존재하지 않는다
**When** `problemId`, `url`과 함께 `POST /api/problems`를 호출한다
**Then** 새 `Problem`이 생성되고 `201 Created`와 함께 `id`, `problemId`, `url`, `createdAt`을 반환한다

**시나리오 B — 기존 문제 조회**

**Given** 요청한 `problemId`의 `Problem`이 이미 존재한다
**When** 같은 `problemId`로 `POST /api/problems`를 다시 호출한다
**Then** 기존 `Problem`을 `200 OK`로 반환하고, 중복 생성되지 않는다

**시나리오 C — 필수값 누락**

**Given** `problemId` 또는 `url`이 없는 요청이다
**When** `POST /api/problems`를 호출한다
**Then** `400 Bad Request`와 `{code: "INVALID_REQUEST", message: "..."}`를 반환한다

---

## Issue 2: [문제 식별] 문제 식별 팝업 UI (프론트엔드)

> GitHub Issue #6으로 등록했다가 닫음 — FE 담당 팀원이 직접 기획/등록하기로 함. 아래 내용은 참고용으로 남겨둠.

### 설명

popup에서 현재 탭 URL의 `contestProbId`를 파싱하고, `chrome.storage`에 진행 중 Attempt가 있는지 확인한 뒤 Issue 1의 API를 호출한다. 결과에 따라 "식별됨" / "문제 페이지 아님" / "저장 실패(재시도 버튼)" 상태를 보여준다.

**의존: Issue 1** (`api-contract.md` 확정 후에는 mock 기준으로 병렬 진행 가능)

### 완료 조건 (Acceptance Criteria)

- [ ] `contestProbId`가 있는 페이지에서 아이콘 클릭 시 API를 호출해 저장하고 성공 상태를 보여준다
- [ ] `contestProbId`가 없는 페이지에서 아이콘 클릭 시 "문제 페이지가 아닙니다" 안내를 보여준다
- [ ] 같은 문제를 새로고침/재방문 시 `chrome.storage`에 진행 중 Attempt가 있으면 재사용하고 API를 다시 호출하지 않는다
- [ ] API 호출 실패 시 에러 메시지와 재시도 버튼을 보여준다

### 시나리오

**시나리오 A — 문제 페이지에서 식별 성공**

**Given** 사용자가 `contestProbId`가 포함된 SWEA 문제 페이지에 있다
**When** 익스텐션 아이콘을 클릭한다
**Then** `contestProbId`가 파싱되어 API로 전송되고, 팝업에 식별 성공 상태가 표시된다

**시나리오 B — 문제 페이지가 아닌 곳에서 클릭**

**Given** 사용자가 `contestProbId`가 없는 페이지에 있다
**When** 익스텐션 아이콘을 클릭한다
**Then** 팝업에 "문제 페이지가 아닙니다" 안내가 표시되고, API는 호출되지 않는다

**시나리오 C — 같은 문제 재방문/새로고침**

**Given** 사용자가 이미 식별된 문제 페이지에서 새로고침하거나 다시 방문했다
**When** 콘텐츠 스크립트가 재실행되어 `problem_id`를 다시 파싱한다
**Then** `chrome.storage`에서 진행 중 Attempt를 확인해 재사용하고, API를 다시 호출하지 않는다

**시나리오 D — 저장 실패 시 재시도**

**Given** 식별 저장 API 호출이 실패했다 (네트워크 오류, 서버 오류, JWT 만료 등)
**When** 팝업이 응답을 받는다
**Then** 에러 메시지와 재시도 버튼이 표시된다
