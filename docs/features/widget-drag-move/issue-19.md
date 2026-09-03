# Issue 19: [widget-drag-move] expanded 패널을 헤더 드래그로 이동

> test-scenarios 산출물. 기준: [prd.md](./prd.md) ADR-1~5 · [spec-fixed.md](./spec-fixed.md) · [issues.md](./issues.md).
> Vertical Slice #1 / 3. 저장 없음(인메모리) — 영속은 Issue #21.

## 시그니처

### 프론트엔드 (TypeScript)

#### 신규 `apps/extension/entrypoints/content/useWidgetPosition.ts`

```ts
import type { PointerEvent as ReactPointerEvent } from 'react';

/** 위젯의 화면 내 위치. 뷰포트 좌상단 기준 px. 전역 1개. (ADR-1) */
export interface WidgetPosition {
    top: number;
    left: number;
}

export interface Size {
    width: number;
    height: number;
}

/**
 * 위젯 전체가 뷰포트 안에 남도록 위치를 경계 안으로 보정한다. (ADR-4 Clamp)
 * 위젯이 뷰포트보다 크면 해당 축의 top/left 를 0 으로 고정한다.
 */
export function clampPosition(pos: WidgetPosition, widget: Size, viewport: Size): WidgetPosition;

/** PanelShell 헤더 등 드래그 핸들에 스프레드하는 pointer 핸들러 묶음. */
export interface WidgetDragHandlers {
    onPointerDown: (event: ReactPointerEvent) => void;
}

export interface UseWidgetPositionResult {
    dragHandlers: WidgetDragHandlers;
}

/**
 * `#codit-root`(Shadow DOM 밖의 position:fixed 컨테이너)의 위치를 소유하는 훅. (ADR-2)
 *
 * - mount 시 containerEl 의 실제 크기를 측정해 Default position(top-right, margin 20)으로
 *   초기화하고 `right` 앵커를 제거한 뒤 `top/left` 로 전환한다.
 *   (useLayoutEffect — paint 전 실행이라 깜빡임 없음)
 * - dragHandlers 로 헤더 드래그를 받는다: pointermove 중 `transform: translate3d`(rAF throttle),
 *   pointerup 시 최종 위치를 clamp 해 `top/left` 로 확정하고 transform 을 리셋한다.
 * - 드래그 중 containerEl 에 `data-dragging` 을 부여하고 document 에 `user-select: none` 을
 *   적용한다. `setPointerCapture` 로 포인터를 고정한다.
 * - `resize` 시 현재 위치를 새 뷰포트에 맞춰 재clamp 한다.
 * - storage 연동은 없다 — 새로고침 시 Default position 으로 복귀한다 (영속은 Issue #21).
 *
 * @param containerEl `#codit-root` element. null/undefined 면(테스트 등) DOM 부수효과를 건너뛴다.
 */
export function useWidgetPosition(
    containerEl: HTMLElement | null | undefined,
): UseWidgetPositionResult;
```

상수: `DEFAULT_MARGIN = 20`, `DRAG_THRESHOLD_PX = 5`.

#### 수정 `apps/extension/entrypoints/content/mount.tsx`

`#codit-root` 의 `position:fixed` / `zIndex` / `top:20px` / `right:20px` 초기 인라인 스타일은
그대로 둔다(첫 페인트 정확성 — 훅이 `useLayoutEffect` 에서 `top/left` 로 전환). 변경점은 주입뿐:

```tsx
ReactDOM.createRoot(app).render(<App problemId={problemId} containerEl={container} />);
```

#### 수정 `apps/extension/entrypoints/content/App.tsx`

```ts
interface AppProps {
    problemId: string;
    /** `#codit-root` element (mount.tsx 주입). 위치·드래그 제어용. 테스트에서 생략 가능. */
    containerEl?: HTMLElement | null;
}
```

- `const { dragHandlers } = useWidgetPosition(containerEl);`
- expanded 각 screen 렌더에 `dragHandlers={dragHandlers}` 전달.
- collapsed 브랜치(`CollapsedTimer`)는 이 이슈에서 건드리지 않는다 (Issue #20).

#### 수정 screen 5종

`TimerScreen` / `ResultSelectScreen` / `MemoScreen` / `TagSelectScreen` / `SaveSuccessScreen`
— `onCollapse` · `collapseControlRef` 와 동일한 통과 전달 패턴.

```ts
interface XxxScreenProps {
    // ...기존
    dragHandlers?: WidgetDragHandlers; // → <PanelShell dragHandlers={dragHandlers}>
}
```

#### 수정 `apps/extension/components/codit/panel-shell.tsx`

```ts
interface PanelShellProps {
    // ...기존 (title, step, onCollapse, collapseControlRef, children, footer, className)
    /**
     * 주어지면 헤더가 드래그 핸들이 된다 (hover 시 cursor: grab).
     * 접기 버튼 위에서 시작한 pointerdown 은 드래그로 처리하지 않는다.
     */
    dragHandlers?: { onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void };
}
```

- 헤더 `<div>` 에 `onPointerDown` 연결 + `dragHandlers` 있을 때 `cursor-grab` 클래스.
- 접기 `<Button>` 에 `data-codit-no-drag` 표식 → 헤더 핸들러가 해당 target 이면 early return.
- 본문·푸터는 핸들러를 받지 않으므로 자동 제외.
- `WidgetDragHandlers` 타입은 `useWidgetPosition.ts` 가 export 하되, PanelShell 은
  구조적 인라인 타입으로 선언한다 (`components/` → `entrypoints/` 역방향 import 회피).

### 에러 케이스

| 조건 | 동작 |
|---|---|
| `containerEl` 이 null/undefined | `dragHandlers` 는 정상 반환, DOM 위치 갱신만 skip. throw 안 함 |
| `getBoundingClientRect()` 가 0 반환 (jsdom / 미부착 element) | clamp 결과를 `max(0, …)` 로 보정 |
| pointerdown target 이 접기 버튼 (`data-codit-no-drag`) | 드래그 미시작. 접기 `onClick` 정상 발동 |
| 드래그 중 `pointercancel` | `pointerup` 과 동일 처리 — 현재 위치에서 종료, 리스너·`user-select`·`data-dragging` 정리 |
| 헤더에서 pointer 이동 < 5px 후 pointerup | 위치 변경 커밋 안 함 (클릭으로 간주) |

---

## 테스트 시나리오

### 정상

- `[정상] clampPosition` — 위젯이 뷰포트 안에 완전히 들어오면 위치를 그대로 반환한다
- `[정상] useWidgetPosition` — mount 시 `#codit-root` 를 측정된 폭 기준 top-right(`left = innerWidth - width - 20`, `top = 20`)로 두고 `right` 인라인 스타일을 제거한다
- `[정상] useWidgetPosition` — `dragHandlers.onPointerDown` 을 담은 객체를 반환한다
- `[정상] 헤더 드래그` — 헤더 pointerdown→move→pointerup 시 `#codit-root` 의 `left`/`top` 이 포인터 이동량만큼 바뀐다 (시나리오 A: (100,100)→(300,250) ⇒ +200 / +150)
- `[정상] 헤더 드래그` — 어떤 드래그 후에도 위젯 전체가 뷰포트 안에 남는다
- `[정상] resize` — 창을 줄여 위젯이 밖에 놓일 상황이면 `resize` 시 위젯을 새 경계 안으로 재배치한다 (시나리오 D)
- `[정상] 드래그 부작용 방지` — 드래그 중 document 에 `user-select: none` + `#codit-root` 에 `data-dragging` 을 적용하고 pointerup 시 되돌린다
- `[정상] 드래그 커서` — 드래그 중 `document.body` 커서가 `grabbing` 이 되고 pointerup 시 되돌아온다 (AC-6)
- `[정상] 재mount` — 영속이 없으므로 새로 mount 하면 Default position(top-right)으로 돌아온다 (AC-7)
- `[정상] #15 회귀` — 접기/펼치기·포커스 이동이 그대로 동작한다 (기존 `App.test.tsx` collapse 스위트 유지로 커버)

### 경계

- `[경계] clampPosition` — 오른쪽으로 넘치면 위젯 오른쪽 끝이 뷰포트 오른쪽 끝에 맞도록 `left` 를 보정한다
- `[경계] clampPosition` — 아래로 넘치면 위젯 아래 끝이 뷰포트 아래 끝에 맞도록 `top` 을 보정한다
- `[경계] clampPosition` — 좌·상단으로 음수가 되면 `top`/`left` 를 0 으로 보정한다
- `[경계] 헤더 드래그 clamp` — 위젯이 우측 경계 근처일 때 헤더를 화면 밖까지 오른쪽으로 끌면 오른쪽 끝에서 멈춘다 (시나리오 B)
- `[경계] 헤더 미세 이동` — 헤더에서 5px 미만 이동 후 pointerup 하면 위치 변경을 커밋하지 않는다
- `[경계] resize` — 위젯이 여전히 뷰포트 안이면 `resize` 시 위치가 그대로다

### 예외

- `[예외] clampPosition` — 위젯이 뷰포트보다 크면 해당 축의 `top`/`left` 를 0 으로 고정한다
- `[예외] useWidgetPosition` — `containerEl` 이 null/undefined 면 throw 없이 DOM 부수효과를 건너뛰고 `dragHandlers` 는 반환한다
- `[예외] 헤더 접기 버튼` — 접기 버튼을 이동 없이 클릭하면 접기로 동작한다(드래그로 오인 안 함) (시나리오 C)
- `[예외] 헤더 접기 버튼` — pointerdown target 이 접기 버튼이면 드래그를 시작하지 않는다
- `[예외] 헤더 드래그 취소` — 드래그 중 `pointercancel` 이 오면 현재 위치에서 종료하고 리스너·`user-select`·`data-dragging` 을 정리한다

---

## AC 커버리지

| AC | 커버 시나리오 |
|---|---|
| AC-1 헤더 드래그로 `left`/`top` 이동 | `[정상] 헤더 드래그` (시나리오 A) |
| AC-2 clamp — 뷰포트 밖으로 안 나감 | `[경계] 헤더 드래그 clamp` (B) + `[경계] clampPosition` 3종 + `[예외] clampPosition` |
| AC-3 `resize` 시 경계 안 재배치 | `[정상] resize` (D) + `[경계] resize` |
| AC-4 접기 버튼 클릭(이동<5px) = 접기 | `[예외] 헤더 접기 버튼` 2종 (C) + `[경계] 헤더 미세 이동` |
| AC-5 드래그 중 SWEA 텍스트 선택 안 됨 | `[정상] 드래그 부작용 방지` (`user-select: none` + pointer capture) |
| AC-6 hover `grab` / 드래그 중 `grabbing` | PanelShell `cursor-grab` 클래스 (`panel-shell.test.tsx`) + `[정상] 드래그 커서` (`document.body` `grabbing`) |
| AC-7 새로고침 시 Default position 복귀 | `[정상] 재mount` |
| AC-8 timer-persistence #15 회귀 없음 | `[정상] #15 회귀` (기존 collapse 스위트 유지) |

---

## E2E 결정 — 스킵

이 이슈는 E2E 테스트를 작성하지 않는다.

- `e2e/` 인프라가 아직 없다 (프로젝트 첫 E2E). Chrome Extension E2E 셋업(`headless:false` + 확장 로드 + SWEA URL fixture)은 그 자체로 별도 작업이다.
- widget-drag-move 는 #19/#20/#21 3개 이슈다. #19 만 단독 E2E 를 짜면 #20(pill 드래그)·#21(영속·다중 탭)에서 재작업이 발생한다 — feature 완성 후 한 번에 작성하는 편이 리뷰·유지보수에 유리하다.
- 선례: timer-persistence #15 (PR #18) 도 E2E 없이 머지 (create-pr 자동 스킵).
- #19 핵심 로직(`clampPosition` 순수 함수 + `useWidgetPosition` 훅 + App 통합 11개)은 단위 테스트로 충분히 커버된다. 미커버는 rAF `transform` 프리뷰와 pointer capture 뿐 (시각 효과, 회귀 위험 낮음).

widget-drag-move E2E 는 별도 "E2E 인프라 + 핵심 플로우" 이슈 또는 #21 완료 시점에 인프라와 함께 구축한다.
(Timer 흐름·Problem History 도 같은 유예 상태 — `frontend-handoff.md §7` 참고)
