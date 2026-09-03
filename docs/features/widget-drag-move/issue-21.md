# Issue 21: [widget-drag-move] 위치 영속 + 다중 탭 동기

> test-scenarios 산출물. 기준: [prd.md](./prd.md) ADR-1·ADR-5 · [spec-fixed.md](./spec-fixed.md) · [issues.md](./issues.md).
> Vertical Slice #3 / 3. 의존: #19 (`useWidgetPosition`). #20 과 독립.

## 시그니처

### 프론트엔드 (TypeScript)

#### 신규 `apps/extension/entrypoints/content/widget-position-storage.ts`

```ts
import { storage } from 'wxt/utils/storage';
import type { WidgetPosition } from './useWidgetPosition';

export const WIDGET_POSITION_KEY = 'local:widgetPosition' as const;

/** NaN · 형식 오류 · 누락 값을 걸러낸다. */
export function isValidPosition(value: unknown): value is WidgetPosition;

/** 저장된 위치를 읽는다. 없거나 손상 · 읽기 실패면 null. */
export function readWidgetPosition(): Promise<WidgetPosition | null>;

/** 위치를 저장한다. 실패 시 console.warn 1줄, throw 하지 않는다. */
export function writeWidgetPosition(pos: WidgetPosition): Promise<void>;

/** 다른 탭의 위치 변경을 구독한다. 손상값은 콜백에 전달하지 않는다. 해지 함수 반환. */
export function watchWidgetPosition(onChange: (pos: WidgetPosition) => void): () => void;
```

내부: `storage.defineItem<WidgetPosition | null>(WIDGET_POSITION_KEY, { fallback: null })`. (ADR-1)

#### 수정 `apps/extension/entrypoints/content/useWidgetPosition.ts`

`UseWidgetPositionResult` · `WidgetDragHandlers` **불변** (반환 API 그대로). 내부 동작만 추가:

- **초기 렌더 (DP2 안 A)**: 기존 sync `useLayoutEffect`(Default position 계산)는 유지하되 먼저
  `containerEl.style.visibility = 'hidden'`. 이어서 async effect 가 `readWidgetPosition()` →
  유효하면 `commitPosition(clampWithin(...))` 로 덮어씀 → 완료 후 `visibility = ''`.
  (깜빡임 0, #19/#20 sync 테스트 회귀 없음)
- **드래그 종료**: `endDrag` 의 `commitPosition` 직후 `writeWidgetPosition(positionRef.current)`
  (fire-and-forget). resize 재clamp · watch 반영은 저장하지 않는다 (저장값 보존).
- **다중 탭 동기**: 신규 effect `watchWidgetPosition((pos) => {
  if (!isDraggingRef.current) commitPosition(clampWithin(containerEl, pos)); })`.
- 신규 `isDraggingRef` — `onPointerDown` 에서 true, `endDrag` 에서 false. (드래그 중 다른 탭 변경 무시)

#### 수정 `apps/extension/entrypoints/content/mount.tsx`

```ts
container.style.visibility = 'hidden'; // 위치 확정 전 비표시 (훅이 확정 후 해제)
```

#### 수정 `apps/extension/wxt.config.ts`

```ts
export default defineConfig({
    modules: ['@wxt-dev/module-react'],
    manifest: { permissions: ['storage'] }, // 신규 — 그 외 권한 없음
    vite: () => ({ plugins: [tailwindcss()] }),
});
```

#### 수정 `apps/extension/vitest.setup.ts`

```ts
import { fakeBrowser } from 'wxt/testing/fake-browser';
globalThis.browser = fakeBrowser as unknown as typeof globalThis.browser;
beforeEach(() => fakeBrowser.reset());
```

### 에러 케이스

| 조건 | 동작 |
|---|---|
| 저장된 값 없음 | Default position |
| 저장값 손상 (`{top: NaN}`, 형식 오류) | `isValidPosition` false → Default position 폴백, 다음 드래그 시 정상값 덮어씀 |
| `storage.local.get` throw | `readWidgetPosition` → null → Default position |
| `storage.local.set` throw | `console.warn` 1줄, 인메모리 위치 유지, 에러 UI 없음 |
| 드래그 중 `storage.onChanged` 수신 | `isDraggingRef` true → 무시 |
| `watchWidgetPosition` 수신값 손상 | 콜백 호출 안 함 |

---

## 테스트 시나리오

### 정상

- `[정상] isValidPosition` — `{top, left}` 이 유한 숫자면 true 를 반환한다
- `[정상] readWidgetPosition` — 저장된 유효 위치를 반환한다
- `[정상] readWidgetPosition` — 저장값이 없으면 null 을 반환한다
- `[정상] writeWidgetPosition` — 위치를 `local:widgetPosition` 에 저장한다
- `[정상] watchWidgetPosition` — 다른 탭이 위치를 바꾸면 콜백에 새 위치를 전달한다
- `[정상] useWidgetPosition mount 복원` — 저장된 위치가 있으면 그 위치(clamp 후)로 `#codit-root` 를 배치하고 `visibility` 를 해제한다 (시나리오 A)
- `[정상] useWidgetPosition mount 기본` — 저장값이 없으면 Default position + `visibility` 해제
- `[정상] useWidgetPosition 드래그 종료 저장` — 드래그로 옮기고 놓으면 새 위치가 storage 에 저장된다
- `[정상] useWidgetPosition 다중 탭 동기` — `storage.onChanged`(다른 탭) 수신 시 위젯이 그 위치(clamp 후)로 이동한다 (시나리오 B)
- `[정상] useWidgetPosition resize 미저장` — resize 재clamp 후 storage 에 write 하지 않는다 (저장값 보존)
- `[정상] #19 회귀` — sync Default position 계산이 그대로 동작한다 (기존 mount 테스트 유지)

### 경계

- `[경계] isValidPosition` — `{top: 0, left: 0}`(0)은 true
- `[경계] useWidgetPosition 초기 렌더 hidden` — 저장값 읽기 완료 전 `#codit-root` `visibility` 가 `hidden` 이다

### 예외

- `[예외] isValidPosition` — `NaN` / 필드 누락 / 비객체 / null 이면 false
- `[예외] readWidgetPosition` — 저장값이 손상(`{top: NaN}`)이면 null 을 반환한다
- `[예외] readWidgetPosition` — `storage.getValue` 가 throw 하면 null 을 반환한다
- `[예외] writeWidgetPosition` — `storage.setValue` 가 throw 하면 `console.warn` 을 찍고 throw 하지 않는다
- `[예외] watchWidgetPosition` — 변경값이 손상이면 콜백을 호출하지 않는다
- `[예외] useWidgetPosition mount 손상값` — 저장값이 `{top: NaN}` 이면 Default position 폴백 + 표시 (시나리오 D)
- `[예외] useWidgetPosition 저장 실패 fail-soft` — `setValue` 가 throw 해도 위젯은 놓은 위치에 유지되고 `console.warn` 만 찍힌다 (시나리오 C)
- `[예외] useWidgetPosition 드래그 중 동기 무시` — 드래그 중 `storage.onChanged` 가 와도 위치가 바뀌지 않는다

---

## AC 커버리지

| AC | 커버 시나리오 |
|---|---|
| 옮긴 뒤 새로고침 → 옮긴 위치 (clamp) | `[정상] mount 복원` (A) + `[정상] 드래그 종료 저장` |
| 저장 없으면 Default position | `[정상] mount 기본` |
| 손상값 → Default 폴백 + 다음 저장 시 덮어씀 | `[예외] mount 손상값` (D) + `[예외] readWidgetPosition 손상` + `[예외] isValidPosition` |
| 깜빡임 없음 (위치 확정 후 첫 표시) | `[경계] 초기 렌더 hidden` + `[정상] mount 복원` 의 visibility 전환 |
| 탭 A 옮기면 탭 B 이동 | `[정상] 다중 탭 동기` (B) + `[정상] watchWidgetPosition` |
| 드래그 중 다른 탭 변경 무시 | `[예외] 드래그 중 동기 무시` |
| `set` 실패해도 위젯 유지, 에러 UI 없음 | `[예외] 저장 실패 fail-soft` (C) + `[예외] writeWidgetPosition throw` |
| `wxt.config.ts` storage permission, 그 외 없음 | security-review 6단계 manifest 감사로 확인 (unit 테스트 대상 아님) |
