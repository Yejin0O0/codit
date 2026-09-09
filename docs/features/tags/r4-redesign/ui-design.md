# Tags r4-redesign UI Design

> 이 문서는 tdd-green-frontend의 시각적 명세 참조 기준이다.
> 코드를 작성하지 않는다.

## 와이어프레임

### TagSelectScreen (재설계 후)

```
┌─ PanelShell ──────────────────────┐
│ ⓒ 태그 선택               ● ● ● ⌄ │  ← step "3 / 3"
├────────────────────────────────────┤
│                                    │
│   [ 정답 ]                        │  ← ResultBadge (신규, TagPicker 위)
│                                    │
│   태그                 1개 이상 선택 │
│   [구현][시뮬레이션][완전검색][그리디]│
│   [BFS][DFS][정렬][동적계획법(DP)]  │
│   [배열][문자열][스택/큐]           │
│   더보기                          │
│   [___________________] [ 추가 ]  │  ← "추가" primary(보라)로 강조
│   2개 선택됨                       │
│                                    │
├────────────────────────────────────┤
│   [   뒤로   ]  [   저장   ]       │
└────────────────────────────────────┘
```

## 컴포넌트 트리

```
TagSelectScreen
├── PanelShell               → CUSTOM (R0, 변경 없음)
│   ├── header: title="태그 선택", step="3 / 3"
│   ├── body
│   │   ├── ResultBadge      → CUSTOM (컴포넌트 자체는 R2/R3에서 이미 씀, 재사용)
│   │   │     result={result}  ← TagSelectScreenProps에 result 신규 추가 필요(아래 참고)
│   │   └── TagPicker        → CUSTOM (기존)
│   │         └── "추가" Button → shadcn Button, variant: secondary → default (색상만 변경)
│   └── footer
│       ├── Button "뒤로"    → shadcn Button (기존)
│       └── Button "저장"    → shadcn Button (기존, variant default 그대로)
```

`Badge`/결과 표시가 아예 없던 자리에 `ResultBadge`를 추가하는 것과, `TagPicker` 내부
"추가" 버튼의 `variant`를 바꾸는 것이 이번 라운드의 유일한 구조 변경.

---

## UI State

| 컴포넌트 | 상태 | 트리거 | 표현 방식 |
|---------|------|--------|----------|
| ResultBadge | CORRECT / WRONG / HOLD | 화면 진입 시 result 값 | success/destructive/warning 채움 배경 + 라벨 (R2/R3와 동일) |
| "추가" Button | 기본 | — | `variant="default"` — primary 보라, "저장"과 동일 강조 |
| TagPicker (선택/해제/더보기/직접입력) | (변경 없음) | — | 기존 동작 그대로 유지 |

부모(App.tsx) 상태 영향: 없음 — `result`는 이미 App.tsx가 소유, 이번 라운드는 표현만 바꾼다.

---

## shadcn/ui 사용 컴포넌트

이번 라운드에서 새로 추가되는 shadcn/ui 컴포넌트는 없다 — `ResultBadge`는 R2/R3부터
이미 존재하던 CUSTOM 컴포넌트를 재배치, "추가" 버튼은 기존 `Button`의 `variant` prop만 변경.

---

## Out of Scope (이번 Feature 제외)

- 저장완료 화면 (R5)
- `App.tsx`/저장 로직 변경 (이슈 #73과 무관)
- design-system.md "화면당 primary 1개" 규칙 전면 재검토 — 이번 화면만의 명시적 예외
