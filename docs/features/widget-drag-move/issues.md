# widget-drag-move 이슈 분해

> 단계 3 산출물. 기준: [prd.md](./prd.md) · [spec-fixed.md](./spec-fixed.md).
> 3개 Vertical Slice = GitHub Issues (team `Yejin0O0/codit`): **#19 / #20 / #21**.
> 권장 구현 순서 #19 → #20 → #21. 기술 의존: #20→#19, #21→#19.
>
> **feature 착수 전제**: timer-persistence Issue #15 (PR #18) 머지 완료.
> `mount.tsx`·`App.tsx`·`panel-shell.tsx`·`collapsed-timer.tsx` 를 다수 수정하므로 그 위에서 시작.

## 공통 구현 제약

- **저장소** = `chrome.storage.local` 전역 단일 키 (`local:widgetPosition`, WXT storage 헬퍼).
  `{ top: number, left: number }` 뷰포트 좌상단 기준 px. (prd.md ADR-1)
- **아키텍처** = `mount.tsx` 가 `#codit-root` 를 `<App containerEl>` 로 주입 → `App` 이
  `useWidgetPosition(containerEl)` 사용 → `dragHandlers` 를 `PanelShell`/`CollapsedTimer` 로
  prop 전달. `useTimer` 와 같은 훅 패턴. (ADR-2)
- **드래그 = `transform: translate3d` + rAF throttle**, `pointerup` 시 `top/left` 확정. (ADR-4)
- **clamp** — 위젯 전체가 항상 뷰포트 안. mount·`resize` 시 재clamp(저장값은 보존). (ADR-4)
- **fail-soft** — 이동은 항상 동작(로컬 상태). 저장 실패는 `console.warn` 1줄 + 무음.
  에러 토스트/모달/배너 없음. (ADR-5)
- `packages/shared-types` 수정 금지. 백엔드 무관.
- timer-persistence Issue #15 회귀 금지 (접기/펼치기·포커스 이동·collapsed pill 구성).

---

## Issue 1 (#19): [widget-drag-move] expanded 패널을 헤더 드래그로 이동

### 설명

Widget Position 의 기반을 세우고 expanded 패널을 헤더로 드래그해 옮길 수 있게 한다.

- **신규**: `apps/extension/entrypoints/content/useWidgetPosition.ts` — 인메모리 Widget
  Position state, clamp, `dragHandlers`(pointerdown/move/up 묶음). storage 연동은 Issue 3.
  `apps/extension/entrypoints/content/useWidgetPosition.test.ts`.
- **수정**:
  - `mount.tsx` — `#codit-root` 를 `top: 20px; right: 20px` → `top/left` 기반으로 전환.
    Default position 계산(`left = innerWidth - widgetWidth - 20`). `#codit-root` element 를
    `<App containerEl={container}>` 로 주입.
  - `App.tsx` — `useWidgetPosition(containerEl)` 호출, `dragHandlers` 를 각 screen 의
    `<PanelShell>` 로 전달.
  - `panel-shell.tsx` — `dragHandlers?` prop. 주어지면 헤더 `<div>` 에 pointer 핸들러 +
    `cursor: grab` / 드래그 중 `grabbing`. 접기 버튼·본문·푸터는 제외.

저장 없음 — 이 이슈만으로는 새로고침 시 Default position 으로 복귀한다.

### 완료 조건 (Acceptance Criteria)

- [ ] expanded 화면에서 헤더를 pointerdown → 이동 → pointerup 하면 `#codit-root` 의
      `left`/`top` 이 이동량만큼 바뀐다
- [ ] 드래그 결과 위젯 전체가 뷰포트 밖으로 나가지 않는다 (clamp)
- [ ] 창을 줄여 저장/현재 위치가 뷰포트 밖이 되면 `resize` 시 위젯이 경계 안으로 재배치된다
- [ ] 헤더의 **접기 버튼 클릭**(이동 < 5px)은 접기로 동작한다 (드래그로 오인하지 않음)
- [ ] 드래그 중 SWEA 페이지 텍스트가 선택되지 않는다 (`user-select: none` + pointer capture)
- [ ] 헤더 hover 시 `cursor: grab`, 드래그 중 `cursor: grabbing`
- [ ] 이 이슈 단독 상태에서 새로고침하면 위젯이 Default position(top-right)으로 돌아온다
- [ ] timer-persistence #15 기능(접기/펼치기, 포커스 이동)에 회귀 없음

### 시나리오

**시나리오 A — 헤더로 패널 이동**
**Given** expanded 타이머 화면, 위젯이 Default position
**When** 헤더를 pointer 로 (100,100) → (300,250) 드래그
**Then** `#codit-root` 의 `left`/`top` 이 각각 +200 / +150 (clamp 범위 내)

**시나리오 B — clamp**
**Given** 위젯이 뷰포트 우측 경계 근처
**When** 헤더를 오른쪽으로 화면 밖까지 드래그
**Then** 위젯 오른쪽 끝이 뷰포트 오른쪽 끝에서 멈춘다 (밖으로 안 나감)

**시나리오 C — 접기 버튼 보존**
**Given** expanded 화면
**When** 헤더의 접기 버튼을 클릭 (pointer 이동 없음)
**Then** collapsed 로 전환된다 (드래그로 처리되지 않음)

**시나리오 D — resize 재clamp**
**Given** 위젯을 뷰포트 우하단으로 옮긴 상태
**When** 브라우저 창을 작게 리사이즈해 위젯이 밖에 놓일 상황
**Then** 위젯이 새 뷰포트 경계 안으로 재배치된다

---

## Issue 2 (#20): [widget-drag-move] collapsed pill 이동 + 클릭/드래그 구분

### 설명

collapsed pill 도 드래그로 옮길 수 있게 하되, pill 클릭(펼치기)과 드래그(이동)를 구분한다.
Widget Position 은 Issue 1 의 `useWidgetPosition` 을 공유하므로 expanded ↔ collapsed 전환
시 위치가 자동으로 이어진다.

- **수정**:
  - `collapsed-timer.tsx` — `dragHandlers?` prop 연결. `pointerdown` ~ `pointerup` 이동 거리
    **< 5px → 기존 `onExpand`(펼치기)**, ≥ 5px → 드래그(펼치기 억제). `cursor: grab` /
    드래그 중 `grabbing`. Enter/Space 는 그대로 `onExpand`.
  - `App.tsx` — `<CollapsedTimer dragHandlers={...}>` 전달.
  - `useWidgetPosition.ts` — 필요 시 클릭/드래그 판정 헬퍼(이동 거리 계산) 노출.

의존: Issue 1 (`useWidgetPosition` + `mount.tsx` positioning).

### 완료 조건 (Acceptance Criteria)

- [ ] pill 을 5px 이상 드래그하면 위젯이 이동하고 **펼쳐지지 않는다**(screen 은 collapsed 유지)
- [ ] pill 을 5px 미만 이동 후 떼면(= 클릭) 펼쳐진다 (기존 동작 유지)
- [ ] pill 을 드래그해 옮긴 뒤 클릭해 펼치면 expanded 패널이 **옮긴 위치**에 나타난다
      (Default position 으로 튀지 않음)
- [ ] expanded 에서 헤더로 옮긴 뒤 접으면 pill 이 **그 위치**에 나타난다
- [ ] pill 드래그도 clamp 가 적용된다
- [ ] pill hover 시 `cursor: grab`, 드래그 중 `grabbing`
- [ ] Enter / Space 키로는 여전히 펼쳐진다 (키보드 접근성 유지 — #15 회귀 없음)

### 시나리오

**시나리오 A — pill 드래그 이동**
**Given** collapsed 상태, 위젯이 Default position
**When** pill 을 (50,50) → (200,300) 으로 드래그 (이동 > 5px)
**Then** 위젯이 이동하고, 여전히 collapsed 다 (펼쳐지지 않음)

**시나리오 B — pill 클릭 = 펼치기**
**Given** collapsed 상태
**When** pill 을 pointerdown → 3px 이동 → pointerup
**Then** expanded 로 전환된다

**시나리오 C — 상태 전환 시 위치 유지**
**Given** pill 을 드래그해 화면 좌하단으로 옮김
**When** pill 을 클릭해 펼침
**Then** expanded 패널이 좌하단(옮긴 위치, clamp 후)에 렌더된다

---

## Issue 3 (#21): [widget-drag-move] 위치 영속 + 다중 탭 동기

### 설명

옮긴 위치를 `chrome.storage.local` 에 저장하고 mount 시 복원한다. 여러 SWEA 탭 간 위치를
실시간 동기하고, 저장/읽기 실패는 fail-soft 처리한다.

- **수정**:
  - `useWidgetPosition.ts` — `pointerup`(드래그 종료) 시 `{ top, left }` 저장.
    mount 시 읽어서 복원 — 읽기 완료 전 `#codit-root` `visibility: hidden`, 확정 후 표시.
    `chrome.storage.onChanged`(area `local`, key `widgetPosition`) 구독 → 다른 탭 변경 시
    현재 탭 위젯 이동(드래그 중이면 무시). 손상값/읽기 실패 → Default position 폴백.
    저장 실패 → `console.warn` 1줄, 인메모리 유지.
  - `wxt.config.ts` — `manifest.permissions` 에 `"storage"` 추가.
  - (선택) `apps/extension/entrypoints/content/widget-position-storage.ts` — WXT storage 키
    정의 + 타입 가드.

의존: Issue 1 (`useWidgetPosition`). Issue 2 와는 독립이나 권장 순서상 뒤.

### 완료 조건 (Acceptance Criteria)

- [ ] 위젯을 옮긴 뒤 페이지를 새로고침하면 옮긴 위치(clamp 후)에 나타난다
- [ ] 저장된 위치가 없으면 Default position(top-right)
- [ ] 저장된 값이 손상(NaN / 형식 오류 / 범위 밖)이면 Default position 폴백 + 다음 저장 시 덮어씀
- [ ] mount 시 Default position 으로 깜빡였다가 이동하는 현상이 없다 (위치 확정 후 첫 표시)
- [ ] 탭 A 에서 위젯을 옮기면 탭 B 의 위젯도 같은 위치로 이동한다 (`storage.onChanged`)
- [ ] 드래그 중에는 다른 탭의 위치 변경을 무시한다 (현재 드래그 우선)
- [ ] `chrome.storage.local.set` 이 실패해도 위젯은 드래그한 위치에 유지되고 화면에 에러 UI 가 없다
- [ ] `wxt.config.ts` 에 `"storage"` permission 이 있고, 그 외 권한은 추가되지 않았다

### 시나리오

**시나리오 A — 새로고침 후 복원**
**Given** 위젯을 (400,300) 으로 옮김 (storage 저장됨)
**When** 페이지를 새로고침
**Then** 위젯이 (400,300) 근처(clamp 후)에 나타난다. Default position 깜빡임 없음

**시나리오 B — 다중 탭 동기**
**Given** 탭 A·B 에 각각 위젯 mount
**When** 탭 A 에서 위젯을 드래그해 옮김
**Then** 탭 B 의 위젯도 같은 위치로 이동한다

**시나리오 C — 저장 실패 fail-soft**
**Given** `chrome.storage.local.set` 이 throw 하도록 mock
**When** 위젯을 드래그해 옮기고 놓음
**Then** 위젯은 놓은 위치에 있고, `console.warn` 이 찍히며, 화면에 에러 표시가 없다

**시나리오 D — 손상값 폴백**
**Given** `local:widgetPosition` 에 `{ top: NaN }` 저장됨
**When** 위젯 mount
**Then** Default position(top-right)으로 렌더되고, 이후 드래그 시 정상값으로 덮어쓴다

---

## GitHub 등록

team repo `Yejin0O0/codit`. labels: `✨ enhancement`, `🎨 FE` (#20 은 `♿ accessibility` 추가).
GitHub Issues **#19 / #20 / #21** 등록 완료. 상호 크로스링크 코멘트 완료.

---

## 진행 상태 / 다음 작업 (재개 노트)

- **feature-planner = 완료.** spec-original / spec-fixed / prd / issues 4개 문서 + GitHub
  #19·#20·#21 등록까지 끝. 이 스킬로 더 할 것 없음.
- 이 계획 문서는 개인 포크(`origin` = `KimDongHwan12/codit_fe`)의
  `docs/widget-drag-move-planning` 브랜치에 있음 (team PR 은 아직 안 만듦).
- **선행 = timer-persistence Issue #15 → PR #18 (`feat/timer-persistence-widget-collapse`
  → team `develop`, `Closes #15`) 머지 대기.**
- **다음 단계**:
  1. PR #18 머지 확인 (안 됐으면 그것부터).
  2. team `develop` 최신화 → `/tdd-loop 19` (widget-drag-move Slice #1).
  3. 이후 `/tdd-loop 20` → `/tdd-loop 21`.
  4. 이 계획 문서는 정식 docs PR 로 team `develop` 에 착지시킬지 판단 (PR #14 방식).
- **주의**: #19~#21 은 `mount.tsx`·`App.tsx`·`panel-shell.tsx`·`collapsed-timer.tsx` 를
  수정 — timer-persistence #16/#17 과 같은 파일. 브랜치 순차 진행 + rebase 필요.
