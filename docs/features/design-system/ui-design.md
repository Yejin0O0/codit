# 디자인 시스템 v1 — UI Design

> `/design-system` 리스킨은 **토큰 값 + 로고**만 바꾼다.
> **와이어프레임·컴포넌트 트리·UI State 변경 없음** — 레이아웃 재설계는 후속(화면별 `/fe-ui-design`).

## 변경 대상

- `styles/tokens.css` — 색·elevation·motion·z-index 토큰 값 (`docs/ui/design-system.md ## 기초`)
- 프리미티브/EXTEND/CUSTOM 컴포넌트의 Tailwind **클래스** (구조·props 불변)
- `brand-header.tsx`·`collapsed-timer.tsx` 인라인 SVG (마름모 → C 마크)

## 변경 안 함

- 화면 구성·요소 배치·플로우 (타이머→결과→메모→태그→저장)
- `WidgetViewState`(expanded/collapsed), `screen` 상태 관리
- 컴포넌트 경계·props·Radix 동작

토큰·사용 규칙: [`../../ui/design-system.md`](../../ui/design-system.md) `## 기초`
근거: [`prd.md`](./prd.md) ADR-1~8
