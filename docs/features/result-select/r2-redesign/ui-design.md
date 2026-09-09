# ResultSelect r2-redesign UI Design

> 이 문서는 tdd-green-frontend의 시각적 명세 참조 기준이다.
> 코드를 작성하지 않는다.

## 와이어프레임

### ResultSelectScreen (재설계 후)

```
┌─ PanelShell ──────────────────────┐
│ ⓒ 결과 선택                    ⌄ │  ← 제목 고정, step 배지 없음 (결정)
├────────────────────────────────────┤
│                                    │
│             12:34                 │  ← TimerDisplay 7xl focal (R1과 동일)
│           풀이 시간                │  ← caption, 펄스 도트 없음(멈춤)
│                                    │
│   [ 정답 ]  [ 오답 ]  [ 보류 ]    │  ← ResultToggleGroup (기존 동작 불변)
│                                    │
├────────────────────────────────────┤
│            [   다음   ]            │  ← footer, value 선택 전 disabled
└────────────────────────────────────┘
```

Before(제거 대상): `TimerDisplay` 자리에 있던 작은 muted 문장
`"{시간} 만에 풀이했어요."`는 삭제된다.

---

## 컴포넌트 트리

```
ResultSelectScreen
├── PanelShell                    → CUSTOM (R0, 변경 없음)
│   ├── header: title="결과 선택" (step prop 미전달 — 배지 없음)
│   ├── body
│   │   ├── TimerDisplay          → CUSTOM (R1에서 도입, 재사용)
│   │   │     seconds={elapsedSeconds} caption="풀이 시간" (running 없음)
│   │   └── ResultToggleGroup     → EXTEND ui/toggle-group (기존, 변경 없음)
│   │         value={value} onChange={onChange}
│   └── footer
│       └── Button "다음"         → shadcn Button (기존, 변경 없음)
```

`TimerScreen`과 동일하게 `<div className="flex flex-col items-center gap-*">`로
`TimerDisplay`를 감싸는 레이아웃을 재사용한다 (R1 패턴 그대로).

---

## UI State

| 컴포넌트 | 상태 | 트리거 | 표현 방식 |
|---------|------|--------|----------|
| TimerDisplay | 고정(멈춤) | 화면 진입 시 이미 `stop()`된 값 | `running` 미전달 → 펄스 도트 없이 숫자만 |
| ResultToggleGroup | 미선택 | 초기 진입 | 세 옵션 모두 outline, 아무것도 selected 아님 |
| ResultToggleGroup | 선택됨 | 정답/오답/보류 클릭 | 해당 옵션만 의미색(success/destructive/warning) 채움 |
| 다음 버튼 | disabled | `value === null` | 클릭 불가 |
| 다음 버튼 | enabled | `value !== null` | 클릭 시 `onNext` 호출 |
| PanelShell step 배지 | 없음(고정) | — | `step` prop 미전달 — 결정 사항, 상태 변화 없음 |

부모(App.tsx) 상태 영향: 없음 — `result`(선택값)는 이미 App.tsx가 소유, 이번 라운드는 표현만 바꾼다.

---

## shadcn/ui 사용 컴포넌트

| 컴포넌트 | 용도 | 커스터마이징 |
|---------|------|------------|
| Button | "다음" 액션 | 기존 그대로 (변경 없음) |

이번 라운드에서 새로 추가되는 shadcn/ui 컴포넌트는 없다 — `TimerDisplay`/`ResultToggleGroup`
모두 R0·R1·최초 구현에서 이미 만들어진 CUSTOM/EXTEND 컴포넌트를 재배치만 한다.

---

## Out of Scope (이번 Feature 제외)

- 메모·태그·저장완료 화면 (R3~R5)
- step 흐름 번호 체계 전면 재설계 (배지 "없음" 결정만 재확인, 다른 화면 값 변경 없음)
- 다크 모드, 새 토큰
