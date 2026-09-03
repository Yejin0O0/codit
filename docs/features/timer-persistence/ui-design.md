# timer-persistence UI Design

> 이 문서는 tdd-green-frontend의 시각적 명세 참조 기준이다. 코드를 작성하지 않는다.
> 디자인 토큰·컴포넌트 규칙은 [../../ui/design-system.md](../../ui/design-system.md),
> 아키텍처는 [../../ui/ui-architecture.md](../../ui/ui-architecture.md) 참조.
>
> **범위**: 이번 feature 로 새로 생기는 부분 — Widget expanded ↔ collapsed 전환 UI만.
> 기존 Timer / Result / Memo / Tags 화면은 재설계하지 않는다(헤더에 접기 컨트롤 슬롯이
> 추가되는 것 외 레이아웃 불변). Timer Session persistence·저장 스키마는 UI 밖(`prd.md`
> ADR-1~5).

## Product Decision (확정)

| # | 결정 | 내용 |
|---|---|---|
| 1 | collapsed 위젯 구성 | pill. expanded 와 동일한 top-right anchor. Codit 아이콘 + `mm:ss` + 펼치기 기호만. 문제 번호·브랜드 텍스트·상태 문구 없음. SWEA 화면 침습은 최소화하되, **읽고 누를 수 있는 크기**를 우선한다(초소형 금지 — 대략 40px 높이). |
| 2 | running / stopped 구분 | stopped 는 소형 완료(check) 아이콘으로 running 과 구분. 색상에만 의존하지 않음. pill 폭이 상태에 따라 크게 바뀌지 않음. 상태 텍스트("완료"/"진행중") 없음. 아이콘은 design-system(인라인 SVG) 패턴을 따름. collapse/expand 컨트롤에는 접근 가능한 이름 제공(접기 = `aria-label`, 펼치기 = name-from-contents + sr-only — "Accessibility" 절). |
| 3 | 펼치기 어피던스 | collapsed pill 우측에 **상시 표시되는 펼치기 기호(chevron-up 인라인 SVG, 장식 — `aria-hidden`)**. expanded 헤더의 접기 기호(chevron-down)와 시각적으로 대응. running/stopped 무관하게 항상 있으므로 폭 일관성(#2)에 영향 없음. 펼치기 의미는 sr-only 텍스트가 전달하고, chevron 은 sighted 사용자에게 "클릭하면 펼쳐짐"을 알린다. |

---

## 와이어프레임

### ① expanded — 헤더에 접기 컨트롤 (모든 화면 공통)

접기 컨트롤은 `PanelShell` 헤더 최우측에 붙는다. 화면별 본문·푸터는 기존 그대로.

```
Timer 화면                            메모 / 태그 화면 (step 있음)
┌────────────────────────────┐        ┌────────────────────────────┐
│ 풀이 타이머          [ ▽ ] │        │ 메모          2 / 3   [ ▽ ] │
├────────────────────────────┤        ├────────────────────────────┤
│   문제 #{problem_id}        │        │ [오답]                     │
│                            │        │ 메모                       │
│         12:34              │        │ ┌────────────────────────┐ │
│                            │        │ │ Textarea               │ │
│   ┌──────────────────┐     │        │ └────────────────────────┘ │
│   │      완료        │     │        │                            │
│   └──────────────────┘     │        │ [뒤로]           [다음]    │
└────────────────────────────┘        └────────────────────────────┘
```

- `[ ▽ ]` = 접기 컨트롤 (아이콘 버튼). `aria-label="Codit 타이머 접기"`.
- step(`2 / 3` 등)이 있으면 그 오른쪽에 접기 컨트롤이 온다. step 이 없으면(Timer / 결과 선택)
  헤더 최우측에 단독으로 온다.
- 헤더 외 본문·푸터·flow·스텝 규칙은 `docs/features/timer/ui-design.md` 그대로.

### ② collapsed — running

```
                       ┌────────────────────┐
                       │  [C]   12:34    ⌃  │
                       └────────────────────┘
        top-right 코너 앵커 (expanded 위젯과 같은 위치, 약 40px 높이의 pill)
```

- `[C]` = 소형 Codit 아이콘 (인라인 SVG 마크, `BrandHeader` 와 동일 path). 장식용 —
  `aria-hidden="true"`.
- `12:34` = `mm:ss`, `tabular-nums`, 초 단위로 계속 증가. **실제 텍스트 노드로 유지**한다.
- `⌃` = 펼치기 기호 (chevron-up 인라인 SVG). 상시 표시. 장식용 — `aria-hidden="true"`.
  expanded 헤더의 접기 기호(chevron-down)와 대응.
- pill 전체가 하나의 펼치기 버튼 (클릭 / Enter / Space). accessible name 은 아래
  "Accessibility" 참조 — 단순 `aria-label` 로 내부 텍스트를 덮어쓰지 않는다.

### ③ collapsed — stopped ("완료" 이후)

```
                       ┌────────────────────┐
                       │  [C]   07:30  ✓  ⌃ │
                       └────────────────────┘
```

- `07:30` = `stoppedAt` 기준 고정된 최종 시간. 더 이상 증가하지 않는다. 실제 텍스트 노드.
- `✓` = 소형 완료 아이콘 (인라인 SVG check, `SaveSuccessScreen` 의 path 재사용 가능).
  색상 대비만이 아니라 **아이콘 자체**로 stopped 를 알린다. 장식용 —
  `aria-hidden="true"` (stopped 의미는 아래 sr-only 텍스트가 전달).
- `⌃` = 펼치기 기호. running(②)과 동일하게 상시 표시(맨 오른쪽).
- running(②) 대비 pill 폭이 크게 늘지 않도록, check 아이콘 자리를 상시 확보하거나 최소
  폭만 증가시킨다. 상태 텍스트("완료"/"진행중")는 시각적으로 넣지 않는다.

### ④ 전환

```
[expanded, screen = X]
        │  헤더 [ ▽ ] 클릭 / Enter / Space
        ▼
[collapsed]  (running 이면 계속 증가 / stopped 이면 고정 + ✓)
        │  pill 클릭 / Enter / Space
        ▼
[expanded, screen = X]   ← 접기 직전 화면(X)·입력값 그대로
```

- 접기/펼치기는 `useTimer` · `screen` · `result` / `memo` / `selectedTagIds` /
  `customTags` · Timer Session(storage) 을 **바꾸지 않는다**. 상태 보존 모델은 아래
  "collapse/expand 시 상태 보존" 참조. (`prd.md` ADR-5)
- 새 document load 시 위젯은 항상 `expanded` 로 시작한다 (collapsed 는 복원하지 않음).

### collapse/expand 시 상태 보존

- `App` 과 `App` 이 소유한 state — `viewState` · `screen` · `result` · `memo` ·
  `memoOpen` · `selectedTagIds` · `customTags` · `useTimer` 관련 — 는 collapse 중에도
  유지된다. `App` 자체는 unmount 되지 않는다.
- expanded UI subtree(현재 `screen` 화면 컴포넌트)는 collapsed 로 바뀌는 동안 조건부
  렌더링으로 **unmount 될 수 있다.**
- 따라서 collapse/expand 후 **반드시 보존되어야 하는 workflow state 는 subtree-local
  state 에 두지 않는다** — `App`(또는 그 상위)이 소유한다. 현재 `App` 이 이미 위
  목록을 모두 소유하므로 이 요구를 만족한다.
- 다시 expand 하면 `App` 이 보존한 state 를 기준으로 직전 workflow 화면과 입력값을
  재구성한다.
- 순전한 transient subtree-local UI(예: 태그 직접입력 칸의 미제출 텍스트, "더보기"
  펼침 여부)는 보존 대상이 아니며 expand 시 초기화될 수 있다.

---

## 컴포넌트 트리

```
CoditWidget                         → CUSTOM (Shadow host / 320px 프레임, position:fixed top-right)
└── App
    ├── viewState = "expanded"
    │   └── {screen 별 화면}          기존 — 재설계 안 함
    │       └── PanelShell           → Card (EXTEND) — 접기 컨트롤 슬롯 신규
    │           ├── header
    │           │   ├── title
    │           │   ├── step          (조건부: memo / tags)
    │           │   └── CollapseControl (신규)  → Button (ghost, icon) + 인라인 SVG(chevron-down)
    │           ├── body              기존
    │           └── footer            기존 (조건부)
    │
    └── viewState = "collapsed"
        └── CollapsedTimer            → CUSTOM (신규) — Button 베이스 + 인라인 SVG
            ├── CoditMark (소형)       → 인라인 SVG (BrandHeader 마크 재사용), aria-hidden
            ├── sr-only 동작·상태 문구 → 실제 텍스트 노드 (접근성 절 참조)
            ├── 경과시간 mm:ss         → formatDuration (tabular-nums), 실제 텍스트 노드
            ├── CompletedMark          → 인라인 SVG check (status === "stopped" 일 때만), aria-hidden
            └── ExpandMark             → 인라인 SVG chevron-up (상시), aria-hidden
```

- `viewState: "expanded" | "collapsed"` 는 `App` 이 `screen` 과 **별개로** 소유하는
  상태다. 기본값 `"expanded"`.
- `CollapsedTimer` props(개념): `{ seconds, status: "running" | "stopped", onExpand }`.
  - `seconds` = `useTimer().elapsedSeconds` (expanded `TimerDisplay` 와 동일 소스).
  - `status` = `App` 이 "완료" 클릭 여부로 판단 ("완료" 전 = running, 이후 = stopped).
- `CollapseControl` props(개념): `{ onCollapse }`. `PanelShell` 이 이 prop 을 받으면
  헤더에 렌더한다(없으면 미렌더 — 기존 사용처 영향 없음).

---

## UI State

| 컴포넌트 | 상태 | 트리거 | 표현 방식 |
|---|---|---|---|
| App | `viewState = expanded` | 기본값 / 새 document load / `CollapsedTimer` 활성화 | 현재 `screen` 화면 렌더 + `PanelShell` 헤더에 `CollapseControl` |
| App | `viewState = collapsed` | `CollapseControl` 클릭 / Enter / Space | `CollapsedTimer` pill 렌더. 기존 `screen` subtree 는 조건부 렌더링으로 unmount 될 수 있음(`App` state 는 유지) |
| CollapsedTimer | `running` | `App` 판단: "완료" 전 | 소형 Codit 아이콘 + 증가하는 `mm:ss`. 완료 아이콘 없음 |
| CollapsedTimer | `stopped` | `App` 판단: "완료" 이후 | 소형 Codit 아이콘 + 고정 `mm:ss` + 소형 check 아이콘 |
| CollapsedTimer (펼치기 트리거) | 항상 (`viewState = collapsed`) | 클릭 / Enter / Space | `viewState → expanded`. 직전 `screen`·입력값 그대로. accessible name = 동작 + 경과시간(+ stopped 시 "완료됨") — 아래 "Accessibility" 참조 |
| CollapseControl | 항상 표시 (`onCollapse` 주입 시) | — | 헤더 최우측 아이콘 버튼. `aria-label="Codit 타이머 접기"`. step 이 있으면 그 오른쪽 |
| PanelShell (기존 사용처) | `onCollapse` 미주입 | — | 접기 컨트롤 미렌더. 기존 레이아웃 불변 |

### 컴포넌트 간 영향

- `App.viewState` 가 `CollapsedTimer` vs 기존 `screen` 화면 렌더를 제어한다.
- `viewState` 변화는 `screen` / `result` / `memo` / `memoOpen` / `selectedTagIds` /
  `customTags` / `useTimer` 에 **영향을 주지 않는다** (`prd.md` ADR-5).
- `CollapsedTimer` 와 expanded `TimerDisplay` 는 **같은 `useTimer` 결과**를 읽는다 —
  표시가 자동으로 일관된다.

---

## Accessibility

### CollapsedTimer (펼치기 버튼)

pill 전체는 하나의 `<button>` 이며, **단순 `aria-label` 로 내부 텍스트를 덮어쓰지
않는다.** accessible name 은 "이름 계산(name from contents)" 으로 만든다 — 버튼 안의
텍스트 노드들이 순서대로 이어져 이름이 된다.

버튼 내부 구성(순서대로):

| 요소 | 접근성 처리 |
|---|---|
| Codit 마크 SVG | `aria-hidden="true"` (장식) |
| sr-only 문구 | 실제 텍스트 노드(`sr-only` 유틸로 시각적 숨김). 동작 의미 + (stopped 시) 상태를 보완 |
| 경과시간 `mm:ss` | 시각적으로 보이는 실제 텍스트 노드 — 이름 계산에 그대로 포함 |
| 완료 check SVG (stopped 만) | `aria-hidden="true"` (장식) — 상태 의미는 sr-only 문구가 전달 |
| 펼치기 chevron-up SVG (상시) | `aria-hidden="true"` (장식) — 펼치기 의미는 sr-only 문구가 전달 |

전달되어야 하는 accessible name (개념):

- **running**: `Codit 타이머 펼치기, 경과 시간 12:35`
  → sr-only `"Codit 타이머 펼치기, 경과 시간 "` + 보이는 `"12:35"`
- **stopped**: `Codit 타이머 펼치기, 완료됨, 풀이 시간 12:35`
  → sr-only `"Codit 타이머 펼치기, 완료됨, 풀이 시간 "` + 보이는 `"12:35"`

정확한 문구·구두점은 구현에서 조정 가능하되, **"펼치기 동작 + 현재 경과시간"** 이
반드시 이름에 포함되고, stopped 는 시각(아이콘)뿐 아니라 이름으로도 구분되어야 한다.

### aria-live 사용 안 함

경과시간 텍스트는 running 동안 갱신되지만 **`aria-live` / live region 을 쓰지 않는다.**
매 tick(약 500ms)마다 스크린리더가 시간을 읽게 하지 않는다. 사용자가 버튼에 포커스하거나
다시 탐색할 때 현재 이름(= 현재 시간 포함)을 얻는 것으로 충분하다.

### CollapseControl (접기 버튼)

아이콘만 있는 버튼이므로 `aria-label="Codit 타이머 접기"` 를 그대로 사용한다(보존할
보이는 텍스트가 없다). 내부 chevron SVG 는 `aria-hidden="true"`.

### 키보드

- `CollapsedTimer`, `CollapseControl` 모두 네이티브 `<button>` — Enter / Space 활성화,
  포커스 순서·포커스 링 기본 동작 유지.
- 접기/펼치기 후 포커스 유실을 막는다(권장: 전환 후 대응되는 컨트롤로 포커스 이동).
  구체 방식은 TDD 에서 확정.

---

## shadcn/ui 사용 컴포넌트

| 컴포넌트 | 용도 | 커스터마이징 |
|---|---|---|
| Button | `CollapseControl` (헤더 아이콘 버튼), `CollapsedTimer` pill 베이스 | `CollapseControl` = `variant="ghost" size="icon"`. pill = outline 계열 + 커스텀 크기(약 40px 높이 — 읽고 누를 수 있는 크기). |

- **아이콘 (전부 인라인 SVG)**: chevron-down(접기) · chevron-up(펼치기) · check(완료 표시) · Codit 마크(collapsed pill). lucide 미도입 원칙(`BrandHeader`, `SaveSuccessScreen` 동일).

- **신규 shadcn/ui 컴포넌트 없음.**
- **아이콘**: 전부 인라인 SVG. lucide 미도입 원칙(`BrandHeader`, `SaveSuccessScreen`
  와 동일). chevron-down(접기) / chevron-up(펼치기) / check(완료 표시) / Codit 마크(collapsed pill).

---

## Out of Scope (이번 Feature 제외 — UI 관련)

- pause / resume / reset 컨트롤
- collapsed 상태의 새로고침 후 복원 · 접힘/펼침 선호 저장 UI (Widget preference persistence)
- **위젯 위치 이동 (마우스 드래그)** — expanded/collapsed 공통 위치·경계 clamp·위치 영속·`#codit-root` 컨테이너 전환이 필요한 독립 feature. `feature-planner` 로 별도 착수 (Widget preference persistence 와 함께). 이번 feature 는 top-right 고정.
- collapsed pill 에 문제 번호 · 브랜드 텍스트 · 상태 문구("완료"/"진행중")
- running / stopped 를 **색상만으로** 구분
- 기존 Timer / Result / Memo / Tags 화면 레이아웃 변경 (헤더 접기 컨트롤 슬롯 추가 외)
- 전환 애니메이션의 구체 스펙 (구현 재량 — 즉시 전환도 허용)
- 모의 테스트 / Contest Problem / User Problem / Code Battle 등 지원 대상 외 SWEA 경로
