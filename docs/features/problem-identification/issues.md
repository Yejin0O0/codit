# problem-identification 이슈 분해

FE/BE 역할 분리 워크플로우에 따라 2개 이슈로 나눈다. `api-contract.md` 확정 후 두 이슈는 병렬 진행 가능하다.

---

## Issue 1: [문제 식별] 문제 식별 저장 API (백엔드)

### 설명

익스텐션이 파싱한 `contestProbId`를 받아 `Problem`(마스터, upsert) + `ProblemIdentification`(로그) 테이블에 저장하는 REST API를 구현한다. 인증은 아직 완료되지 않았으므로(#2, #3, #4 의존), `CurrentUserProvider` 인터페이스와 더미 구현체로 JWT `sub` 클레임에서 user_id를 추출한다.

신규 파일:
- `Problem`, `ProblemIdentification` 엔티티
- `ProblemRepository`, `ProblemIdentificationRepository`
- `ProblemIdentificationService`
- `ProblemIdentificationController`
- `CurrentUserProvider` 인터페이스, 더미 구현체

### 완료 조건 (Acceptance Criteria)

- [ ] `contestProbId`로 요청하면 `Problem`이 없으면 생성되고, `ProblemIdentification` 로그가 저장된다
- [ ] 이미 존재하는 `contestProbId`로 재요청해도 `Problem`은 중복 생성되지 않는다
- [ ] `Authorization: Bearer <JWT>`의 `sub` 클레임에서 user_id(Long)를 추출해 `ProblemIdentification`에 함께 저장한다
- [ ] `Authorization` 헤더가 없거나 형식이 잘못되면 `401 UNAUTHORIZED`(`{code, message}`)를 반환한다

### 시나리오

**시나리오 A — 신규 문제 식별 저장**

**Given** 유효한 JWT를 가진 사용자이고, `Problem` 테이블에 해당 `contestProbId`가 없다
**When** `contestProbId`와 함께 식별 저장 API를 호출한다
**Then** 새 `Problem`이 생성되고, `ProblemIdentification` 로그가 저장되며 성공 응답을 받는다

**시나리오 B — 이미 존재하는 문제 재식별**

**Given** 해당 `contestProbId`의 `Problem`이 이미 존재한다
**When** 같은 `contestProbId`로 식별 저장 API를 다시 호출한다
**Then** `Problem`은 중복 생성되지 않고, `ProblemIdentification` 로그만 새로 추가된다

**시나리오 C — 인증 헤더 없음**

**Given** `Authorization` 헤더가 없는 요청이다
**When** 식별 저장 API를 호출한다
**Then** `401 UNAUTHORIZED`와 `{code: "UNAUTHORIZED", message: "..."}` 응답을 받는다

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
