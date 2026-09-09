# Tags 화면 재설계 — PRD (리디자인 브리프)

> Layer 2 R4. 에픽 #51 / 이슈 #74. R0(#52)·R1(#54)·R2(#65)·R3(#71, PR #72 리뷰 대기) 위.
> `TagSelectScreen`·`TagPicker` **레이아웃만** 재설계 — 동작 로직 불변.
> **주의**: `TagSelectScreen`은 R2(ResultSelectScreen)·R3(MemoScreen)와 달리 원래 `result` prop이
> 없었다. `ResultBadge`를 렌더하려면 `result: ResultType` prop을 **신규로 추가**해야 한다 — 완전한
> "props 시그니처 불변"은 아니고, 기존 prop은 그대로 두고 하나만 추가하는 것(R1의 `TimerDisplay
> running?` 추가와 같은 패턴). `App.tsx`의 `<TagSelectScreen>` 호출부도 `result={result}` 전달
> 추가가 필요하다.

## 배경

`TagSelectScreen`에는 지금 어떤 결과에 태그를 다는지 표시가 없다. R3에서 메모 화면에
`ResultBadge`를 붙여 결과가 계속 보이게 했는데, 태그 화면만 흐름이 끊긴다.

## 사용자 스토리

- **US-1** 태그 선택 화면에서도 방금 고른 결과가 계속 보인다.
- **US-2** "추가" 버튼이 "저장"만큼 눈에 띄어서, 직접 입력한 태그도 쉽게 확정할 수 있다.

## 결정 (스파이크에서 개발자 확정, 2026-09-09)

| 항목 | 결정 |
|------|------|
| 결과 표시 | `ResultBadge`를 `TagPicker` 위(본문 상단)에 배치 — R2·R3와 동일 위치 규칙. 헤더 안에 넣는 안은 `PanelShell`(R0 공통 프레임) 수정이 필요해 기각 |
| "추가" 버튼 색상 | `variant="secondary"` → `variant="default"`(primary 보라) — "저장" 버튼과 동일한 시각적 강조 |

## 알려진 트레이드오프 (design-system.md 규칙 예외)

`docs/ui/design-system.md` "컴포넌트 사용 규칙"의 "주요 진행 액션 Button default — **화면당 1개**"
규칙과 충돌 — 이번 화면엔 "추가"·"저장" 두 개의 primary 버튼이 공존한다. 개발자가 명시적으로
예외를 확정했으며, `design-system.md`에도 예외로 기록한다(태그 직접입력 "추가"는 진행 액션이
아니라 입력 확정 액션이라는 성격 차이 — 다만 규칙 문서에는 예외로만 남기고 일반화하지 않는다).

## AC

- [ ] `TagSelectScreen`에 `result: ResultType` prop이 신규 추가되고, 기존 prop은 전부 그대로 유지된다
- [ ] `App.tsx`의 `<TagSelectScreen>` 호출부가 `result={result}`를 전달한다
- [ ] `ResultBadge`가 렌더되고 R2·R3와 시각적으로 일관됨 (정답=success/오답=destructive/보류=warning)
- [ ] "추가" 버튼이 `variant="default"`로 렌더된다
- [ ] `TagPicker` 동작(선택/해제/직접입력/더보기) 회귀 없음
- [ ] typecheck·lint·test·build·storybook green
- [ ] 스크린샷 재설계 의도 일치 (개발자 승인)

## Out of Scope

- 저장완료 화면 → R5
- `App.tsx`/저장 로직 변경 — 레이아웃만 (이슈 #73과 무관)
- design-system.md "화면당 primary 1개" 규칙의 전면 재검토 — 이번 화면만의 명시적 예외
