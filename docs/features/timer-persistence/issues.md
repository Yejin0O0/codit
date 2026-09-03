# timer-persistence Issue Breakdown

> `prd.md`(3연속성 + ADR-1~5), `spec-fixed.md`(시나리오·엣지), `ui-design.md`(collapse UI)
> 기준. Vertical Slice — 각 이슈는 완료 시 사용자에게 보여줄 동작이 있다.
>
> **timer-persistence 는 PR #10 후속 Feature 다.** PR #10 은 이미 `team/develop` 에
> 머지되었다(`0fda5f6`). 이 feature 의 구현은 **새 GitHub Issue · 새 Feature Branch ·
> 새 PR** 에서 진행한다 — PR #10 을 다시 열거나 그 Scope 를 수정하지 않는다.
> PR #10 리뷰에서 확정된 구조적 원칙은 이 feature 에서도 회귀 금지 조건으로 유지한다
> (아래 "공통 구현 제약").

## 의존성과 구현 순서

| | 관계 |
|---|---|
| **기술 의존성** | **#3 → #2** 만 실제 의존이다. #3(`resolveProblemId` + `solvingProblem.do` 지원)은 이어질 세션이 있어야 "Timer continuity 완성"이 되므로 #2 의 `SessionStore`·세션 규칙을 전제로 한다. |
| **#1 ↔ #2** | **상호 독립.** collapse UI(#1)와 persistence(#2)는 기능상 서로를 필요로 하지 않는다. 다만 둘 다 `App.tsx`·`useTimer.ts` 를 건드리므로 병행하면 머지 충돌이 날 수 있다. |
| **권장 구현 순서** | **#1 → #2 → #3.** #1 이 가장 작고 독립적(UI만, storage/permission/background 무관)이라 먼저. 그다음 persistence 코어 #2, 마지막으로 #2 위에 얹는 #3. 이는 순서 권장일 뿐 #1 이 #2 의 선행 조건은 아니다. |

---

## 공통 구현 제약 — 기존 PR #10 리뷰 피드백 준수

아래는 PR #10 리뷰를 거쳐 **이미 확정된 구조적 원칙**이다. timer-persistence 의
**모든 Issue 는 이를 회귀 금지 조건으로 따른다.** 각 issue 문서의 "Review Constraints"
는 이 섹션을 참조한다.

1. **Tag taxonomy SoT 유지** — Timer/History 의 tag taxonomy 를 다시 물리 복제하지
   않는다. `apps/extension/lib/tag-catalog.ts` 단일 SoT 를 유지하고, 새 코드가 태그
   목록을 필요로 하면 그 모듈을 재사용한다. (근거: `6971b55`)
2. **`useTimer` wall-clock 원칙 유지** — 경과 시간의 Source of Truth 는
   `floor((기준시각 - startedAt) / 1000)` 이다. `setInterval` 콜백은 "화면 재계산
   트리거" 역할만 하며 **tick 누적값을 시간의 SoT 로 쓰지 않는다.** `stop()` 은 마지막
   tick 이후 시간까지 반영해 최종값을 벽시계 기준으로 고정한다. render 중 `Date.now()`
   호출 금지(`react-hooks/purity`). (근거: `f383399`)
3. **SWEA 문제 식별 실패 시 fail-soft** — `contestProbId` 를 얻지 못하면 `#codit-root`
   도, Shadow DOM 도, Timer 도 만들지 않고 SWEA 화면을 건드리지 않는다. 사용자에게
   보이는 에러·alert·배지 없음. (근거: `f0b37b3`)
4. **Shadow DOM / duplicate mount guard 구조 유지** — content script 는 `#codit-root`
   + `attachShadow` + 중복 mount 가드 구조를 불필요하게 깨지 않는다. `parseContestProbId`
   (순수 URL 파서)와 `mountCoditWidget` 의 시그니처·조립 구조를 재사용한다. (근거:
   `f0b37b3`)
5. **테스트 설명 컨벤션 유지** — `describe(...)` 는 영어(코드 심볼과 연결), `it(...)` /
   `it.each(...)` 설명은 한국어 현재형. 코드 심볼(컴포넌트/훅/prop/변수명)과 사용자
   노출 UI 문자열은 번역하지 않는다. (근거: `5702ef4`)
6. **리뷰에서 단순화/공통화한 구조를 복제 구조로 되돌리지 않는다** — 예: `tag-catalog`
   공통화, `ProblemListContent` early-return 분리, `resolveCustomTagInput` 순수 함수
   추출, `eslint .` 전체 검사(`coverage/**` ignore). (근거: `6971b55` `3c15608`
   `eda6141` `321f54c`)

> 이 원칙들의 상세는 각 Retrospective 문서에 기록되어 있다 —
> `docs/features/timer/spec-current.md`(wall-clock), `docs/features/swea-problem-identification/spec-current.md`(fail-soft),
> `docs/decisions/tag-catalog-single-source-of-truth.md`(태그 SoT).

---

## Resolved Review Feedback

PR #10 에 대해 이미 받은 리뷰 피드백과 그로 인해 확정된 원칙. (이 섹션은 후속 작업이
같은 지적을 반복하지 않도록 기록한다.)

| 라운드 / commit | 피드백 요지 | 확정된 원칙 |
|---|---|---|
| `6971b55` `refactor: share timer and history tag catalog` | Timer 와 History 가 동일 tag taxonomy 를 각자 물리 복제 (표시명 일부 이미 drift) | `lib/tag-catalog.ts` 단일 SoT. `content/mockData.ts` · `history/mock-data.ts` · `history/types.ts` 가 재노출. 표시명은 Timer 기준 통일. `codit/tag-toggle-group.tsx` 의 로컬 prop 타입은 구조적 타입이라 유지(데이터 중복 아님) |
| `3c15608` `refactor: simplify problem history list rendering` | `ProblemListView` 본문의 4중 중첩 삼항이 가독성 저하 | 본문을 `ProblemListContent` 내부 컴포넌트로 분리, early return. 3개 이상 상태 분기 중첩 시 early return |
| `eda6141` `fix: reuse existing tag when adding duplicate custom tag` | 기존 predefined/custom 태그와 같은 이름을 직접 입력하면 존재하지 않는 `custom:<name>` id 가 선택 상태에 들어가 카탈로그와 불일치 | 판정 로직을 순수 함수 `resolveCustomTagInput` 로 추출. 이름 일치 시 기존 태그 id 재사용, 새 custom id 미생성. 회귀 테스트 포함 |
| `f0b37b3` `fix: target SWEA and gate codit widget mount on a problem page` | content script match 가 `google.com`; 위젯이 문제 페이지 판별 없이 mount | `matches` = SWEA. `mountCoditWidget` 이 `contestProbId` 유무로 게이트, 없으면 아무 DOM 도 안 만듦(fail-soft). DOM/mount 로직을 `mount.tsx` 로 분리, `parseContestProbId` 순수 함수 |
| `f383399` `refactor: use wall-clock time for the solve timer` | `setElapsedSeconds(prev => prev + 1)` 은 콜백 횟수와 실제 시간이 어긋남(스로틀링·절전) | `Date.now()` 기준 계산. interval 은 재계산 트리거만. `stop()` 은 마지막 tick 이후 시간까지 반영해 정확히 고정. `useRef` 로 `startedAt` 을 effect 내부에서 lazy 초기화(`react-hooks/purity` 준수) |
| `321f54c` `chore: lint the whole extension package` | `lint` 가 `entrypoints components lib` 만 검사 — `styles/tokens.test.ts` 등 누락 | `eslint .` 로 확장. `eslint.config.js` ignores 에 `coverage/**` 추가. `wxt.config.ts` import 순서 정리 |
| `5702ef4` `test: standardize test descriptions in Korean` | 테스트 `it` 설명이 영어("should …") | `describe` 영어 유지, `it`/`it.each` 설명 108개 한국어화. 코드 심볼·UI 문자열 미번역 |
| 리뷰 논의 (**REVIEWED — NO CHANGE**) | `ProblemCard` 가 `<button>` 안에 `<div>`(Card) — HTML 스펙상 부적절 | **변경하지 않음** (RESOLVED 아님, 현재 결정). native `<button>` 이 click/Enter/Space 활성화를 견고하게 제공, 내부 interactive descendant 없음. 대안(`role="button"` div + 수동 keydown, `Card asChild`)은 키보드 a11y·공유 primitive blast radius 면에서 손해 |
| 보안 리뷰 (Future Concern) | `image-size` high 취약점 2건 | `wxt > web-ext > addons-linter` 경유 **빌드 툴체인 전용**, 번들 미포함, 패치 없음. 이 feature 와 무관 |

---

## Issue 1: [timer-persistence] Widget 접기/펼치기 + collapsed 타이머 표시

### 설명

Floating Widget 에 접기/펼치기(`WidgetViewState = expanded | collapsed`)를 추가한다.
collapsed 는 expanded 와 같은 top-right anchor 에 작은 pill 로, running 이면 증가하는
`mm:ss`, "완료" 이후면 고정된 시간 + 완료(check) 아이콘을 보여준다. 접기/펼치기는
`useTimer`·`screen`·입력값·Timer 시작/완료/종료를 바꾸지 않는 순수 view toggle 이며,
다시 펴면 `App` 이 소유한 state 기준으로 직전 화면·입력값이 그대로 재구성된다.
persistence(`chrome.storage`)와 무관 — 이 이슈만으로 goal #3(expanded ↔ collapsed
Timer continuity)이 완결된다.

`ui-design.md` 를 시각 명세로 따른다. 기존 Timer/Result/Memo/Tags 화면은 재설계하지
않는다(헤더에 접기 컨트롤 슬롯 추가 외 불변).

의존: **없음** (#2 와 상호 독립. "의존성과 구현 순서" 참조 — 권장 순서상 먼저 구현.)

신규/변경 (예상):
- `apps/extension/entrypoints/content/collapsed-timer.tsx` — `CollapsedTimer` (신규 CUSTOM)
- `apps/extension/components/codit/panel-shell.tsx` — 선택적 접기 컨트롤 슬롯 추가
- `apps/extension/entrypoints/content/App.tsx` — `viewState` 상태 + expanded/collapsed 분기
- (`useTimer` 에 running/stopped 를 알 수 있는 최소 출력이 필요하면 추가 — 또는 `App`
  이 `screen` 으로 판단)

### Review Constraints

"공통 구현 제약 — 기존 PR #10 리뷰 피드백 준수" 전체를 따른다. 이 Issue 에서 특히:

- **#2** — collapsed 뷰는 별도의 누적 타이머를 만들지 않고 `useTimer` 의 결과만 읽는다.
  두 번째 시간 소스를 만들지 않는다.
- **#6** — `App` 에 `viewState` 를 추가하되 화면 상태머신·기존 구조를 복잡하게 되돌리지
  않는다. `PanelShell` 은 선택적 슬롯 추가(주입 없으면 기존 동일).
- **#4** — Shadow DOM / `#codit-root` 구조는 건드리지 않는다.
- **#5** — 새 테스트는 `describe` 영어 / `it` 한국어. `WidgetViewState` 등 심볼·UI
  문자열 미번역.

### 완료 조건 (Acceptance Criteria)

- [ ] 위젯 헤더(모든 화면 공통)에 접기 컨트롤이 있고 `aria-label="Codit 타이머 접기"` 이다.
- [ ] 접으면 top-right 에 pill 이 뜨고 expanded 화면 subtree 는 사라진다.
- [ ] collapsed running: `mm:ss` 가 초 단위로 계속 증가한다.
- [ ] "완료" 후 collapsed: 시간이 고정되고 완료(check) 아이콘이 함께 표시된다. running/
      stopped 구분이 색상에만 의존하지 않는다. pill 폭이 상태에 따라 크게 바뀌지 않는다.
- [ ] collapsed pill 전체가 펼치기 버튼(클릭/Enter/Space)이며, accessible name 에
      "펼치기 동작 + 현재 경과시간"(stopped 면 "완료됨" 포함)이 들어간다. 장식 아이콘은
      `aria-hidden`. `aria-live` 미사용.
- [ ] 펴면 접기 직전의 `screen`·입력값(`result`/`memo`/`memoOpen`/`selectedTagIds`/
      `customTags`)이 그대로다.
- [ ] 접기/펼치기가 `useTimer`(경과시간)·`screen`·Timer 시작/완료/종료/초기화에 영향을
      주지 않는다.
- [ ] `PanelShell` 을 접기 컨트롤 없이 쓰는 기존 사용처는 레이아웃 변화가 없다.
- [ ] 새 document load 시 위젯은 항상 `expanded` 로 시작한다(collapsed 미복원 — 이
      이슈에서는 storage 를 쓰지 않으므로 자연히 성립).
- [ ] 기존 Timer/Result/Memo/Tags 테스트 회귀 없음.

### 시나리오

**시나리오 F — collapsed 상태에서도 타이머 계속**

**Given** 사용자가 문제 X를 3분째 풀이 중이다(타이머 화면, running).
**When** 위젯을 접는다.
**Then** 접힌 pill 에 경과 시간이 계속 증가하며 표시되고, 다시 펴면 타이머 화면에서
이어서 흐른다.

**시나리오 G — 완료 후 collapse/expand 왕복**

**Given** "완료"를 눌러 타이머를 멈췄고(측정 5분 고정) 결과 선택 화면에서 결과를 고르는
중이다.
**When** 위젯을 접었다가 다시 편다.
**Then** 결과 선택 화면으로 그대로 돌아가고 고르던 값도 유지되며, 5분은 접힌 동안에도
다시 흐르지 않았다.

**시나리오 — 접근 가능한 collapsed 이름**

**Given** running 상태로 위젯이 접혀 있고 경과 시간이 12:35 이다.
**When** 스크린리더로 pill 버튼에 접근한다.
**Then** 버튼 이름으로 "펼치기 동작" 과 "경과 시간 12:35" 를 모두 인식할 수 있다
(stopped 라면 "완료됨" 도 포함).

---

## Issue 2: [timer-persistence] 새로고침 후 Timer Session continuity

### 설명

`chrome.storage.session` 기반으로 진행 중인 풀이 타이머를 브라우저 세션 범위에서
이어지게 한다. URL 에 `contestProbId` 가 있는 SWEA 문제 페이지(`problemDetail.do`,
`solvingClub/.../problemView.do`)에서, 새로고침해도 타이머가 0 이 아니라 실제 경과
시간부터 이어지고, "완료" 후 새로고침하면 측정된 시간이 고정된 채 결과 선택 화면으로
진입한다. success 도달 시 세션이 삭제된다.
`TimerSession = { problemId, startedAt, status, stoppedAt }` (+ 저장 시 `version`) 만
저장하고, 결과/메모/태그/화면·접힘 여부는 저장하지 않는다.

persistence 책임은 `prd.md` ADR-3 대로 분리한다:
`SessionStore`(adapter) / Timer Session 규칙(pure) / `mount.tsx`·`App` 오케스트레이션 /
`useTimer`(storage 무관). storage write 는 **세션 생성 / "완료" / success 3지점에서만**.

의존: **없음** (#1 과 상호 독립. 기술적으로 #1 을 전제하지 않는다. 다만 #1·#2 모두
`App.tsx`·`useTimer.ts` 를 수정하므로 권장 순서상 #1 다음에 구현 — "의존성과 구현
순서" 참조.)

신규/변경 (예상):
- `apps/extension/entrypoints/content/timer-session/store.ts` — `SessionStore`
  (`chrome.storage.session` 접근·`version` 스키마/비정상값 검증·예외 격리)
- `apps/extension/entrypoints/content/timer-session/session.ts` — 순수 규칙
  (`deriveInitialState`, `markCompleted`)
- `apps/extension/entrypoints/content/timer-session/types.ts`
- `apps/extension/entrypoints/background.ts` — `chrome.storage.session.setAccessLevel(...)`
  (idempotent, 초기화 책임만; 호출 위치 조합은 TDD 에서 확정)
- `apps/extension/wxt.config.ts` — manifest `"storage"` permission
- `apps/extension/entrypoints/content/mount.tsx` — 식별된 `contestProbId` 로 세션 load
  → 없으면 생성 → `<App problemId initialSession=... />`
- `apps/extension/entrypoints/content/App.tsx` — "완료" 시 `completeSession`,
  success 진입 시 `endSession`, `initialSession` prop
- `apps/extension/entrypoints/content/useTimer.ts` — `{ startedAt, stoppedAt }` 입력을
  받아 그 기준으로 경과 계산(미주입 시 기존처럼 현재 시각 기준)

### Review Constraints

"공통 구현 제약 — 기존 PR #10 리뷰 피드백 준수" 전체를 따른다. 이 Issue 에서 특히:

- **#2** — `useTimer` 는 `{ startedAt, stoppedAt }` 를 받아도 wall-clock 계산을 유지한다.
  tick 누적을 시간의 SoT 로 바꾸지 않는다. `stop()` 의 "마지막 tick 이후 시간까지
  정확히 고정" 동작을 깨지 않는다. render 중 `Date.now()` 호출 금지.
- **#3** — `SessionStore` 는 `chrome.storage` 예외·access level 미설정·quota 실패를
  삼켜 "세션 없음" 으로 격리한다. 어떤 storage 장애도 타이머 동작·SWEA 사용을 막지
  않는다.
- **#4** — `mount.tsx` 오케스트레이션에서 `parseContestProbId` / `mountCoditWidget` /
  Shadow DOM / 중복 mount 가드 구조를 재사용한다.
- **#5** — `SessionStore`(storage mock), 순수 규칙(Vitest), `useTimer`(fake timer)
  레이어별 테스트. `describe` 영어 / `it` 한국어.
- **#6** — persistence 를 `useTimer` 안에 결합(Option 1)로 되돌리지 않는다. 3계층
  분리(ADR-3) 유지.

### 완료 조건 (Acceptance Criteria)

- [ ] `problemDetail.do?contestProbId=X` 에서 타이머 진행 중 새로고침 → 타이머가 0 이
      아니라 실제 경과 시간(±1s)부터 이어진다.
- [ ] "완료" 클릭 후 새로고침 → `status: stopped` 로 복원, 경과 시간은
      `stoppedAt - startedAt` 으로 고정 표시, 결과 선택 화면으로 진입. 결과/메모/태그는
      초기 상태.
- [ ] success 화면 도달 → 세션 삭제. 이후 새로고침하면 새 타이머(0초).
- [ ] 다른 문제로 이동(새 document) → 새 세션 0초 시작, 이전 문제 세션은 보존.
- [ ] 같은 문제를 다른 탭에서 열면 같은 세션을 읽어 이어서 표시한다.
- [ ] 저장값 손상 / 스키마 불일치 / `startedAt` 미래·음수 / `stoppedAt < startedAt`
      → 무시하고 새 세션(0초, 타이머 화면).
- [ ] `chrome.storage` 예외·access level 미설정·quota 실패 → 조용히 무시
      (`console.warn`), 타이머는 메모리에서 계속 동작, SWEA 방해 없음.
- [ ] storage write 는 세션 생성 / "완료" / success 3지점에서만 — 타이머 tick(500ms)
      마다 write 하지 않는다.
- [ ] `useTimer` 의 기존 fake-timer 테스트가 회귀 없이 통과(입력 추가만).
- [ ] background 는 access level 설정만 — Timer Session 소유·content ↔ background
      message protocol 없음.
- [ ] 프로덕션 manifest 에 `"storage"` 만 추가되고, 그 외 permission·host_permissions
      변화가 없다.
- [ ] 복원 시 사용자에게 안내 문구·alert·배지가 없다.

### 시나리오

**시나리오 A — 새로고침 후 타이머 이어짐**

**Given** 문제 X의 타이머 화면에서 5분째 풀이 중이다.
**When** 페이지를 새로고침한다.
**Then** 타이머 화면이 다시 뜨고 약 5분 몇 초부터 계속 흐른다.

**시나리오 B — 완료 후 새로고침**

**Given** "완료"를 눌러 타이머를 멈췄고 결과 선택 화면에 있다(측정 7분 30초).
**When** 페이지를 새로고침한다.
**Then** 7분 30초가 고정된 채 결과 선택 화면으로 진입하고, 결과/메모/태그는 처음부터
다시 입력한다.

**시나리오 C — 다른 문제로 이동 (URL 페이지)**

**Given** 문제 X를 3분째 풀이 중이다.
**When** 브라우저에서 문제 Y의 `problemDetail.do` 로 이동한다.
**Then** 문제 Y는 0초부터 새 타이머, 문제 X 세션은 삭제되지 않고 보존되며, X로 돌아오면
벽시계 기준으로 복원된다.

**시나리오 — storage 장애 fail-soft**

**Given** `chrome.storage.session` 접근이 실패하는 상황이다.
**When** 문제 페이지에서 타이머를 사용한다.
**Then** 타이머는 정상 동작하고 SWEA 화면도 정상이며, 새로고침 시 복원만 안 될 뿐 에러
표시가 없다.

---

## Issue 3: [timer-persistence] SWEA 문제 페이지 간 continuity (solvingProblem.do 지원)

### 설명

문제 식별을 URL `?contestProbId=` 에서 DOM `#contestProbId` /
`input[name="contestProbId"]` fallback 으로 확장한다. `solvingProblem.do` 처럼 URL 에
문제 식별자가 없는 페이지에서도 위젯이 뜨고, `problemDetail.do` ↔ `solvingProblem.do`
를 오가도 같은 `contestProbId` 면 같은 Timer Session 이 이어진다. hidden input 이 로드
초기에 없으면 DOM 변화를 관찰하다 나타나는 순간 위젯을 mount 하고 observer 를
disconnect 한다(고정 timeout 없음). 식별 불가·로그인 페이지에서는 위젯을 표시하지
않는다.

식별 책임은 `content/problem/` 모듈에 모으고(`prd.md` ADR-1), 기존
`parseContestProbId` 와 `mountCoditWidget` 구조는 유지·재사용한다.

**착수 전 (필수)**: `spec-fixed.md` "구현 전 검증 항목"을 로그인된 `solvingProblem.do`
에서 1회 수행하고 결과를 이 이슈에 기록한다
(`document.querySelector('input#contestProbId')?.value` 및 fallback 셀렉터,
URL 에 `?contestProbId=` 부재 여부, 같은 창에서 다른 문제 열 때 값 변화).

의존: **#2 (기술 의존)** — `resolveProblemId` 가 `solvingProblem.do` 에서 위젯을 띄우고
문제 페이지 간 이동에서 "Timer continuity 를 완성"하려면 #2 의 `SessionStore`·세션
규칙(contestProbId 키 기반 저장/복원)이 있어야 한다. #2 없이 #3 만으로는 이어질
세션이 없다.

신규/변경 (예상):
- `apps/extension/entrypoints/content/problem/resolve-problem-id.ts` —
  `resolveProblemId(doc, href)` = `parseContestProbId(href)` → DOM fallback
- `apps/extension/entrypoints/content/mount.tsx` — `resolveProblemId` 사용 + hidden
  input 지연 등장 시 `MutationObserver` 관찰 → 식별 → mount → disconnect
- (`parse-contest-problem-id.ts` 는 그대로 재사용, `index.tsx` `matches` 는 이미
  `*://*.swexpertacademy.com/*` 로 충분 — 변경 없음 예상)

### Review Constraints

"공통 구현 제약 — 기존 PR #10 리뷰 피드백 준수" 전체를 따른다. 이 Issue 에서 특히:

- **#3** — `resolveProblemId` 가 `null` 이거나 hidden input 이 끝내 안 나타나면
  fail-soft: `#codit-root` 미생성, SWEA 화면 무수정, 에러·alert 없음.
- **#4** — 기존 `parseContestProbId`(순수 URL 파서)는 그대로 재사용하고 그 위에
  `resolveProblemId` 를 얹는다. `mountCoditWidget` 시그니처·root/Shadow/render 구조와
  중복 mount 가드를 유지한다.
- **#5** — `resolveProblemId` 는 `Document` 주입 순수 테스트. `describe` 영어 / `it`
  한국어.
- **#6** — 식별 로직을 `mount.tsx` 에 인라인하지 않고 `content/problem/` 모듈에
  모은다(ADR-1). MutationObserver 를 상시 identity watcher 로 확대하지 않는다(식별
  성공·`pagehide` 시 disconnect).

### 완료 조건 (Acceptance Criteria)

- [ ] `resolveProblemId` 는 URL `?contestProbId=` 우선, 없으면 `#contestProbId` /
      `input[name="contestProbId"]` 의 첫 비어있지 않은 `value`, 둘 다 없으면 `null` 을
      반환한다 (`Document` 주입 순수 테스트).
- [ ] `solvingProblem.do` (URL 에 contestProbId 없음, hidden input 에 있음)에서 위젯이
      뜬다.
- [ ] `problemDetail.do?contestProbId=X` 에서 타이머 진행 후 `solvingProblem.do`
      (hidden input = X)로 이동 → 같은 세션이 이어져 경과 시간이 계속 흐른다.
- [ ] 로드 초기에 hidden input 이 없으면 즉시 실패로 처리하지 않고, 나타나는 순간
      위젯을 mount 하고 observer 를 disconnect 한다.
- [ ] 로그인 페이지·식별 불가 페이지에서는 `#codit-root` 를 만들지 않고 SWEA 화면을
      건드리지 않는다.
- [ ] 같은 문제를 `solvingProblem.do` 여러 탭에서 열면 같은 세션을 공유한다.
- [ ] 모의 테스트 / Contest Problem / User Problem / Code Battle 경로에서는 위젯이
      뜨지 않는다.
- [ ] 기존 `parseContestProbId` 테스트 회귀 없음. 기존 `mountCoditWidget` 테스트 회귀
      없음(DOM 케이스 추가).

### 시나리오

**시나리오 D — 같은 문제의 다른 SWEA 페이지로 이동**

**Given** `problemDetail.do?contestProbId=X` 에서 X를 4분째 풀이 중이다.
**When** "문제 풀기"로 `solvingProblem.do`(URL 에 X 없음, hidden input 에 X)로 이동한다.
**Then** 같은 `contestProbId` 이므로 동일 세션이 유지되고 타이머는 4분 몇 초부터 계속
흐른다.

**시나리오 — hidden input 지연 등장**

**Given** `solvingProblem.do` 로드 직후 `#contestProbId` 가 아직 DOM 에 없다.
**When** 잠시 후 SWEA 가 hidden input 을 렌더한다.
**Then** 그 시점에 위젯이 mount 되고, 이후 DOM 관찰(observer)은 정리된다.

**시나리오 — 식별 불가 페이지**

**Given** 로그인 페이지 또는 `contestProbId` 를 찾을 수 없는 SWEA 페이지다.
**When** content script 가 실행된다.
**Then** `#codit-root` 가 생성되지 않고 SWEA 화면에 아무 변화가 없다.
