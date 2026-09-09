# Issue 65: [UI-L2 R2] 결과 선택 화면 재설계 — ResultSelectScreen · ResultToggleGroup

## 시그니처

### 프론트엔드 (TypeScript)

`ResultSelectScreenProps` — 변경 없음 (내부 렌더 구조만 재배치):

```ts
interface ResultSelectScreenProps {
    elapsedSeconds: number;
    value: ResultType | null;
    onChange: (value: ResultType) => void;
    onNext: () => void;
    onCollapse?: () => void;
    collapseControlRef?: Ref<HTMLButtonElement>;
    dragHandlers?: WidgetDragHandlers;
}
```

내부 렌더 변경: 작은 muted 문장(`"{시간} 만에 풀이했어요."`) 제거 →
`<TimerDisplay seconds={elapsedSeconds} caption="풀이 시간" />`(running 미전달)로 교체.
`ResultToggleGroup`·footer `Button`·`PanelShell`(step 미전달)은 기존 그대로.

### 에러 케이스

없음 — 순수 표현 변경, 비동기/실패 경로 없음.

---

## 테스트 시나리오

### 정상

- [x] ResultSelectScreen — should render elapsed seconds as `mm:ss` via `TimerDisplay`(7xl) when mounted
- [x] ResultSelectScreen — should render `"풀이 시간"` caption without a pulse dot (already-stopped timer)
- [x] ResultSelectScreen — should render `ResultToggleGroup` with 정답/오답/보류 options
- [x] ResultSelectScreen — should call `onChange('WRONG')` when 오답 is clicked
- [x] ResultSelectScreen — should call `onNext` when "다음" is clicked after a value is selected
- [x] ResultSelectScreen — should render the collapse control when `onCollapse` is provided (프레임 위임, 회귀 가드)

### 경계

- [x] ResultSelectScreen — should render `TimerDisplay` correctly when `elapsedSeconds` is `0` (`00:00`)
- [x] ResultSelectScreen — should not render a step-dot indicator in the header (PanelShell without `step`)

### 예외

- [x] ResultSelectScreen — should not render the old muted sentence (`"... 만에 풀이했어요."`)
- [x] ResultSelectScreen — should keep "다음" disabled when `value` is `null` (초기 진입, 미선택)
- [x] ResultSelectScreen — should not call `onNext` when "다음" is clicked while disabled

---

## AC 커버리지

| AC | 커버 시나리오 |
|---|---|
| `ResultSelectScreen` props 시그니처 불변 | 전체 시나리오가 기존 props로만 렌더 — 구조적으로 커버 |
| 경과시간이 `TimerDisplay`(7xl)로 렌더, caption "풀이 시간", 펄스 도트 없음 | [정상] TimerDisplay 렌더 · [정상] 풀이 시간 캡션+도트 없음 |
| 기존 muted 문장 제거 | [예외] 옛 문장 미렌더 |
| `ResultToggleGroup` 선택 동작 불변 · 선택 전 "다음" 비활성 | [정상] 오답 클릭 시 onChange · [예외] value null → disabled · [예외] disabled 클릭 시 onNext 미호출 |
| `PanelShell`에 `step` 미전달 (배지 없음) | [경계] step 도트 미렌더 |
| 접기·드래그·focus 회귀 없음 | [정상] onCollapse 위임 (드래그/focus는 R0에서 panel-shell.test.tsx가 이미 커버) |
| typecheck·lint·test·build·storybook green | Green 단계 별도 검증 |
| 스크린샷 승인 | 개발자 육안 승인 |
