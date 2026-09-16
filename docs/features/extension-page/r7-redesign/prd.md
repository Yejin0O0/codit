# Extension Page 공통 프레임 재설계 — PRD (리디자인 브리프)

> Layer 2 R7. 에픽 #51 / 이슈 #98.
> **레이아웃만** 재설계 — `ExtensionPageShell`/`PageHeader` props 시그니처 불변.

## 배경

`entrypoints/page`(익스텐션 전용 탭 페이지 — auth / problem-history 공유)의 공통 프레임은
`ca6b713`(add extension page UI foundation)에서 최초 스캐폴딩된 뒤 손대지 않은 상태였다.
위젯 쪽 R0~R6에서 자리잡은 톤(=Codit 패널 정체성: `shadow-lg` 프레임, roomy 헤더 spacing,
h2 타이틀 위계)이 전혀 반영돼 있지 않았다.

- `ExtensionPageShell` — `bg-muted` 배경 + 가운데 정렬 컨테이너 + 헤더 슬롯. 프레임 자체엔 장식 없음.
- `PageHeader` — `border-b` 한 줄 + compact `BrandHeader` + 사용자 표시 + 로그아웃 placeholder(`hidden`).

## 사용자 스토리

- **US-1** 익스텐션 페이지를 열면 위젯과 같은 "Codit 패널" 정체성이 느껴진다.
- **US-2** 히스토리 목록이 길어져도 브랜드/사용자 영역이 스크롤에 밀려 사라지지 않는다.

## 결정 (스파이크에서 개발자 확정, 2026-09-16)

`extension-page-shell.stories.tsx`에 5개 후보(A~E)를 `className`/`header` 슬롯 조합만으로
구현(프로덕션 컴포넌트는 결정 전까지 손대지 않음) — Storybook에서 개발자가 직접 확인 후 결정.

| 안 | 설명 | 결과 |
|---|---|---|
| A | 헤더 리듬만 정리 (border 유지 + 위젯 spacing) | 기각 |
| B | Shadow 카드 헤더 (위젯 톤 echo) | 기각 |
| **C** | **Sticky 헤더 + 콘텐츠 카드** | **채택** |
| D | 브랜드 액센트 스트라이프 | 기각 |
| E | 여백 기반 분리 (무테두리) | 기각 |

**채택 — Option C**: `PageHeader`는 `sticky top-0` + `bg-background/95 backdrop-blur-sm`로
스크롤 시에도 상단 고정. `ExtensionPageShell`은 children을 `bg-background rounded-lg
border shadow-sm` 카드로 한 번 더 감싸 위젯 `PanelShell`과 같은 프레임 언어를 준다.

기각 사유 요약: A는 변화가 너무 약해 "Codit 패널" 정체성이 안 느껴짐. B는 shadow만으로는
sticky 없이 긴 리스트에서 헤더가 스크롤에 밀려나는 문제(US-2)를 안 풀어줌. D는 브랜딩은
가볍지만 US-2를 전혀 해결 못함. E는 구분감이 너무 약해 헤더/본문 경계가 모호해짐.

## AC

- [x] `ExtensionPageShell` / `PageHeader` props 시그니처 불변 (`maxWidth`·`header`·`userName`·`className`)
- [x] 기존 유닛 테스트 전부 통과 — 로그아웃 placeholder(`hidden`, 버튼 없음) 계약 유지
- [x] `entrypoints/page/App.tsx` 두 상태(auth 자리 400px / history 720px) 모두 새 프레임에서 깨지지 않음
- [x] a11y: 헤더가 `<header>` 랜드마크 유지, 대비 axe 통과
- [x] `typecheck` · `lint` · `test` · `build` · `storybook:build` green
- [x] 전/후 스크린샷 (auth 자리 / history 로그인 상태)

## Out of Scope

- 로그아웃 실제 배선 (placeholder 유지 — R8/#4 auth 소관)
- `HistoryView`/`ProblemCard` 등 페이지 콘텐츠 자체 재설계 (R9/R10 소관)
- 로그인 화면 구현 (R8)
