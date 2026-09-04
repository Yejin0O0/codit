# attempt-recording 요구사항

## 개요

사용자가 SWEA 문제 풀이를 마치고 익스텐션의 "완료" 버튼을 누르면 스톱워치가 멈추고, 이어서 **결과(정답 / 오답 / 보류)** 를 선택하고 필요 시 **메모**를 남긴 뒤, **유형 태그**를 골라 하나의 풀이 시도(Attempt)로 저장하는 기능. 저장된 Attempt는 이후 통계·오답노트의 기본 데이터가 된다.

- **Primary User**: SWEA에서 문제를 푸는 사용자 본인 (로그인 상태)
- **선행 기능**:
  - 문제 식별(problem-identification) — `problemId`(SWEA `contestProbId`) 확보
  - 스톱워치(timer / timer-persistence) — 문제를 푸는 데 걸린 **소요 시간(`elapsedTime`, 초)** 을 측정. 제한 시간이 아니라 경과 시간 측정이며, 백엔드 API 없이 프론트 로직으로만 동작하고 저장 시 값으로만 실려 온다
  - 유형 태그(tag) — `GET /api/tags`로 태그 목록 조회, 선택한 태그의 `id` 확보
  - 로그인(auth) — 요청의 JWT에서 `userId` 확보 (아래 "확정된 기술 방향" 참고)
- **이 기능의 백엔드 산출물**: `POST /api/attempts` — 결과·메모·태그·소요시간을 한 번에 저장하는 API

## 범위

기능 전체는 FE(완료 버튼 → 결과 선택 UI → 메모 입력 → 태그 선택 → 저장)와 BE(`POST /api/attempts`)로 나뉜다. 이슈 분해는 `issues.md` 참고. 본 문서는 두 파트를 모두 기술하되, 상세 흐름은 BE 저장 관점을 중심으로 정리한다.

## 사용자 시나리오

**시나리오 A — 정답으로 기록 (메모 생략)**

**Given** 로그인한 사용자가 문제를 풀고 "완료" 버튼을 눌러 스톱워치가 멈췄다
**When** 결과 선택 UI에서 "정답"을 선택하고, 메모 없이 유형 태그("그리디")를 고른 뒤 저장한다
**Then** `userId`(JWT에서 추출), `result=CORRECT`, `memo=null`, 선택한 태그 id, `elapsedTime`, `problemId`가 담긴 Attempt가 생성되고 `201 Created`로 저장 결과를 반환한다

**시나리오 B — 오답으로 기록 (메모 작성)**

**Given** 스톱워치가 멈췄다
**When** 결과 선택 UI에서 "오답"을 선택하면 메모 입력창이 자동으로 펼쳐지고, 사용자가 "그리디로 접근했는데 반례 존재, DP로 다시 풀어야 함" 이라고 작성한 뒤 태그("DFS")를 골라 저장한다
**Then** `result=WRONG`, `memo`에 작성 내용, 태그 id가 담긴 Attempt가 생성되고 `201 Created`를 반환한다

**시나리오 C — 보류(포기)로 기록**

**Given** 사용자가 문제를 풀다 막혀서 정답 제출 없이 "완료" 버튼을 눌렀다
**When** 결과 선택 UI에서 "보류"를 선택한다 (메모 입력창은 뜨지 않음)
**Then** 태그를 고르고 저장하면 `result=GIVE_UP`, `memo=null`인 Attempt가 생성되고 `201 Created`를 반환한다

**시나리오 D — 필수값이 빠진 요청**

**Given** `result`가 없거나 허용되지 않은 값이거나, 태그가 하나도 선택되지 않은 요청이다
**When** `POST /api/attempts`를 호출한다
**Then** `400 Bad Request`와 `{ code, message }` 형식의 에러를 반환하고 Attempt를 생성하지 않는다

**시나리오 E — 인증되지 않은 요청**

**Given** 유효한 JWT가 없는 요청이다
**When** `POST /api/attempts`를 호출한다
**Then** `401 Unauthorized`를 반환하고 Attempt를 생성하지 않는다

## 경계 조건 및 엣지 케이스

- **결과 미선택 이탈**: 완료 버튼은 눌렀지만 결과를 고르지 않고 벗어난 경우 — `result`가 필수이므로 저장 API는 애초에 호출되지 않고 Attempt도 생성되지 않는다. 미완성 상태는 프론트가 `chrome.storage`에 "결과 대기 중"으로 보관했다가 다음 팝업에서 다시 이어가게 한다 (서버는 완성본만 받음). 대시보드에서의 재선택 UX는 이번 범위 밖 (원본 명세 [확인 필요] 15번)
- **메모는 선택 입력**: 오답이든 정답이든 메모를 작성하지 않아도 저장할 수 있다 (`memo=null` 허용). 보류는 기본적으로 메모 없이 진행
- **태그는 1개 이상 필수**: 태그 없이 저장 시도 시 `400`. 유형 없는 기록은 통계·회고 가치가 낮음
- **존재하지 않는 태그 id**: `tagIds`에 DB에 없는 id가 포함되면 `400`으로 거부한다 (부분 저장하지 않음)
- **elapsedTime**: 프론트 스톱워치가 계산해 전달한 값. 백엔드는 `0` 이상인지 정도만 검증한다. 시스템 시계 조작·절전 등으로 인한 비정상 값(음수, 과대값) 플래그 처리는 이번 범위 밖 (원본 명세 7.2)
- **결과 변경 후 재저장**: "정답 메모 작성 후 결과를 오답으로 변경" 같은 수정 시나리오(원본 명세 7.3)는 생성 전용 API로는 다룰 수 없다. 수정 API는 Out of Scope
- **중복 저장**: "저장/확정" 버튼 연타 시 Attempt가 중복 생성될 수 있다 — 프론트에서 버튼 비활성화로 1차 방어. 서버 측 멱등 처리는 이번 범위 밖 (필요 시 별도 이슈)

## 에러 처리 방식

- `POST /api/attempts` 실패(400 / 401 / 네트워크 / 서버 오류) 시, 프론트는 입력한 결과·메모·태그를 유지한 채 에러 메시지와 재시도를 제공한다 (problem-identification의 ADR-3과 동일한 방향 — 저장 실패를 사용자가 인지하지 못한 채 데이터가 유실되면 안 됨)
- 에러 응답 형식은 팀 공통 `{ code, message }`를 따른다 (problem-identification `api-contract.md` 기준)

## 확정된 기술 방향

1. **인증 — 저장 정책**
   - Attempt는 `userId`를 저장한다 (누구의 풀이 기록인지가 이 서비스의 핵심). 필드명은 camelCase `userId`.
   - **로그인 필수** — 비로그인 요청은 `401`. `deviceId` 기반 비로그인 기록은 하지 않는다 (SSAFY 특성상 사용하는 PC가 자주 바뀌어 무의미).
   - `userId`는 API 요청 바디에 없다 — 서버가 요청의 JWT에서 추출해 저장한다.

2. **인증 — 구현 방식** (로그인 PR #34에서 Spring Security 도입 완료)
   - PR #34에 **Spring Security 전체 세팅**이 들어와 있다: `SecurityConfig`(엔드포인트별 인증 정책), `JwtAuthenticationFilter`(모든 요청의 Bearer 토큰 검증 → 성공 시 principal = `Long userId`), `JwtAuthenticationEntryPoint`(인증 실패 시 `401` + `{ code: "UNAUTHENTICATED", message }`).
   - **시작 조건**: PR #34가 develop에 머지된 후 (그래야 Security 설정·필터를 사용 가능).
   - **`/api/attempts` 인증**: `SecurityConfig`가 `/api/auth/**`·`/api/problems/**`·swagger 외 모든 요청을 `authenticated()`로 잡으므로, `POST /api/attempts`는 **자동으로 인증 필수**가 된다. 토큰 없음/위조/만료 → 컨트롤러 도달 전에 필터가 `401`을 자동 반환. 이 이슈에서 별도 토큰 검증 코드를 작성하지 않는다.
   - **컨트롤러에서 userId 받기**: `@AuthenticationPrincipal Long userId` (Spring 표준, `UserController.getMyInfo`와 동일 패턴). 커스텀 `@CurrentUser` 애너테이션은 사용하지 않는다.
   - **경계 격리**: Service 계층은 `userId`를 `Long` 파라미터로만 받는다 (인증을 전혀 모름).
   - **테스트**: 컨트롤러 슬라이스 테스트에서 Spring Security 필터가 적용되므로 인증된 요청을 흉내내야 한다 (`spring-security-test`의 요청 후처리 등). PR #34의 `UserControllerTest`·`JwtAuthenticationFilterTest`가 참고 패턴.

3. **tag 저장 방식** — `tagIds`(태그 id 배열)로 확정 (팀 논의 완료). Attempt ↔ Tag 다대다 조인 테이블.

## [확인 필요] — /my-prd 단계에서 결정

- **Problem과의 연결**: `problemId`(SWEA `contestProbId` 문자열)를 Attempt에 그대로 저장할지, `Problem` 테이블 FK로 연결할지. Problem 테이블은 이미 존재(problem-identification). API 계약상 요청 필드는 `problemId` 문자열.

## 용어 정의

| 용어 | 정의 |
|---|---|
| Attempt(풀이 시도) | 사용자의 1회 문제 풀이 기록. `userId`, `problemId`, `elapsedTime`, `result`, `memo`, 태그 목록, 생성 시각을 포함. 최종 저장 시점에 생성됨 (problem-identification에서 말하는 "진행 중 Attempt"와 달리 결과가 확정된 기록) |
| userId | 풀이한 사용자의 식별자. 요청 JWT에서 추출해 서버가 저장. API 요청 바디에는 없음 |
| result | 풀이 결과. `CORRECT`(정답) / `WRONG`(오답) / `GIVE_UP`(보류·포기) 중 하나 |
| 보류(GIVE_UP) | 정답/오답 판정이 안 나온 상태가 아니라, 끝까지 풀지 못하고 **포기**하고 완료 처리한 상태 |
| elapsedTime | "완료" 버튼 클릭까지 걸린 소요 시간(초). 프론트 스톱워치가 계산해 전달. 제한 시간이 아니라 경과 시간 |
| memo | 결과에 대한 자유 텍스트 메모. 오답이면 원인/풀이 아이디어, 정답이면 선택적 회고. 선택 입력 |
| tagIds | 사용자가 선택한 유형 태그의 id 배열. `GET /api/tags` 응답의 `id` 값. 1개 이상 |
