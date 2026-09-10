# Issue 81: [UI-L2 R6] 접힌 타이머 점검 — running 펄스 + motion 토큰 정리

## 시그니처

### 프론트엔드 (TypeScript)

**[확정] `LiveDot` — 신규 CUSTOM 컴포넌트**

**근거**: prd.md 결정 — "측정 중" 펄스 신호를 R1 `TimerDisplay` + R6 `CollapsedTimer`가
공유. `TimerDisplay`의 인라인 마크업(4줄 중첩 `<span>`)을 그대로 승격.

```ts
// components/codit/live-dot.tsx
interface LiveDotProps {
    className?: string; // 위치 조정용 (예: 'absolute -top-0.5 -right-0.5')
}
export function LiveDot({ className }: LiveDotProps): JSX.Element;
```

렌더: `<span aria-hidden="true" class="relative flex size-1.5 {className}">` +
후광 `<span class="bg-success absolute inline-flex size-full animate-ping rounded-full opacity-60">` +
중심점 `<span class="bg-success relative inline-flex size-1.5 rounded-full">`.

**[확정] `CollapsedTimer` Props — 변경 없음**

```ts
interface CollapsedTimerProps {
    seconds: number;
    status: 'running' | 'stopped';
    onExpand: () => void;
    ref?: Ref<HTMLButtonElement>;
    dragHandlers?: WidgetDragHandlers;
}
```

내부 변경(시그니처 아님): `status === 'running'`이면 `{mm:ss}` `<span>` 뒤, chevron `<svg>`
앞에 `<LiveDot />` 렌더.

**[확정] `TimerDisplay` — 시그니처 불변, 인라인 도트 → `<LiveDot />` 교체**

props 그대로. `running ? (<span…3줄…>) : null` → `running ? <LiveDot /> : null`.

### 에러 케이스

없음 — 순수 표현 컴포넌트.

**결정 포인트**: 없음 — 모두 확정 (스파이크에서 ping-after + LiveDot 추출 확정).

### 비-TS 변경

- `styles/tokens.css` — `--ease-out`/`--ease-in-out`/`--duration-fast`/`--duration-base`/`--duration-slow` 5줄 + 주석 제거
- `docs/ui/design-system.md` — `## 기초 > 스케일` motion 행 정정 + `## feature별 인벤토리`에 `LiveDot` CUSTOM 행 추가

---

## 테스트 시나리오

> 신규 `components/codit/live-dot.test.tsx` + 기존 `collapsed-timer.test.tsx`에 추가.
> `describe` 영어 / `it` 한국어 현재형.

### 정상

- [정상] LiveDot — `aria-hidden` 래퍼 span을 렌더한다
- [정상] LiveDot — `bg-success` 클래스를 가진 도트를 렌더한다
- [정상] LiveDot — `animate-ping` 후광 span을 렌더한다
- [정상] LiveDot — 전달된 `className`을 래퍼에 병합한다
- [정상] CollapsedTimer — `status='running'`이면 `aria-hidden` 펄스 도트(LiveDot)를 렌더한다
- [정상] CollapsedTimer — 펄스 도트가 시간 텍스트보다 뒤, chevron보다 앞 (DOM 순서)
- [정상] TimerDisplay — `running` + `caption`이면 여전히 캡션 앞 `aria-hidden` 펄스 도트를 렌더한다 (추출 회귀 가드)

### 경계

- [경계] CollapsedTimer — `status='stopped'`이면 펄스 도트를 렌더하지 않는다 (success 체크만)
- [경계] CollapsedTimer — running SVG 개수는 2 유지 (LiveDot는 span 기반, 마크 + chevron만 SVG)

### 예외 (회귀 가드)

- [회귀] CollapsedTimer — pill의 accessible name(name-from-contents)에 도트가 텍스트를 주입하지 않는다 (`aria-hidden` 확인)
- [회귀] TimerDisplay — `caption`만(running 없음) 이면 도트 없음 (기존 동작)

---

## AC 커버리지

| AC | 커버 시나리오 |
| --- | --- |
| `CollapsedTimer` props 시그니처 불변 | 시그니처 [확정] + ac-verifier 구조 확인 |
| running 시간 뒤/chevron 앞 `aria-hidden` LiveDot | [정상] running 도트 렌더 + [정상] DOM 순서 |
| stopped 도트 없음, 체크 유지 | [경계] stopped 도트 없음 |
| pill accessible name 회귀 없음 | [회귀] aria-hidden 주입 없음 |
| `TimerDisplay` 추출 회귀 없음 | [정상] 추출 회귀 가드 + [회귀] caption-only + 기존 `timer-display.test.tsx` 전건 |
| motion 토큰 제거 + 문서 정정 + `LiveDot` 인벤토리 | tdd-green diff + ac-verifier 문서 확인 |
| typecheck·lint·test·build·storybook green | tdd-green + security-review |
| 전/후 스크린샷 | create-pr |
