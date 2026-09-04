# attempt-recording PRD

## 1. 개요

사용자가 SWEA 문제 풀이를 마치고 익스텐션의 "완료" 버튼을 누르면 스톱워치가 멈추고, 이어서 결과(정답 / 오답 / 보류)를 선택하고 필요 시 메모를 남긴 뒤, 유형 태그를 골라 하나의 풀이 시도(Attempt)로 저장하는 기능. 저장된 Attempt는 이후 통계·오답노트의 기본 데이터가 된다.

이 기능의 백엔드 산출물은 `POST /api/attempts` — 결과·메모·태그·소요시간을 한 번에 저장하는 API다. 로그인 필수이며, `userId`는 요청 JWT에서 추출한다(PR #34 Spring Security).

## 2. 사용자 스토리

- SWEA에서 문제를 푸는 사용자로서, 문제를 다 풀고 "완료"를 누른 뒤 결과와 메모·태그를 기록하면 내 풀이 이력에 남기를 원한다. 그래야 나중에 어떤 유형이 약한지, 어떤 문제를 틀렸는지 돌아볼 수 있다.
- 오답일 때는 원인·풀이 아이디어를 메모로 남기고 싶고, 정답일 때는 선택적으로 회고를 남기고 싶다.
- 풀다가 막혀서 포기한 경우(보류)도 기록으로 남겨, 나중에 다시 도전할 문제로 관리하고 싶다.
- 로그인하지 않은 상태에서는 저장되지 않아야 한다 — 내 기록은 내 계정에 묶여야 한다.

## 3. 기술 결정

### ADR-1. 유형 태그는 프론트 문자열 id를 그대로 저장한다 (백엔드 Tag 테이블 없음)

**Context**

`POST /api/attempts`는 사용자가 선택한 유형 태그를 함께 저장한다. 코드베이스 현황:

- 백엔드에 `Tag` 엔티티·테이블·`GET /api/tags`가 없다.
- 프론트는 `apps/extension/lib/tag-catalog.ts`에 25종을 하드코딩하며 id는 kebab-case 문자열(`'bfs'`, `'greedy'`)이다. FE 결과 기록 화면은 이미 `selectedTagIds: string[]`로 이 문자열 id를 들고 있다.
- `docs/handoff/frontend-handoff.md §8-C`가 "tagId[]/name[] 중 무엇을 보낼지 팀 확정 필요, 확정 전 임의 구현 금지"라고 명시한다.

**Decision**

프론트가 보낸 문자열 태그 id 배열을 그대로 저장한다. 이 이슈에서 백엔드 `Tag` 엔티티·`GET /api/tags`는 만들지 않는다. `Attempt`는 `attempt_tag(attempt_id, tag_id VARCHAR)` 조인 테이블(`@ElementCollection`)로 태그 id 목록을 보관한다. 최소 1개 필수. 서버는 형식만 검사하고(빈 문자열/공백 거부), 카탈로그 실재 여부는 강제하지 않는다.

**Alternatives**

- **백엔드 Tag 테이블 + 숫자 id (안 B)**: `GET /api/tags`·25종 시딩·FE 문자열→숫자 id 마이그레이션까지 이 이슈가 떠안는다. `frontend-handoff.md §9`가 "Tag API Integration"을 별도 이슈로 권고했고 §8-C가 숫자 id 여부를 팀 미확정으로 남긴 상태라, 이 이슈가 그 결정을 선점하게 된다.
- **태그 표시명(name) 저장 (안 C)**: `docs/decisions/tag-catalog-single-source-of-truth.md`가 "표시명이 소리 없이 drift 되는 구조"를 명시적으로 경계했다. name을 원천 저장하면 카탈로그에서 표시명을 고칠 때 과거 기록과 어긋난다.

**Consequences**

- (+) 이 이슈 범위가 `POST /api/attempts` 하나로 유지된다. Tag 도메인 구축·마이그레이션 없음.
- (+) FE가 이미 들고 있는 `selectedTagIds`(문자열)를 변환 없이 그대로 전송 → FE 통합 이슈가 가벼워진다.
- (+) `problemId`를 자연키 문자열로 저장하는 problem-identification과 같은 철학.
- (-) FK 무결성이 없다. 오타·존재하지 않는 id도 저장될 수 있다.
- (-) 백엔드 `Tag` 테이블이 나중에 생기면 `attempt_tag` 문자열 id → 숫자 id 마이그레이션이 필요하다. 카탈로그 id 안정성이 전제.
- (-) 카테고리·표시명 관리가 계속 프론트에 남는다.

### ADR-2. result enum은 `CORRECT | WRONG | HOLD`

**Context**

result 값이 코드베이스 3곳에서 다르다.

- FE 결과 화면 구현(`entrypoints/content/screens`): `'CORRECT' | 'WRONG' | 'HOLD'` — 화면 전환 로직(`HOLD는 메모 화면을 건너뜀`)까지 이 값으로 구현·테스트됨.
- `packages/shared-types`(구버전): `CORRECT | WRONG | TIMEOUT | COMPILE_ERROR`.
- attempt-recording 스펙 초안·팀 논의: `GIVE_UP`.

`frontend-handoff.md §8-B`가 "API 연결 전 반드시 통일, HOLD/GIVE_UP/TIMEOUT 합의 없이 바꾸지 않는다"고 명시.

**Decision**

`CORRECT | WRONG | HOLD` 3값으로 확정. `HOLD` = 끝까지 풀지 못하고 보류(포기). 백엔드 `AttemptResult` enum과 API 계약이 이 값을 쓰고, `shared-types` `Attempt`도 재정의 시 이 값으로 맞춘다. FE가 이미 `HOLD`로 구현·테스트되어 있고 백엔드는 미구현이라, 구현된 쪽에 맞추는 것이 변경 비용이 가장 작다.

**Alternatives**

- **`GIVE_UP` (스펙 초안값)**: FE 구현 파일 다수(`screens/index`, `result-*` 컴포넌트, 테스트)에서 치환이 필요하고 백엔드는 얻는 게 없다.
- **`TIMEOUT` / `COMPILE_ERROR` 포함**: SWEA 채점 결과 자동 파싱(FR-007)이 있어야 의미 있는 값인데 그건 Out of Scope. 수동 3지선다에는 불필요.

**Consequences**

- (+) FE 구현 변경 없음. 백엔드 enum이 화면과 1:1.
- (+) `shared-types` `Attempt` 재정의 시 `HOLD`로 통일.
- (-) "보류"의 영문명이 `HOLD`로 굳는다. 나중에 `GIVE_UP` 선호 시 FE·BE·DB·계약 동시 변경 필요.
- (-) `frontend-handoff §8-B`가 요구한 "팀 합의"를 이 PRD가 대신하는 셈 — FE 담당·팀장 확인 필요.

### ADR-3. `Attempt`는 `problemId`를 문자열 컬럼으로 저장한다 (Problem FK 없음)

**Context**

`Attempt`는 어떤 문제의 풀이인지 알아야 한다. 요청 필드는 `problemId`(SWEA `contestProbId` 문자열)다. 백엔드에 `Problem` 테이블이 이미 있고(`problem_id` unique 문자열, `findByProblemId` 제공), problem-identification이 `Problem`을 upsert한다.

**Decision**

`Attempt.problemId`를 문자열 컬럼으로 그대로 저장한다. `Problem` 테이블로의 FK·JPA 연관관계를 두지 않는다. 저장 시 해당 `problemId`의 `Problem` 존재 여부도 검사하지 않는다.

**Alternatives**

- **`@ManyToOne Problem` FK 연관**: 참조 무결성과 `attempt.getProblem()` 탐색이 가능해지지만, "결과 기록"이 "문제 식별"에 실행 순서를 의존하게 되고(문제 식별 없이 완료를 누른 경우 처리 필요), problem-identification이 자연키를 문자열로 다루는 것과 결이 어긋난다. 통계에서 join이 필요해지면 그때 재검토.

**Consequences**

- (+) problem-identification과 동일하게 `problemId` 자연키를 문자열로 취급 — 일관성.
- (+) 결과 기록이 문제 식별의 구현/실행에 의존하지 않는다.
- (-) `Attempt` → `Problem`을 DB join으로 바로 못 간다. 통계에서 문제 메타데이터가 필요하면 `problemId`로 별도 조회.
- (-) 존재하지 않는 `problemId`의 Attempt도 저장 가능.

### ADR-4. 인증은 PR #34의 Spring Security를 그대로 사용한다

**Context**

`POST /api/attempts`는 로그인 필수이고 `userId`를 저장해야 한다. PR #34에서 Spring Security 전체 세팅(`SecurityConfig`, `JwtAuthenticationFilter`, `JwtAuthenticationEntryPoint`)이 도입됐고, `SecurityConfig`가 `/api/auth/**`·`/api/problems/**`·swagger 외 모든 요청을 `authenticated()`로 잡는다. `UserController.getMyInfo`가 `@AuthenticationPrincipal Long userId` 패턴을 쓴다.

**Decision**

이 이슈는 인증 코드를 새로 작성하지 않는다. `POST /api/attempts`는 `SecurityConfig` 기본 정책에 따라 자동으로 인증 필수가 되고, 토큰 없음/위조/만료 시 필터가 `401`(`{ code: "UNAUTHENTICATED", message }`)을 자동 반환한다. 컨트롤러는 `@AuthenticationPrincipal Long userId`로 사용자 id를 받고 Service에 `Long`으로만 전달한다.

**Alternatives**

- **컨트롤러에서 `JwtTokenProvider.getUserId()` 직접 호출**: PR #34에 Security 필터가 없던 시점의 대안. 지금은 중복.
- **커스텀 `@CurrentUser` 애너테이션 + ArgumentResolver**: PR #34가 표준 `@AuthenticationPrincipal`을 채택했다. 별도 애너테이션은 팀 내 두 방식 공존을 낳는다.

**Consequences**

- (+) 인증 관련 코드 0줄. PR #34 인프라 재사용.
- (+) 401 응답 형식이 팀 공통(`{ code, message }`)과 자동 일치.
- (-) PR #34가 develop에 머지돼야 이 이슈를 시작할 수 있다.
- (-) 컨트롤러 슬라이스 테스트에서 Security 필터가 적용되므로 인증 요청 흉내 셋업이 필요하다 (`spring-security-test`).

## 4. Out of Scope

- **유형 태그 조회·생성 백엔드** (`GET /api/tags`, `Tag` 엔티티, 25종 시딩) — 별도 이슈. 이 기능은 문자열 태그 id를 받기만 한다 (ADR-1).
- **커스텀 태그**(FR-011) 백엔드 처리 — FE `customTags` 상태는 있으나, 서버 저장 시 커스텀 태그를 일반 태그 id와 어떻게 구분·검증할지는 이 이슈에서 정하지 않는다. 우선 FE가 최종적으로 보내는 문자열 id 배열만 저장한다.
- **타이머/스톱워치 자체** (FR-002/003) — 백엔드 API 없음. `elapsedTime`은 값으로만 받는다.
- **Attempt 수정 API** (`PATCH /api/attempts/{id}`) — 결과·메모 변경 시나리오(원본 명세 7.3). MVP 이후 또는 대시보드.
- **Attempt 조회·목록·통계 API** — 대시보드 범위.
- **보류(HOLD) → 재도전으로 결과 갱신** — 새 Attempt 생성인지 기존 수정인지 미정, 범위 아님.
- **제출 결과 자동 파싱** (FR-007) — SWEA 연동 방법 미확보. `TIMEOUT`/`COMPILE_ERROR` 결과값도 여기 종속.
- **서버 측 중복 저장 멱등 처리** — 프론트 버튼 비활성화로 1차 방어. 필요 시 별도 이슈.
- **elapsedTime 비정상 값 플래그**(`flagged_abnormal_time`) — 원본 명세 7.2. 서버는 `0` 이상만 검증.
- **결과 미선택 상태의 서버 저장** — `result` 필수. 미완성은 FE가 `chrome.storage`에 보관.

## 5. 용어 정의

| 용어 | 정의 |
|---|---|
| Attempt(풀이 시도) | 사용자의 1회 문제 풀이 기록. `userId`, `problemId`, `elapsedTime`, `result`, `memo`, 태그 목록, 생성 시각을 포함 |
| userId | 풀이한 사용자의 식별자. 요청 JWT에서 추출해 서버가 저장. API 요청 바디에는 없음 |
| result | 풀이 결과. `CORRECT`(정답) / `WRONG`(오답) / `HOLD`(보류·포기) 중 하나 (ADR-2) |
| elapsedTime | "완료" 버튼 클릭까지 걸린 소요 시간(초). 프론트 스톱워치가 계산해 전달. 제한 시간이 아니라 경과 시간 |
| memo | 결과에 대한 자유 텍스트 메모. 선택 입력 |
| 유형 태그 | 문제 유형 분류(구현/DFS/그리디 등). 현재 프론트 `lib/tag-catalog.ts`에 25종 하드코딩(string id). 백엔드 `GET /api/tags`는 미구현 |
