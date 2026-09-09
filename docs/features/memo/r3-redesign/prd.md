# Memo 화면 재설계 — PRD (리디자인 브리프)

> Layer 2 R3. 에픽 #51 / 이슈 #71. R0(#52)·R1(#54)·R2(#65) 위. 이슈 #69(보류→메모 진입) 이후.
> `MemoScreen`·`MemoField` **레이아웃만** 재설계 — props 시그니처·동작 로직 불변.

## 배경

`ResultToggleGroup`·`ResultSelectScreen`은 이미 의미색(success/destructive/warning)으로
결과를 표시하는데, `MemoScreen`만 중립 `Badge`(secondary)로 표시해 톤이 어긋난다.

## 사용자 스토리

- **US-1** 메모 화면에서도 방금 고른 결과(정답/오답/보류)가 색으로 바로 구분된다.

## 결정 (스파이크에서 개발자 확정, 2026-09-09)

| 항목 | 결정 |
|------|------|
| 결과 표시 | `Badge variant="secondary"` → **`ResultBadge` 재사용**(정답=success/오답=destructive/보류=warning 채움색) |
| `--success` 토큰 | 스파이크 중 발견된 대비 결함(3.15:1, AA 미달)을 이 PR에 함께 수정 — 같은 hue·chroma에서 L 0.6406→0.53, `#00824c`(4.90:1) |

## AC

- [ ] `MemoScreen` props 시그니처 불변
- [ ] 결과 배지가 `ResultBadge`로 렌더된다 (정답=success/오답=destructive/보류=warning)
- [ ] `--success` 토큰이 흰 텍스트와 4.5:1 이상 (`#00824c` 근사)
- [ ] `ResultBadge`·`ResultToggleGroup`의 CORRECT 상태 a11y 위반 없음
- [ ] `MemoField` 동작(정답 접힘/오답·보류 자동노출) 회귀 없음
- [ ] typecheck·lint·test·build·storybook green
- [ ] 스크린샷 재설계 의도 일치 (개발자 승인)

## Out of Scope

- 태그·저장완료 화면 → R4~R5
- `--destructive`(이미 #66 완료)·`--warning`(문제없음) 토큰은 건드리지 않음
- `MemoField`의 접힘/자동노출 로직 자체 변경 (이번엔 배지 색만)
