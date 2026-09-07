# Timer Session Continuity PRD

> 요구사항 상세는 [`spec-fixed.md`](./spec-fixed.md) 를 정본으로 한다. 이 문서는
> 요구사항 요약 + 기술 결정(ADR) + 범위를 하나로 모은 단일 기준점이다.

**Status**: 단계 2(PRD + ADR) 승인 완료. 다음 = UI Design (`fe-ui-design`) → UI
Approval → 단계 3(Issue Breakdown).

**확정 목표 — 3가지 Timer 연속성**:
1. 새로고침 후 Timer Session continuity
2. SWEA 문제 페이지 간(`problemDetail.do` ↔ `solvingProblem.do` 등) Timer continuity
3. Widget expanded ↔ collapsed 간 Timer continuity

`TimerSession` 과 `WidgetViewState` 는 별도 책임으로 유지한다(ADR-3, ADR-5).

## 1. 개요

SWEA 문제 풀이 중 새로고침·페이지 이동·위젯 접기로 Codit 풀이 타이머가 끊기는 문제를
해결한다. 목표는 **세 가지 Timer 연속성**이다.

1. 새로고침 후 Timer Session continuity
2. `problemDetail.do` ↔ `solvingProblem.do` 등 SWEA 문제 페이지 간 continuity
3. Widget expanded ↔ collapsed 간 Timer continuity

- 저장 대상: `TimerSession = { problemId, startedAt, status, stoppedAt }` — 최소 정보만.
- 결과/메모/태그/화면·위젯 접힘 여부는 저장하지 않는다.
- 백엔드 불필요. 새로고침·탭 이동·재진입 복원, 브라우저 종료 시 삭제.
- Session Identity = `contestProbId` (URL 아님). 획득: URL `?contestProbId=` → 없으면
  DOM `#contestProbId` / `input[name="contestProbId"]` → 둘 다 없으면 Widget 미표시.
- **책임 분리**: `TimerSession`(저장 대상) 과 `WidgetViewState(expanded | collapsed)`
  (화면 표현) 는 분리한다. `WidgetViewState` 는 storage 에 넣지 않으며 collapsed
  상태는 새로고침 후 복원하지 않는다(ADR-5). Widget 접힘/펼침 선호 저장은 Out of Scope.

## 2. 사용자 스토리

- (A) 문제를 풀다 새로고침해도 타이머가 이어진다.
- (B) "완료" 후 새로고침해도 측정된 풀이 시간이 유지된다(결과/메모/태그는 재입력).
- (C) 다른 문제로 가면 새 타이머가 시작되고, 이전 문제 세션은 보존된다.
- (D) `problemDetail.do` → `solvingProblem.do` 처럼 같은 문제의 다른 페이지로 가도
  동일 세션이 유지된다.
- (E) 같은 문제를 여러 탭/창에서 열면 같은 세션을 공유한다.
- (F) 위젯을 접어도 running 타이머는 접힌 뷰에서 계속 증가하고, stopped 타이머는 고정된
  최종 시간을 보여준다. 다시 펴면 접기 직전 화면·입력 상태로 돌아간다.

전체 시나리오·엣지 케이스는 `spec-fixed.md` 참조.

## 3. 기술 결정

**선택안: Option 2 — 전용 content 모듈 + `mount.tsx` 오케스트레이션.**
문제 식별 / Timer Session persistence / 시간 계산 / Widget 표현 상태 책임을 계층으로
분리하고, 기존 `useTimer`·`parseContestProbId`·`mountCoditWidget` 변경을 최소화한다.

- ADR-1 — 문제 식별 책임 위치와 hidden input 지연 등장 대응
- ADR-2 — Timer Session 저장소 = `chrome.storage.session`
- ADR-3 — persistence 책임 분리 (SessionStore / Timer Session 규칙 / useTimer)
- ADR-4 — 다중 탭 세션 공유
- ADR-5 — Widget View State 와 Timer Session 분리

### ADR-1. 문제 식별 책임 위치와 hidden input 지연 등장 대응

**Context**

Session Identity 는 `contestProbId` 다. `problemDetail.do` / `solvingClub/.../problemView.do`
는 URL `?contestProbId=` 로 얻지만 `solvingProblem.do` 는 URL에 없고 DOM
`input#contestProbId` (hidden) 에만 있다 — 오픈소스 SWEA 익스텐션 3종(BaekjoonHub,
SolveSync, algo-plus)의 실제 구현과 SolveSync의 날짜 기입 현장 관찰로 교차 확인된 값이며,
로그인 상태 실측은 `spec-fixed.md` "구현 전 검증 항목" 으로 남겨 둔다. 또한 hidden
input 은 content script 주입 시점에 아직 없을 수 있다. 식별·관찰 로직을 `mount.tsx`
안에 모두 넣으면 mount 함수가 비대해지고 `mount.test.tsx` 가 관찰 로직까지 떠안는다.

`spec-fixed.md` 는 "동일한 `solvingProblem.do` URL 에서도 `contestProbId` 값이 바뀌면
다른 문제로 판단한다" 를 요구한다. 따라서 "최초 식별 후 문제 identity 변경을 어떻게
인지하는가" 의 책임과 lifecycle 을 명확히 해야 한다.

**설계 전제 — 문제 전환 = 새 document load = content script 재실행**

SWEA 문제 풀이 화면은 SPA 라우트 전환이 아니라 **문제마다 새 document 를 load** 한다.
근거:

- SWEA 는 서버 렌더링이며, `problemDetail.do` 의 "문제 풀기" 는 POST 로 **별도 window
  를 새로 연다**(SPA route 전환 아님). — SolveSync `docs/platforms/SWEA.md`
- 다른 문제로 바꾸려면 풀이 window 를 **닫고 새로 연다**. SolveSync 현장 관찰
  (2026-08-25): "1206 풀이 window 를 닫고 같은 URL 에서 1859 window 를 연 뒤" 라고
  기술 — 같은 live document 에서 문제가 A→B 로 바뀌는 것이 아니라 document 자체가
  교체된다.
- BaekjoonHub · algo-plus 도 `solvingProblem.do` 진입마다 content script 가
  `document_end` 에서 fresh 실행되는 것을 전제로 동작한다.

즉 `solvingProblem.do` 의 "같은 URL" 은 **문제마다 URL 문자열이 동일**하다는 뜻이지,
같은 살아있는 document 가 재사용된다는 뜻이 아니다. 문제를 바꾸면 content script 의
`main()` → `mountCoditWidget` 이 처음부터 다시 돈다.

**Decision**

- 식별 책임을 `content/problem/` 모듈에 모은다.
  - 기존 `parseContestProbId(href)` (URL 파서, 순수, 테스트 7개) 는 그대로 유지·재사용.
  - 그 위에 `resolveProblemId(doc, href)` 를 둔다: `parseContestProbId(href)` →
    없으면 `doc` 에서 `#contestProbId` 및 `input[name="contestProbId"]` 의 첫
    비어있지 않은 `value` → 없으면 `null`.
- `mount.tsx` 는 `resolveProblemId` 로 즉시 시도하고, 얻으면 mount 한다.
- 즉시 못 얻으면 **DOM 변화를 관찰**한다(`MutationObserver`). `resolveProblemId` 가
  값을 돌려주는 순간 위젯을 mount 하고 **observer 를 정리(disconnect)** 한다.
  - **임의의 고정 timeout 을 요구사항에 두지 않는다.** 관찰만 하며, 식별자가 끝내
    나타나지 않으면 위젯이 표시되지 않는 상태로 남는다(SWEA 사용 방해 0).
  - observer 는 최소한 페이지 unload(`pagehide`) 시, 그리고 식별 성공 시 disconnect
    한다. 그 외 관찰 대상 노드 범위·give-up 조건·과도 관찰 방지의 구체 구현은 TDD
    단계에서 확정한다.
- **문제 identity 변경 인지 = content script 재실행 경계가 담당한다.** observer 의
  책임은 "이번 document load 에서의 최초 식별" 로 한정하며, 이후의 identity 변경 감지는
  observer 가 소유하지 않는다.
  - 문제를 바꾸면 새 document load → content script 재실행 → `mountCoditWidget` 이
    새 `contestProbId` 로 다시 돌아 `SessionStore` 를 통해 그 문제의 세션을 복원/생성
    한다(ADR-3). 새 document 에는 `#codit-root` 가 없으므로 중복 mount 가드에 걸리지
    않는다.
  - 이전 문제의 Timer Session 은 삭제되지 않고 보존된다(`spec-fixed.md` 시나리오 C).
- `mountCoditWidget` 의 시그니처와 root/Shadow DOM/React render 구조는 유지한다.
  내부의 `parseContestProbId` 직접 호출부만 `resolveProblemId` + 관찰 로직으로 교체한다.

**Alternatives**

- **`mount.tsx` 에 식별·관찰을 인라인** — 거부. mount 함수가 커지고 테스트가
  관찰 로직까지 포함하게 된다. `content/problem/` 이라는 모듈 경계가 이미 있는데
  활용하지 않는 선택.
- **고정 timeout 폴링(`waitForProblemId(10_000)` 등)** — 거부. 임의 상수를 스펙에
  박게 되고, SWEA 렌더가 그보다 느린 드문 경우 위젯이 영영 안 뜬다. 사용자가 고정
  timeout 요구사항 추가를 명시적으로 금지.
- **`chrome.scripting` 로 나중에 재주입** — 거부. `scripting` 권한 확대·복잡도 증가.
  SWEA는 서버 렌더이고 `solvingProblem.do` 도 새 document load 라 매 진입마다 content
  script 가 fresh 실행되므로 불필요.
- **background 가 `webNavigation` 으로 SWEA 탭 감지 후 식별 지시** — 거부. background
  계층 확대. 식별은 DOM 접근이 필요해 어차피 content 몫.
- **observer 를 disconnect 하지 않고 살려 두어 same-document identity 변경까지 감지** —
  거부. 위 "설계 전제" 에 따라 문제 전환은 새 document load 이므로 불필요한 상시
  observer 비용이다. 만약 SWEA 가 같은 live document 에서 문제를 바꾸는 방식(SPA)으로
  바뀌면 이 전제가 깨지며, 그때는 identity 변경 watcher 를 별도 결정으로 추가한다
  (Out of Scope 의 "same-document identity 변경 감지" 참조).

**Consequences**

- (+) 식별 로직이 한 모듈에 모여 단위 테스트가 쉽다(`resolveProblemId` 는 `Document`
  주입으로 순수 테스트). `parseContestProbId` 기존 7개 테스트 그대로 유효.
- (+) `mountCoditWidget` 변경 폭이 작다.
- (−) **DOM selector 의존성**: `#contestProbId` / `input[name="contestProbId"]` 는
  SWEA 마크업이므로 SWEA가 바꾸면 식별이 깨진다. 완화 — id·name 두 셀렉터 모두 시도,
  실패 시 "위젯 미표시"(조용한 degradation), `spec-fixed.md` 의 구현 전 검증 항목으로
  최초 1회 실측.
- (−) **식별이 끝내 실패하는 페이지의 observer 처리**: 고정 timeout 이 없으므로
  "언제 최종 실패인지" 명시적 신호가 없고, `pagehide` 전까지 observer 가 계속 돌 수
  있다. 위젯이 표시되지 않을 뿐 SWEA 사용에는 영향 0. 관찰 범위 최소화·give-up
  조건은 TDD 에서 확정한다.
- (−) **문제 identity 변경 인지가 "새 document load" 전제에 의존한다.** SWEA 가 향후
  같은 live document 에서 문제를 전환하는 SPA 방식으로 바뀌면, 위젯이 이전 문제의
  세션을 계속 표시하는 gap 이 생긴다. 그 시점에 identity 변경 watcher 를 추가하는
  후속 결정이 필요하다(현재 3종 오픈소스 구현·현장 관찰상 SWEA 는 문제마다 새
  document 를 load 한다).

### ADR-2. Timer Session 저장소 = `chrome.storage.session`

**Context**

`spec-fixed.md`: 새로고침·탭 이동·재진입 복원, 브라우저 완전 종료 시 삭제(세션 범위).
저장 대상은 `{ problemId, startedAt, status, stoppedAt }` 로 작다. 탭 간 공유 필요
(시나리오 E). 현재 익스텐션은 `chrome.storage` 를 전혀 쓰지 않고, 프로덕션 manifest
permission 이 0개다.

**Decision**

- **`chrome.storage.session`** 을 사용한다. extension-global(모든 탭 공유), in-memory,
  브라우저 재시작 및 확장 disable / reload / update 시 clear — spec 의 "세션 범위" 와
  일치한다.
- **Session Identity 와 storage key 는 구분한다**:
  - Problem / Session identity = `contestProbId` (문제를 가리키는 값).
  - 실제 chrome.storage key = `timer-session:<contestProbId>` (prefix `timer-session:`
    는 이 단계에서 확정).
  - value = `{ version, problemId, startedAt, status, stoppedAt }`.
    (`problemId` 필드 = 그 `contestProbId` 값.)
- manifest 에 `"storage"` permission 을 추가한다(`wxt.config.ts` 의 manifest 키).
- content script(비신뢰 컨텍스트)에서 `chrome.storage.session` 은 **기본적으로 노출되지
  않으므로** 신뢰 컨텍스트가
  `chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' })`
  를 호출해야 한다.
  - **background 가 이 access level 초기화 책임을 가진다.** 이것이 background 의 유일한
    추가 책임이며, **background 는 Timer Session 을 소유하지 않고 content ↔ background
    message protocol 도 도입하지 않는다.**
  - 호출은 **idempotent 하게** 설계한다(여러 번 불려도 안전).
  - content script 의 최초 `SessionStore` 접근 시점에 실제로 접근 가능한지는
    **구현/통합 테스트에서 검증**한다.
  - `setAccessLevel` 의 구체적 호출 위치(SW 최상위 / `onInstalled` / `onStartup` 등
    조합)는 **TDD 단계에서 Chrome·WXT 실제 동작을 확인한 뒤 확정**한다. PRD 는 어느
    한 조합을 요구사항으로 고정하지 않는다.
  - access level 설정이 아직 안 됐거나 실패한 상태에서 접근하면 `SessionStore` 가
    "세션 없음" 으로 격리(ADR-3)한다 — 그 경우 그 한 번 타이머가 새로 시작될 뿐
    **SWEA 사용은 방해하지 않는다**(기존 fail-soft 정책 유지).
- `chrome.storage.local` + "브라우저 세션 마커" fallback 은 **구현하지 않는다.**
  브라우저 재시작 복원은 Out of Scope 이며 후속 feature 로 남긴다.

**Alternatives**

- **`chrome.storage.local` + 브라우저 세션 마커**(SW 시작 시 uuid 저장, 마커 불일치
  세션 폐기) — 거부. local 은 content 직접 접근이 가능(access level 불필요)하지만,
  "세션 범위" 를 흉내내려고 마커 생성·비교·stale 정리 로직이 붙는다.
  `chrome.storage.session` 이 그 의미를 네이티브로 제공하는데 재구현하는 것.
  사용자가 이 fallback 미구현을 명시.
- **`sessionStorage`(웹 API)** — 거부. 권한은 불필요하지만 **per-tab** 이라 시나리오
  E(탭 공유)·D(새 창)가 깨진다. SWEA 페이지 origin 과 공유되어 SWEA JS 와 충돌 여지.
- **`chrome.storage.local` 단독 + 시간 만료** — 거부. "브라우저 종료 시 삭제" 를 못
  지키고 만료 상수를 스펙에 박게 된다. 이는 후속 feature 의 모델.
- **IndexedDB** — 거부. 데이터가 문제당 수십 바이트라 오버킬.

**Consequences**

- (+) "세션 범위" 시맨틱을 저장소가 네이티브로 제공 — 만료·마커 로직이 0.
- (+) extension-global → 시나리오 E(탭 공유)가 저장소만으로 성립(ADR-4).
- (+) 데이터가 디스크에 남지 않는다.
- (−) **`storage.session` 의 clear 범위(Chrome 공식 문서 확인 사실)**:
  `storage.session` 데이터는 **브라우저 재시작 시, 그리고 확장 프로그램이 disable /
  reload / update 될 때 clear** 된다(in-memory). 또한 **기본적으로 content script 에
  노출되지 않아 `setAccessLevel()` 이 필요**하다. 이 clear 동작은 현재 feature 의
  세션성 요구사항과 **충돌하지 않는다** — 확장 reload·update 도 "새 시작" 으로 취급하는
  것이 spec 의 세션 범위 의도와 부합한다. 다만 개발 중 확장을 자주 reload 하면
  테스트 세션이 사라진다는 점은 알고 있어야 한다.
- (−) **content script 접근이 background 의 access level 설정에 의존한다** —
  `chrome.storage.local` / `sync` 와 달리 `session` 만의 제약. background 가
  최소한이지만 반드시 존재해야 하고, 설정이 누락·지연·실패하면 그 시점 content 의
  세션 접근이 실패한다(→ `SessionStore` 가 "세션 없음" 으로 격리, 그 한 번 타이머
  새로 시작). 구체 호출 위치·실제 접근 가능 시점 검증은 Decision 및 TDD 로 넘긴다.
- (−) 세션이 삭제되지 않는 경로(흐름 이탈)에서 `contestProbId` 별 항목이 한 세션 내에서
  누적될 수 있다. 세션 clear(브라우저 재시작 / 확장 reload) 시 전부 사라지므로
  현실적으로 무시 가능.
- (−) **storage 장애 시 persistence 가 보장되지 않는다**: quota·API 오류·access level
  미설정 시 write 가 조용히 실패하고 그 새로고침에서는 복원되지 않는다. 타이머 자체
  (메모리)는 계속 동작한다. `spec-fixed.md` 에러 처리 원칙에 따른다.

### ADR-3. persistence 책임 분리 — SessionStore(adapter) / Timer Session 규칙 / useTimer

**Context**

SessionStore 는 storage 접근·검증·오류 격리만 담당하고, 세션 생성/완료/종료 같은
Timer Session 규칙과는 가능한 한 분리한다. `useTimer` 는 storage 를 알지 못하는 시간
계산 훅으로 유지하며 tick 에서 storage read/write 를 하지 않는다.

**Decision**

3계층으로 나눈다.

1. **`SessionStore` (adapter)** — 예: `content/timer-session/store.ts`
   - `chrome.storage.session` 접근만 캡슐화: `get(contestProbId)`, `set(contestProbId, session)`,
     `remove(contestProbId)`.
   - 저장값의 파싱·`version` 스키마·타입·비정상값(`startedAt` 미래/음수,
     `stoppedAt < startedAt` 등) 검증 → 유효하지 않으면 `null` 반환.
   - `chrome.storage` 예외를 삼켜 `null` / no-op 로 격리(`console.warn`).
   - Timer Session "규칙" 은 모른다 — 저장/조회/삭제/검증만.

2. **Timer Session 규칙 (pure)** — 예: `content/timer-session/session.ts`
   - `deriveInitialState(stored, now)` → 저장된 세션이 있으면 그대로, 없으면
     새 세션(`startedAt: now, status: 'running', stoppedAt: null`).
   - `markCompleted(session, now)` 등 순수 함수.
   - `chrome` API 를 import 하지 않는다 → 순수 단위 테스트.

3. **오케스트레이션** — `mount.tsx` + `App`
   - `mount.tsx`: 식별된 `contestProbId` 로 `SessionStore.get` → `deriveInitialState`
     → 저장된 게 없었으면 `SessionStore.set`(**세션 생성**) → `<App problemId initialSession={...} />`.
   - `App`: `handleComplete` 에서 `markCompleted` 결과를 `SessionStore.set`(**세션 완료**).
     `screen === 'success'` 진입 시 `SessionStore.remove`(**세션 종료**).
   - storage write 는 이 **세 지점(mount 시 생성 / 완료 클릭 / success 도달)에서만**
     발생한다.

4. **`useTimer`** — 변경 최소
   - 입력에 `{ startedAt, stoppedAt }` 를 받아 그 기준으로 경과를 계산한다(현재는
     내부에서 `Date.now()` 로 `startedAt` 을 만든다). `stop()` 은 계속 로컬 상태만
     갱신한다. **storage 는 전혀 모른다.**
   - 500ms recompute 루프는 불변 — storage 미접근.

**Alternatives**

- **SessionStore 가 생성/완료/종료까지 담당** — 거부. adapter 가 도메인 규칙과 결합되어,
  저장소 교체(후속: local+만료, 또는 백엔드) 시 규칙까지 흔들린다. 사용자가 분리를 명시.
- **`useTimer` 가 세션 read/write (= Option 1)** — 거부. 훅이 storage 에 결합되고 6개
  fake-timer 테스트가 `chrome.storage` mock 을 떠안는다. Option 2 선택 취지에 반한다.
- **규칙까지 `App` 안에 인라인** — 거부. `App` 은 이미 화면 상태머신으로 크다. 순수
  규칙을 분리하면 테스트가 쉽다.
- **React Context / 전역 store 도입** — 거부. 위젯 하나 안의 단일 흐름이라 과하다.
  기존에도 Context 가 없다.

**Consequences**

- (+) 레이어별 테스트가 깔끔하다: 규칙(순수 Vitest), `SessionStore`(storage mock 1곳),
  `useTimer`(현행 유지), `mountCoditWidget`(DOM + 세션 케이스), `App`(초기 상태 주입 →
  시작 화면).
- (+) 저장소 세부가 `store.ts` 한 곳에 모여, 후속 feature(브라우저 재시작 복원 등)에서
  이 파일만 교체·확장하면 된다.
- (+) `useTimer` 회귀 위험이 최소다 — 입력 추가뿐.
- (−) 파일 수가 늘어난다(`timer-session/store.ts`, `session.ts`, `types.ts` 등). 다만
  기존 `history/`(mock-data / filter-problems / types 분리)·`problem/` 관습과 같은 규모.
- (−) `App` 이 `initialSession` prop 과 두 개의 write 호출 지점을 갖게 되어 표면이 조금
  넓어진다. 흐름 상태머신 자체는 불변.
- (−) 세 write 지점을 사람이 유지해야 한다 — 새 화면/전환을 추가할 때 세션 규칙 갱신을
  잊으면 불일치가 생긴다. 완화: 규칙을 순수 함수로 두고 테스트로 고정.

### ADR-4. 다중 탭 세션 공유 — 저장소 전역성만 사용, `storage.onChanged` 미사용

**Context**

시나리오 E: 탭 A에서 5분째 풀던 문제를 새 탭에서 열면 약 5분부터 이어서 표시된다.
사용자 조정: `storage.onChanged` 사용 여부는 시나리오 E가 요구하는 동기화 수준까지만
적용하고, 요구사항보다 넓은 실시간 동기화를 임의로 추가하지 않는다.

**Decision**

- `chrome.storage.session` 이 extension-global 이므로, **새 탭이 mount 시
  `SessionStore.get` 으로 현재 세션을 읽는 것만으로 시나리오 E 가 성립**한다. 두 탭
  모두 같은 `startedAt` 에서 벽시계로 각자 계산하므로 자연히 근사 동기 상태가 된다.
- `chrome.storage.onChanged` 구독은 **하지 않는다.** 시나리오 E 는 "탭을 열 때 복원"
  이지 "이미 열려 있는 두 탭 간 실시간 반영" 이 아니다.
- 결과적으로, 탭 A에서 "완료" 를 눌러도 이미 열려 있던 탭 B 는 다음 로드 전까지
  `running` 으로 보인다 — 이는 어떤 시나리오도 요구하지 않으며 허용한다.

**Alternatives**

- **`storage.onChanged` 로 열린 모든 탭 실시간 동기화** — 거부. 요구사항 범위 초과.
  리스너 생명주기·중복 렌더·race 를 이 feature 가 떠안게 된다. 사용자가 "요구보다 넓은
  동기화 금지" 를 명시.
- **BroadcastChannel / SharedWorker** — 거부. 동일 이유로 과하다.
- **탭 A 완료 시 다른 탭 강제 새로고침** — 거부. 침습적이다.

**Consequences**

- (+) 추가 코드가 0 이다 — 저장소 전역성만으로 시나리오 E 를 충족하고 리스너 생명주기
  관리가 없다.
- (+) 두 탭이 각자 벽시계로 계산하므로 별도 동기화 없이도 표시 오차가 초 단위 이내다.
- (−) 이미 열린 탭들 사이에 "완료" 같은 상태 전이가 **실시간으로 전파되지 않는다.**
  스펙상 문제는 없으나, 추후 그런 요구가 생기면 `SessionStore` 에 `onChanged` 를
  더하는 별도 결정이 필요하다.
- (−) 두 탭이 거의 동시에 "완료" 를 누르면 마지막 write 가 이긴다(last-write-wins).
  `stoppedAt` 이 몇 ms 차이라 실질 영향은 없다.

### ADR-5. Widget View State 와 Timer Session 분리

**Context**

이번 feature 는 Widget expanded ↔ collapsed 간 Timer continuity 를 포함한다
(`spec-fixed.md` "Widget 표현 상태"). 그러나 "접힘 여부" 는 측정값이 아니라 화면 표현
상태에 가깝다. 이를 `TimerSession`/storage 스키마에 섞으면 저장 스키마가 UI 상태에
결합되고, "collapsed 복원" 이라는 요구하지 않은 동작이 따라온다. 또 workflow state 를
expanded subtree 의 subtree-local state 에 두면, collapse 로 그 subtree 가 unmount 될 때
"접었다 펴면 원래 workflow 로 복귀" 요구가 깨진다.

**Decision**

- `WidgetViewState = 'expanded' | 'collapsed'` — `App`(또는 위젯 최상위 wrapper)의
  React state. 기본값 `expanded`.
- **`TimerSession`/storage 에 포함하지 않는다.** 새 document load → 항상 `expanded`
  로 시작(collapsed 상태는 복원하지 않는다).
- **접기/펼치기는 순수 view toggle** 이다. `useTimer`·`SessionStore`·화면 상태머신을
  건드리지 않는다 — Timer 의 시작/완료/종료/초기화에 영향 0.
- collapsed 뷰는 별도 타이머 인스턴스를 만들지 않고 **같은 `useTimer` 의 결과**
  (`running` 이면 증가, `stopped` 면 고정)만 읽어 최소 표시한다.
- **collapse/expand 시 상태 보존 모델**:
  - `App` 과 `App` 이 소유한 state(`viewState`·`screen`·`result`·`memo`·`memoOpen`·
    `selectedTagIds`·`customTags`·`useTimer` 관련)는 collapse 중에도 유지된다.
    `App` 자체는 unmount 되지 않는다.
  - expanded UI subtree(현재 `screen` 화면 컴포넌트)는 collapsed 로 바뀌는 동안
    조건부 렌더링으로 **unmount 될 수 있다.**
  - 따라서 collapse/expand 후 **보존되어야 하는 workflow state 는 subtree-local state
    에 의존하지 않는다** — `App`(또는 상위)이 소유한다. 현재 `App` 이 위 목록을 모두
    소유하므로 이 요구를 만족한다.
  - 다시 expand 하면 `App` 이 보존한 state 를 기준으로 직전 workflow 화면·입력값을
    재구성한다. 순전한 transient subtree-local UI(태그 직접입력 칸 미제출 텍스트,
    "더보기" 펼침 여부 등)는 보존 대상이 아니며 초기화될 수 있다.

**Alternatives**

- **`WidgetViewState` 를 `TimerSession` 에 넣어 collapsed 를 새로고침 후 복원** — 거부.
  저장 스키마가 UI preference 에 결합된다. 이번 feature 는 collapsed 복원을 요구하지
  않으며, "Widget 접힘/펼침 선호 저장" 은 Out of Scope 다.
- **collapsed 일 때 별도 경량 타이머 컴포넌트** — 거부. `useTimer` 하나가 Single
  Source of Truth 여야 한다. 두 소스는 drift 하고 stopped 고정값 처리가 이원화된다.
- **workflow state 를 expanded subtree 의 subtree-local state 로 관리** — 거부. collapse
  로 그 subtree 가 unmount 되면 화면·입력 상태가 소실되어 "접었다 펴면 원래 상태로
  복귀" 요구를 위반한다. workflow state 는 `App`(또는 상위)이 소유해야 한다.
- **`WidgetViewState` 를 별도 후속 feature 로 분리** — 거부(되돌림). 사용자가 이번
  Scope 에 다시 포함하기로 결정.

**Consequences**

- (+) 저장 스키마(`TimerSession`)가 UI 상태와 완전히 분리된다 — `TimerSession` 은 순수
  measurement.
- (+) collapsed 복원이 없으므로 추가 저장·검증 로직이 0.
- (+) 단일 `useTimer` → expanded/collapsed 표시가 자동으로 일관된다.
- (−) collapsed 에도 `App` 과 `useTimer`(interval 포함)는 계속 살아 있다. 이는 의도된
  동작(running 계속 증가)이지만 "가벼워 보이는데 실제로는 다 돌고 있다".
- (−) expanded subtree 가 collapse 시 unmount 될 수 있으므로, 보존이 필요한 모든
  workflow state 를 `App` 이 소유하도록 유지해야 한다. 새 입력 필드/화면을 추가할 때
  subtree-local state 로 두지 않도록 주의가 필요하다.
- (−) 위젯 최상위에 `WidgetViewState` 하나가 추가된다. workflow 상태머신과는 독립.
- (−) collapsed 로 두고 새로고침/새 탭 → `expanded` 로 뜬다(선호 미저장). 의도된
  동작이나 사용자 기대와 다를 수 있어, Widget preference persistence 는 후속으로 남긴다.

## 4. Out of Scope

- 결과 / 메모 / 태그 / 현재 화면 등 **풀이 흐름 입력 상태의 저장·복원**
- 문제를 떠나 있는 동안 타이머를 멈추는 **pause / resume**
- **브라우저 재시작 후 복원** (`chrome.storage.local` + 브라우저 세션 마커 / 만료 정책)
  — 후속 feature
- **cross-device 동기화 / 백엔드 저장 / Attempt Save API(`POST /api/attempts`) 연동**
  (참고 — `#16`/`#17` 완료 시점 논의: `chrome.storage.session`은 기기 로컬이라
  같은 사용자가 다른 PC에서 같은 문제를 열면 독립된 새 세션(0초)으로 시작한다.
  다만 이건 데이터 정합성 문제가 아니다 — Attempt Save API가 붙어도 진행 중
  세션은 전송되지 않고 "완료" 시점에만 결과가 1회성으로 저장되는 append-only
  모델이 될 것으로 예상되어, 기기 간 last-write-wins 같은 충돌 지점 자체가
  없다. 같은 문제를 여러 기기에서 동시에 풀 때 시도 이력이 여러 건 남는 게
  맞는지는 데이터 정합성이 아니라 UX/제품 결정 사항 — Attempt Save API 설계
  시 참고.)
- **"흐름 이탈"(중도 포기·뒤로가기 등) 시 세션 삭제** 조건 정의 — 삭제는 success
  도달로만 한정
- **이미 열린 여러 탭 간 상태 전이 실시간 동기화** (`storage.onChanged` 기반)
- 여러 문제를 병렬로 풀 때의 경과 시간 정확도 보정 (벽시계 그대로 둠)
- **pause / resume / reset** — 접기/펼치기는 pause 가 아니며 Timer 는 계속 흐른다
- **Widget 접힘/펼침 선호의 저장**(Widget preference persistence) — `WidgetViewState`
  는 storage 에 넣지 않고 collapsed 는 새로고침 후 복원하지 않는다(ADR-5)
- 타이머 UI 변경(리셋 버튼, 누적 시간 표시 등) — 단 collapse/expand 토글과 collapsed
  시간 표시는 이번 feature 범위에 **포함**
- 세션 목록 / 관리 화면
- **모의 테스트 / Contest Problem / User Problem / Code Battle** 등 지원 대상 외 SWEA
  경로에서의 타이머 동작
- **background 를 통한 Timer Session 소유 / content ↔ background message protocol**
  (background 는 `chrome.storage.session` access level 설정만)
- **hidden input 식별용 고정 timeout 상수** — 관찰 후 식별되면 mount, 아니면 미표시
- **같은 live document 안에서의 `contestProbId` 변경 감지**(상시 identity watcher).
  현재 설계 전제는 "문제 전환 = 새 document load = content script 재실행"(ADR-1).
  SWEA 가 SPA 방식으로 바뀌면 그때 별도 결정으로 추가.
- MAIN world 스크립트 / `chrome.scripting` 를 통한 재주입

## 5. 용어 정의

`spec-fixed.md` "용어 정의" 섹션을 따른다. 핵심:

- **Timer Session** (개념) = `{ problemId, startedAt, status, stoppedAt }`.
  저장 시에는 스키마 진화를 위해 `version` 필드를 더해 기록한다.
- **Session Identity** = `contestProbId` (문제/세션을 가리키는 값)
- **storage key** = `timer-session:<contestProbId>` — Session Identity 와 구분되는
  실제 `chrome.storage.session` 키. prefix `timer-session:` 는 확정.
- **WidgetViewState** = `expanded | collapsed`. 화면 표현 상태이며 `TimerSession`/
  storage 에 넣지 않는다. 기본값 `expanded`, 새 document 마다 `expanded`(ADR-5).
- **경과 시간** = `floor((기준시각 - startedAt) / 1000)`, 기준시각 = `stopped`면
  `stoppedAt`, `running`이면 현재 시각. 별도 저장 안 함.
- **세션 생성 / 완료 / 종료** = storage write 발생 시점 (tick 시점 아님).
  접기/펼치기는 여기에 해당하지 않는다(storage write 없음).
