# CollapsedTimer 점검 재설계 — PRD (리디자인 브리프)

> Layer 2 R6. 에픽 #51 / 이슈 #81. R0~R5 머지됨. `fix/design-system-audit-drift`(#80) 위 스택.
> **레이아웃만** 재설계 — `CollapsedTimer` props 시그니처 불변.

## 배경

1. `CollapsedTimer`는 `status='running'`일 때 시간 숫자만 보여주고 "측정 중" 시각 신호가
   없다. R1(#54)에서 `TimerDisplay`에 민트 `animate-ping` 펄스 도트를 넣어 "돌고 있음"을
   신호했는데, 접힌 pill만 그 흐름이 끊긴다. (`stopped`는 이미 success 체크 아이콘 있음)
2. audit(#80): motion 토큰 `--ease-out`/`--ease-in-out`/`--duration-fast|base|slow` 5개
   전부 dead — R1 펄스(`animate-ping`)·`skeleton`(`animate-pulse`) 모두 Tailwind 내장
   유틸 사용, `@theme` 매핑도 없다. `design-system.md`는 이걸 motion 시스템으로 서술.

## 사용자 스토리

- **US-1** 위젯을 접어도 타이머가 돌고 있는지(측정 중) 한눈에 구분된다 — 펼친 화면과 같은 민트 펄스.

## 결정 (스파이크에서 개발자 확정, 2026-09-10)

스파이크 스토리(`collapsed-timer-r6-spike.stories.tsx`, 신호 후보 8종)를 Storybook에서
개발자가 직접 확인하고 결정.

| 항목 | 결정 |
|------|------|
| running 신호 위치 | **`ping-after`** — 시간 숫자 **뒤**, chevron 앞에 민트 펄스 도트(`animate-ping` 후광 + 중심점). running=펄스 도트 / stopped=체크가 같은 슬롯을 차지 → "시간 뒤 = 상태 글리프" 규칙 |
| 펄스 도트 컴포넌트 | **`LiveDot`로 공용 추출** — `components/codit/live-dot.tsx` 신규 CUSTOM. R1 `TimerDisplay`의 인라인 도트도 `<LiveDot>` 호출로 교체(마크업·동작 동일, 회귀 0). "측정 중" 신호의 단일 소스 |
| motion 토큰 | **제거** (audit #80 이월분). `--ease-*`/`--duration-*` 5개 삭제 + `design-system.md` motion 행을 "전환·애니메이션 = Tailwind 내장 유틸" 로 정정 |

기각: `ping-before`(제안이었으나 개발자가 ping-after 선택), `ping-on-mark`/`mark-tint`/`mark-breathe`
(브랜드 마크 건드림), `ring`(과함), `dot-static`(살아있음 느낌 약함).

## AC

- [ ] `CollapsedTimer` props 시그니처 불변 (`status: 'running' | 'stopped'` 이미 있음)
- [ ] running일 때 시간 숫자 뒤 chevron 앞에 `aria-hidden` `LiveDot` 펄스 도트 렌더
- [ ] stopped일 때 펄스 도트 없음, 기존 success 체크 유지
- [ ] pill의 name-from-contents accessible name / sr-only 레이블 회귀 없음
- [ ] `LiveDot` 추출 후 `TimerDisplay` 펄스 도트 동작·마크업 회귀 없음 (`timer-display.test.tsx` 그대로 통과)
- [ ] motion 토큰 `--ease-*`/`--duration-*` 제거, `design-system.md` motion 행 정정, `## feature별 인벤토리`에 `LiveDot` 추가
- [ ] typecheck·lint·test·build·storybook green
- [ ] 전/후 스크린샷 (running / stopped)

## Out of Scope

- 드래그·클릭 구분 로직 (#20 완료)
- pill 레이아웃 재배치 — running 신호 추가만
- `--z-*` 토큰 (#80에서 처리)
- `prefers-reduced-motion` — tokens.css 전역 `@media`가 이미 커버
- `TimerDisplay` 도트 위치·모양 변경 — 순수 추출만
