# widget-drag-move PRD

> 단계 2 산출물. "이 feature 가 궁금하면 여기만 보면 된다"는 단일 기준 문서.
> 요구사항 상세는 [spec-fixed.md](./spec-fixed.md).

## 1. 개요

Codit 플로팅 위젯(expanded 패널 / collapsed pill)을 **마우스 드래그로 화면 안에서 이동**
시키고, 이동한 위치를 `chrome.storage.local` 에 저장해 새로고침·재시작 후에도 유지한다.
데스크톱 마우스 전용. 위젯은 항상 뷰포트 안에 clamp 된다.

선행: timer-persistence Issue #15 (PR #18) 머지 후 착수.

## 2. 사용자 스토리

- **가림 회피**: SWEA 문제 풀이 중, 위젯이 지문/에디터를 가리면 드래그해서 비켜둘 수 있다.
- **선호 위치**: 위젯을 원하는 코너/위치에 두면 이후에도 거기 있다.
- **일관성**: expanded ↔ collapsed 를 오가도 위젯이 같은 위치에 머문다.
- **비파괴**: 드래그·저장이 실패해도 문제 풀이가 방해받지 않는다(에러 UI 없음, fail-soft).

## 3. 기술 결정

### ADR-1. 위치 저장소 = `chrome.storage.local`, 전역 1개 `{ top, left }`

**Context** — 시나리오 D(새로고침·재시작 후 위치 유지)를 만족하려면 Widget Position 을
어딘가 저장해야 한다. 후보: `chrome.storage.local` / `chrome.storage.session` / 백엔드.

**Decision** — `chrome.storage.local` 에 **전역 단일 키**(`local:widgetPosition`, WXT storage
헬퍼)로 `{ top: number, left: number }`(뷰포트 좌상단 기준 px)를 저장한다. 값이 없으면
Default position(현재 top-right 20/20 동작). 읽을 때 항상 뷰포트 안으로 clamp 한다.

**Alternatives**
- `chrome.storage.session` — 브라우저 재시작/확장 리로드 시 초기화되어 시나리오 D 및
  "선호 위치" 취지(매일 아침 위치가 사라지면 안 됨)에 반한다. content script 에서 직접
  접근 불가 → background `setAccessLevel` 필요(timer-persistence #16 이 짊어진 복잡성).
- 백엔드 저장 — 크로스 디바이스는 요구사항에 없고, 선호 저장 API·auth(현재 Social Login
  mock)가 필요해 과하다.
- 문제별 위치 저장 — 위젯 위치는 앱 전역 선호. 문제마다 위치가 달라지면 혼란스럽고 이득 없음.

**Consequences**
- (+) content script 직접 read/write, background 불필요. `"storage"` permission 1개만 추가.
- (+) 데이터가 `{top,left}` 숫자 2개 → 크기·쓰기 부하 무시 가능.
- (−) 디바이스 로컬 — 다른 PC 에서는 위치가 공유되지 않는다(의도된 한계).
- (−) `storage.local` 은 async → 초기 렌더 시 위치 깜빡임 위험(ADR-4 로 대응).

### ADR-2. 아키텍처 = App 레벨 훅 + `#codit-root` ref 주입 (안 A)

**Context** — 실제로 움직이는 DOM(`#codit-root`, `position: fixed`)은 Shadow DOM **밖**에
있고, 위치 상태·드래그 제스처·storage 동기를 어디서 소유할지 정해야 한다.

**Decision** — `mount.tsx` 가 `#codit-root` element 를 `<App containerEl={container}>` 로
주입한다. `App` 이 `useWidgetPosition(containerEl)` 훅을 호출하고, 훅이 (1) storage
read/write, (2) clamp, (3) `storage.onChanged` 구독, (4) `containerEl` 의 위치 style
갱신, (5) `dragHandlers`(pointer 핸들러 묶음) 반환을 담당한다. `App` 은 `dragHandlers` 를
`PanelShell`(헤더) / `CollapsedTimer`(pill) 에 prop 으로 전달한다. `useTimer` 와 동일 패턴.

**Alternatives**
- 안 B (mount.tsx 의 vanilla 드래그 컨트롤러) — 드래그는 가장 부드럽지만, pill 의
  클릭(펼치기)↔드래그 조율이 React↔vanilla 경계를 넘나들어 복잡하고, 통합 테스트
  (클릭→펼침, 드래그→이동)가 어렵다.
- 안 C (`WidgetPositionProvider` Context + `document.getElementById`) — 이 앱은 Context 를
  쓰지 않고 `App` 이 상태를 소유하는 관습이다. 새 패턴 도입 + ID 문자열 암묵 결합.

**Consequences**
- (+) `useTimer` 패턴 재사용 → 코드베이스 일관성. 테스트가 `renderHook` + `App.test.tsx`
  pointer 이벤트 시뮬(Issue #15 방식) 그대로.
- (+) `#codit-root` 주입이 명시적 — 경계 넘는 vanilla 로직도, `getElementById` 결합도 없음.
- (−) 훅이 React 밖 DOM(`containerEl`)을 명령형으로 조작 — 순수 함수형이 아닌 부수효과.
- (−) `containerEl` prop 을 `mount.tsx` → `App` → (핸들러는) 하위 컴포넌트로 전달(약간의
  prop drilling). 단 Issue #15 의 `collapseControlRef` 전달과 동일 수준.

### ADR-3. 드래그 vs 클릭 구분 = 이동 거리 임계값, 드래그 핸들 = 헤더 / pill 전체

**Context** — collapsed pill 은 버튼 하나로 "펼치기"(클릭)와 "이동"(드래그)을 겸해야 한다.
브라우저는 둘을 자동 구분하지 못한다. expanded 패널은 드래그 핸들을 정해야 한다.

**Decision**
- **pill**: 아무 곳이나 눌러 드래그 가능. `pointerdown`~`pointerup` 이동 거리가 **5px
  미만이면 클릭(펼치기)**, 5px 이상이면 드래그(펼치기 억제). 임계값은 구현 중 조정 가능.
- **expanded 패널**: **PanelShell 헤더**가 드래그 핸들(OS 창 타이틀바와 동일). 접기 버튼·
  본문·푸터는 드래그 대상 아님. 헤더엔 클릭 동작이 없어 모호성 자체가 없다.
- 드래그 가능 영역 hover 시 `cursor: grab`, 드래그 중 `cursor: grabbing`.

**Alternatives**
- 별도 드래그 핸들 아이콘(grip)을 pill 에 추가 — "최소 침습 pill"(timer-persistence
  Product Decision #1)과 상충, 작은 타겟.
- 길게 누르기(hold 300ms → 드래그) — 발견 불가, 느림.
- 임계값 0px(조금이라도 움직이면 드래그) — 클릭 시 손 떨림 1~2px 때문에 펼치기가 자주 실패.

**Consequences**
- (+) pill 시각 변화 0. "위젯 = 옮길 수 있는 창"이라는 보편 멘탈모델.
- (+) expanded 는 헤더 = 관용적, 구현 단순.
- (−) pill 을 아주 천천히 크게 눌렀다 떼면(5px 이상) 펼치기가 안 될 수 있다 — 학습 가능한
  수준이고 임계값 튜닝으로 완화.
- (−) 발견 가능성은 `cursor` 힌트에만 의존(명시적 핸들 없음).

### ADR-4. positioning 전환 = `top/left` + 드래그 중 `transform`, 초기 렌더는 위치 확정 후

**Context** — `#codit-root` 는 현재 `top: 20px; right: 20px` 고정. JS 로 이동하려면
`right` 앵커를 버려야 하고, 드래그 중 매 프레임 `top/left` 를 바꾸면 layout/paint 비용이
있다. 또 `storage.local.get` 이 async 라 기본 위치로 떴다가 저장 위치로 점프할 수 있다.

**Decision**
- `#codit-root` 를 `top/left` 기반으로 전환한다. Default position 은 계산해서
  `left = viewportWidth - widgetWidth - 20` 형태로 초기화.
- **드래그 중**에는 `transform: translate3d(dx, dy, 0)` 로 이동(컴포지터 전용, GPU),
  `pointermove` 는 `requestAnimationFrame` 으로 throttle(프레임당 1회 DOM 갱신).
- **`pointerup`** 시 최종 위치를 `top/left` 로 확정하고 `transform` 리셋, storage 에 1회 저장.
- **초기 mount**: `storage.local.get` 완료 전까지 `#codit-root` 를 `visibility: hidden`,
  위치 확정 후 표시 → 깜빡임 0.
- `resize` 시 저장값을 현재 뷰포트에 맞춰 재clamp(저장값 자체는 보존, 표시만 보정).

**Alternatives**
- 항상 `top/left` 직접 갱신(transform 안 씀) — 컨테이너가 1개뿐이라 대부분 문제 없지만,
  저사양·복잡한 SWEA 페이지에서 프레임 드랍 여지. transform 이 안전.
- 초기 렌더 시 기본 위치로 먼저 그리고 나중에 이동 — 깜빡임 발생, UX 저하.

**Consequences**
- (+) 드래그가 60fps 목표에 부합. 초기 깜빡임 없음.
- (−) `right` 앵커를 버리므로, 창 크기가 바뀌면 위젯이 우측 가장자리에 "붙어" 있지 않고
  clamp 로직으로 밀어 넣는다(도킹/스냅은 Out of Scope).
- (−) 드래그 종료 시 `transform`→`top/left` 스왑에서 1프레임 어긋남 가능 — 같은 좌표로
  계산하면 눈에 안 띔.

### ADR-5. 다중 탭 = `storage.onChanged` 실시간 동기, 저장은 fail-soft

**Context** — 여러 SWEA 탭이 열려 각각 위젯이 있을 때, 한 탭에서 옮기면 다른 탭은?
그리고 storage 쓰기가 실패하면?

**Decision**
- `useWidgetPosition` 이 `chrome.storage.onChanged` (area `local`, key `widgetPosition`)를
  구독한다. 다른 탭이 위치를 바꾸면 **현재 탭 위젯도 같은 위치로 이동**한다(드래그 중이
  아닐 때).
- 저장 실패(`quota`, `Extension context invalidated`, API 에러)는 **조용히 삼킨다** —
  위젯은 드래그한 위치에 인메모리로 유지, `console.warn` 1줄, 에러 UI 없음. 다음 이동 시 재시도.
- 읽기 실패 = Default position 폴백(손상값 케이스와 동일 경로).

**Alternatives**
- "다음 로드 때만 반영"(onChanged 미구독) — 구현은 더 단순하나, 두 탭 위젯이 다른 위치에
  있는 상태가 오래 지속되면 일관성이 깨진 느낌.
- 저장 실패 시 토스트/배너 — SWEA 문제 풀이를 방해. 위치 저장 실패는 그 정도 사안이 아님.

**Consequences**
- (+) 어느 탭에서 옮겨도 전체가 일관. 저장 실패해도 이동은 항상 동작(로컬 상태).
- (−) `onChanged` 리스너를 탭마다 유지 — 비용은 미미하나 cleanup 누락 시 누수. 훅
  cleanup 으로 관리.
- (−) 드래그 중 다른 탭 변경이 오면 무시해야 함(현재 드래그 우선) — 훅에 `isDragging` 가드 필요.

## 4. Out of Scope

- 패널 **크기 조절(resize)** — 드래그 인프라(pointer capture·rAF·clamp)는 재사용 가능하게
  두되 이번 구현엔 없음
- 화면 **가장자리 스냅 / 도킹**
- **크로스 디바이스 위치 동기**(백엔드 저장) — `useWidgetPosition` 이 저장 계층을 캡슐화해
  여지만 남김
- **문제별 / 페이지별 위치 저장** — Widget Position 은 전역 1개 (ADR-1)
- **터치 제스처 전용 UX 검증** — 데스크톱 마우스 전용. pointer 이벤트로 구현하되 터치는
  별도 검증하지 않음
- 드래그 **관성(inertia) / 애니메이션** 효과
- 위젯 **크기·투명도 등 기타 외형 커스터마이징** — 이 feature 는 위치만
- **popup / sidepanel 위치 이동** — 브라우저 chrome 관할
- **다중 모니터 간 이동** — 브라우저 뷰포트 범위 내로 제한
- **"기본 위치로 초기화" 버튼** — clamp 로 위젯이 화면 밖으로 사라지지 않으므로 되돌리려면
  드래그하면 된다. 별도 UI 어피던스 부담 대비 이득이 낮아 fast-follow 로 분리.

## 5. 용어 정의

[spec-fixed.md 용어 정의](./spec-fixed.md#용어-정의-ubiquitous-language) 를 따른다.
핵심: **Widget Position**(`{top,left}` px, 뷰포트 기준, 전역 1개) · **Default position**
(top-right 20/20) · **Drag handle**(expanded=헤더, collapsed=pill 전체) · **Drag threshold**
(5px) · **Clamp** · **`#codit-root`**(이동되는 fixed 컨테이너, Shadow DOM 밖) ·
**`useWidgetPosition`**(가칭 훅).
