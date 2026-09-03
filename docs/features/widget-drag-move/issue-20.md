# Issue 20: [widget-drag-move] collapsed pill 이동 + 클릭/드래그 구분

> test-scenarios 산출물. 기준: [prd.md](./prd.md) ADR-3 · [spec-fixed.md](./spec-fixed.md) · [issues.md](./issues.md).
> Vertical Slice #2 / 3. 의존: #19 (`useWidgetPosition` + `#codit-root` positioning).

## 시그니처

### 프론트엔드 (TypeScript)

#### 수정 `apps/extension/entrypoints/content/collapsed-timer.tsx`

```ts
import { cn } from '@/lib/utils';
import type { WidgetDragHandlers } from './useWidgetPosition';

interface CollapsedTimerProps {
    seconds: number;
    status: 'running' | 'stopped';
    onExpand: () => void;
    ref?: Ref<HTMLButtonElement>;
    dragHandlers?: WidgetDragHandlers; // 신규
}
```

- `<Button>` 에 `onPointerDown={dragHandlers?.onPointerDown}` + `cn('h-10 gap-2 px-3.5', dragHandlers && 'cursor-grab')`
- `onClick={onExpand}` **그대로 유지** — 키보드 Enter/Space 는 button 기본 click 발동으로 커버 (별도 코드 없음)
- pill 전체가 드래그 핸들 → `data-codit-no-drag` 없음

#### 수정 `apps/extension/entrypoints/content/App.tsx`

```tsx
// collapsed 분기
<CollapsedTimer
    ref={pillRef}
    seconds={elapsedSeconds}
    status={collapsedStatus}
    onExpand={() => setViewState('expanded')}
    dragHandlers={dragHandlers}   // 신규 (1줄)
/>

// 신규: 위젯 크기 변화(collapsed↔expanded) 시 재clamp
const { dragHandlers, reclamp } = useWidgetPosition(containerEl);
useEffect(() => reclamp(), [viewState, reclamp]);
```

#### 수정 `apps/extension/entrypoints/content/useWidgetPosition.ts`

```ts
export interface UseWidgetPositionResult {
    dragHandlers: WidgetDragHandlers;
    /** 위젯 크기가 바뀐 뒤(collapsed↔expanded 등) 현재 위치를 재clamp 한다. (DP2) */
    reclamp: () => void;
}
```

- **클릭/드래그 구분 (DP1 안 A)**: `endDrag` 에서 이동 거리가 `DRAG_THRESHOLD_PX` 이상이면(=드래그)
  `window` 에 capture-phase `click` 리스너를 1회 등록해 뒤따르는 `click` 을
  `stopPropagation()` + `preventDefault()` 로 삼킨다. self-cleaning + `setTimeout(0)` 안전 정리 +
  hook unmount 시 정리. 소비처(pill)는 `onClick={onExpand}` 무변경.
- **`reclamp` (DP2 안 A)**: `commitPosition(clampWithin(containerEl, positionRef.current))` — resize 핸들러와 동일 로직. `useCallback` 으로 안정 참조.

### 위치 연속성 (AC: 상태 전환 시 위치 유지) — 신규 코드 없음

`useWidgetPosition` 은 App 최상위 1회 호출, `positionRef` · `#codit-root` 스타일이 `viewState`
변경에 무관하게 유지됨. collapsed ↔ expanded 전환 시 위젯이 같은 위치에 렌더됨 (시나리오로 검증).

### 에러 케이스

| 조건 | 동작 |
|---|---|
| pill 드래그 ≥5px 후 pointerup | 위치 커밋 + 뒤따르는 `click` 억제 (펼치기 안 됨) |
| pill 드래그 <5px 후 pointerup | 커밋 안 함, `click` → `onExpand` 정상 |
| pill 드래그 중 pointercancel | #19 `endDrag` 와 동일 (임계값 미달이면 커밋·억제 없음) |
| `dragHandlers` 미주입 | pill 은 `onClick={onExpand}` 만 동작 |
| 키보드 Enter/Space | `onExpand` (드래그 직후 같은 tick 이 아니면 억제 안 됨) |
| pill 을 가장자리로 옮긴 뒤 펼침 | `reclamp` 로 넓은 패널이 뷰포트 안으로 재배치 |

---

## 테스트 시나리오

### 정상

- `[정상] pill 드래그` — pill 을 5px 이상 드래그하면 위젯이 이동하고 screen 은 collapsed 로 유지된다 (시나리오 A)
- `[정상] pill 클릭` — pill 을 5px 미만 이동 후 떼면 expanded 로 전환된다 (시나리오 B)
- `[정상] 드래그→펼치기 위치 유지` — pill 을 드래그해 옮긴 뒤 클릭해 펼치면 expanded 패널이 옮긴 위치(clamp 후)에 렌더된다 (Default 로 안 튐) (시나리오 C)
- `[정상] 헤더 이동→접기 위치 유지` — expanded 에서 헤더로 옮긴 뒤 접으면 pill 이 그 위치에 나타난다
- `[정상] pill 드래그 중 커서` — pill 드래그 중 `document.body` 커서가 `grabbing` 이 되고 종료 시 되돌아온다
- `[정상] pill hover 커서` — `dragHandlers` 가 주어지면 pill 에 `cursor-grab` 클래스가 있다
- `[정상] pill onPointerDown 연결` — `dragHandlers` 가 주어지면 pill pointerdown 시 `onPointerDown` 이 호출된다
- `[정상] Enter/Space 펼치기 유지` — 키보드 Enter/Space 로는 여전히 `onExpand` 가 호출된다 (#15 회귀)
- `[정상] reclamp` — 위젯 크기가 커진 뒤 `reclamp()` 를 호출하면 현재 위치를 새 크기 기준으로 재clamp 한다
- `[정상] 가장자리 pill→펼침 재clamp` — pill 을 우측 가장자리로 옮긴 뒤 펼치면 넓은 패널이 뷰포트 안으로 재배치된다

### 경계

- `[경계] pill 미세 이동 후 클릭` — pill 을 4px 이동 후 떼면 펼쳐진다 (임계값 경계, 클릭으로 간주)
- `[경계] pill 드래그 clamp` — pill 을 화면 밖까지 끌면 위젯이 뷰포트 경계에서 멈춘다
- `[경계] reclamp` — 위젯이 여전히 뷰포트 안이면 `reclamp()` 후 위치가 그대로다

### 예외

- `[예외] pill 드래그 후 click 억제` — pill 을 5px 이상 드래그하면 뒤따르는 `click` 이 억제되어 `onExpand` 가 호출되지 않는다
- `[예외] dragHandlers 미주입` — `dragHandlers` 없이도 pill 클릭 시 `onExpand` 가 호출된다 (기존 동작)
- `[예외] pill 드래그 중 pointercancel` — 드래그 중 `pointercancel` 이 오면 위젯이 현재 위치에서 종료되고 collapsed 유지

---

## AC 커버리지

| AC | 커버 시나리오 |
|---|---|
| pill 5px+ 드래그 → 이동, 안 펼쳐짐 | `[정상] pill 드래그` (A) + `[예외] pill 드래그 후 click 억제` |
| pill <5px → 펼쳐짐 | `[정상] pill 클릭` (B) + `[경계] pill 미세 이동 후 클릭` |
| 드래그 후 클릭 펼치기 → 옮긴 위치 (Default 안 튐) | `[정상] 드래그→펼치기 위치 유지` (C) |
| expanded 헤더 이동 후 접으면 pill 그 위치 | `[정상] 헤더 이동→접기 위치 유지` |
| pill 드래그도 clamp | `[경계] pill 드래그 clamp` |
| pill hover `grab` / 드래그 중 `grabbing` | `[정상] pill hover 커서` + `[정상] pill 드래그 중 커서` |
| Enter/Space 펼치기 유지 (#15 회귀) | `[정상] Enter/Space 펼치기 유지` + 기존 `collapsed-timer.test.tsx` |
| (spec-fixed) 가장자리 pill → 펼칠 때 clamp | `[정상] reclamp` + `[정상] 가장자리 pill→펼침 재clamp` |
