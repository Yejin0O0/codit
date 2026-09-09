# Issue 54: [UI-L2 R1] 위젯 Timer 화면 재설계 — TimerScreen · TimerDisplay

> 참조: `prd.md`, `ui-design.md`. 에픽 #51. R0(#52) 스택 위.
> 리디자인 라운드 — `/test-scenarios` 대신 직접 작성. **레이아웃만** 변경.

## 시그니처

### `TimerScreen` (변경 없음 — 회귀 가드)

```tsx
interface TimerScreenProps {
    problemId: string;
    problemTitle?: string | null;
    elapsedSeconds: number;
    onComplete: () => void;
    onCollapse?: () => void;
    collapseControlRef?: Ref<HTMLButtonElement>;
    dragHandlers?: WidgetDragHandlers;
}
```

- 내부 `problemLabel(id, title)` = `title || \`문제 #${id}\`` (기존 로컬 헬퍼 유지)
- `PanelShell title` 에 `problemLabel(...)` 을 넘긴다 (기존: `"풀이 타이머"` 고정)

### `TimerDisplay`

```tsx
interface TimerDisplayProps {
    seconds: number;
    caption?: string;
    running?: boolean;   // 신규 optional. true + caption → 캡션 앞 펄스 도트
    className?: string;
}
```

### `PanelShell` (R1 추가 — 긴 title 대응)

- 헤더 좌측 span 에 `min-w-0`, `<h2>` 에 `truncate` → 긴 제목이 우측(도트/접기)을 밀어내지 않음
- props·동작 불변

## 시나리오

### 신규 — `TimerScreen.test.tsx`

- **[정상] problemTitle 주입 시 헤더 heading(level 2)에 그 제목을 표시한다**
- **[정상] problemTitle 없으면 헤더 heading 에 "문제 #{id}" 를 표시한다**
- **[정상] "풀이 타이머" 텍스트를 렌더하지 않는다**
- **[정상] 본문(타이머 아래/위)에 문제 제목을 중복 표시하지 않는다** — heading 은 1개
- **[정상] 경과 시간 mm:ss 를 렌더한다** (`elapsedSeconds=125` → `02:05`)
- **[정상] "측정 중" 캡션과 펄스 도트를 함께 렌더한다** (도트는 `aria-hidden`)
- **[정상] "완료" 클릭 시 onComplete 를 호출한다**
- **[회귀] onCollapse 주입 시 접기 버튼(`aria-label="Codit 위젯 접기"`)을 렌더한다** (프레임 위임)

### 신규 — `timer-display.test.tsx`

- **[정상] seconds → formatDuration 결과 텍스트를 렌더한다** (`75` → `01:15`)
- **[정상] 1시간 이상은 `h:mm:ss` 롤오버** (`7505` → `2:05:05` — 재리뷰 반영, 320px 폭 자릿수 폭증 방지)
- **[정상] 타이머 값 요소에 `text-7xl` 클래스가 있다**
- **[정상] running=true + caption → 캡션 앞에 `aria-hidden` 펄스 도트를 렌더한다**
- **[정상] caption 만(running 없음) → 도트 없이 캡션 텍스트만 렌더한다** (기존 동작 보존)
- **[정상] caption 미주입 → 캡션/도트 미렌더**

### 회귀 — `App.test.tsx`

- **[회귀] `timerHeader()` 앵커를 "풀이 타이머" → "문제 #{PROBLEM_ID}" 로 교체** — 드래그 11개 테스트 그대로 통과
- **[회귀] `주입받은 problemId를 타이머 화면에 표시한다` / `problemTitle이 있으면 제목만`** — 헤더로 위치만 이동, 단언 유지

## AC 대조

| AC (이슈 #54) | 커버 시나리오 |
| --- | --- |
| props 시그니처 불변 | 시그니처 블록 컴파일 + [회귀] onCollapse 접기 버튼 |
| problemTitle 폴백 규칙 유지 | [정상] 제목 표시 / [정상] "문제 #{id}" 폴백 / App.test #37 |
| "완료" → 결과 선택 | [정상] onComplete 호출 + App.test 기존 플로우 |
| 접기·드래그·focus 회귀 0 | [회귀] 접기 버튼 + App.test 드래그 11건 (timerHeader 앵커 교체) |
| a11y — 타이머 읽힘, 도트 aria-hidden | [정상] mm:ss 텍스트 / [정상] 펄스 도트 aria-hidden |
| 긴 제목 truncate | PanelShell `truncate`/`min-w-0` (얕은 클래스 단언) |
| green | tdd-green 후 CI |
| 스크린샷 승인 | @ac-verifier + 개발자 Storybook |

## Out of Scope

- R2~R5 화면, CollapsedTimer(R6), 다크, step 번호 체계
