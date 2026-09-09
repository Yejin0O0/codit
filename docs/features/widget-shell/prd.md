# 위젯 공통 프레임 재설계 — PRD (리디자인 브리프)

> Layer 2 R0. 에픽 #51 / 이슈 #52. 기능 추가 아님 — 기존 `PanelShell`·`CoditWidget`의
> **레이아웃만** 재설계. 상태·props·동작 로직 불변.

## 배경

Layer 0(#46)에서 토큰·색·스킨은 통일됐다. 프레임 자체의 정보 위계·간격 리듬·구분
방식은 timer 기능 최초 구현 그대로다. 위젯 5화면이 전부 이 프레임에 얹히므로 먼저 재설계한다.

## 사용자 스토리

- **US-1** SWEA 문제 페이지에서 위젯을 볼 때, 프레임이 페이지 콘텐츠와 명확히 분리되어 "Codit 패널"로 인지된다.
- **US-2** 헤더에서 현재 화면 제목과 진행 단계(`2 / 4` 등)를 한눈에 구분한다.
- **US-3** 접기 컨트롤이 헤더에서 명확한 타겟으로 보이고, 드래그 핸들 영역과 혼동되지 않는다.
- **US-4** 본문 → 액션(푸터) 흐름이 시각적으로 자연스럽게 읽힌다.

## AC

이슈 #52의 AC와 동일 — 시그니처 불변 / 기존 동작 테스트 통과 / 5화면 무결 / a11y axe /
typecheck·lint·test·build green / 위젯 스크린샷 개발자 승인.

## Out of Scope

- 컴포넌트 분해·props 변경·상태 이동
- 화면 내부(Timer·ResultSelect 등) 콘텐츠 레이아웃 → R1~R5
- 다크 모드
- 새 토큰 값 정의 (필요 시 flag만)

## 참조

- 현재 구현: `apps/extension/components/codit/panel-shell.tsx`
- `docs/ui/design-system.md ## 기초`
- `docs/ui/ui-architecture.md`
