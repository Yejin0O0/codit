# 디자인 시스템 v1 리스킨 — 단위 분해

> `/design-system` Phase 3 산출. GitHub 이슈 1개("디자인 시스템 v1 리스킨")의 본문 체크리스트.
> Phase 4에서 이 스킬이 직접 수행. 각 단위 = 한 커밋 (`refactor(ds):`), 매 단위마다
> typecheck·lint·test → Storybook 확인 → 위젯 스크린샷 → 개발자 눈 승인.

## 4a. `styles/tokens.css` 색 재작성

- `prd.md` ADR-1의 hex → OKLCH 변환해 `:root` 선언 (content 번들이 `:root→:host` 치환)
- `--card-foreground` `--popover-foreground` = `--foreground` 유지
- `@theme inline` 색 매핑은 그대로 (토큰 이름 불변)
- `.dark` 블록: 값 갱신 X (v2). 라이브러리 호환 선언만 유지 — 단 `--primary` 등이 neutral 회색이면 baseline과 어긋나니 v1 라이트 값 미러링 or 주석으로 "v2 TODO"
- 검증: Storybook a11y 전 스토리 AA / 위젯·전 화면 색 반영

## 4b. `styles/tokens.css` 스케일 토큰 추가

- `--radius` = `0.625rem` 유지 (`@theme inline`의 sm/md/lg/xl 파생 이미 있음)
- **elevation**: `--shadow-sm/md/lg/xl` (ADR-5) — `@theme inline`에 `--shadow-*` 매핑 추가 → `shadow-lg` 유틸이 위젯 프레임에 붙음
- **motion**: `--ease-out` `--ease-in-out` `--duration-fast/base/slow` (ADR-6)
- **z-index**: `--z-widget/overlay/toast` (ADR-7)
- **typography**: size 스케일은 Tailwind 기본 그대로 사용(신규 토큰 X). `content/style.css`·`page/style.css`의 `:host`/`body`에 한글 `line-height: 1.6` 반영, 대형 헤딩 `letter-spacing`
- `@media (prefers-reduced-motion: reduce)` 전역 규칙을 각 Surface `style.css`에 추가

## 4c. `entrypoints/popup/*.css` 정리

- `App.css`·`style.css`의 하드코딩 hex(WXT scaffold) 제거 or 토큰화
- popup은 실제 Codit 화면 아님 — 최소화

## 4d. shadcn 프리미티브 (`components/ui/*.tsx`) + 스토리

- **토큰값 교체로 자동 반영되므로 클래스 수정은 최소**. ADR-8 사용 규칙에 맞춰 필요한 것만:
  - `button.tsx` — variant 매핑 확인 (default/outline/secondary/destructive/link/ghost). "뒤로=outline" 규칙은 사용처(screens)에서 이미 outline이면 변경 없음
  - `badge.tsx`·`toggle.tsx`·`toggle-group.tsx` — 톤 클래스 단언 테스트 깨지면 STOP·보고
- 각 프리미티브 `*.stories.tsx` 이미 존재 — 갱신만

## 4e. EXTEND/CUSTOM 조합 + 스토리

- `PanelShell` — `shadow-lg`(위젯 프레임 그림자) 적용, `p-4` 여백
- `TimerDisplay` — `text-4xl`(36px) 확인, `tabular-nums`
- `ResultToggleGroup`·`ResultBadge` — 의미색 톤 클래스 (토큰 이름 불변이라 자동)
- `CollapsedTimer` — pill radius `999px`, 그림자
- `CoditWidget`/`content/style.css` — `:host` 상속 속성(line-height 등)
- 톤-클래스 단언 테스트 깨지면 STOP

## 4f. 로고 SVG 교체

- `brand-header.tsx` — 마름모 `<path d="M8 0 16 8 8 16 0 8Z" />` → **stroke C(라운드 옥타곤 트레이스) + 민트 체크** (ADR: Q3=A). 워드마크 "Codit" = 그라데이션 텍스트(`bg-clip-text`)
- `entrypoints/content/collapsed-timer.tsx` — pill 마크: 같은 C, 16px 단색(`currentColor`/`--primary`), 체크 생략 가능
- `page/index.html`·`popup/index.html` — 파비콘 `<link rel="icon" href="/brand/mark.png">` (또는 32px)
- `.storybook/brand.stories.tsx` — placeholder 경고 박스 제거, 실제 마크로 갱신
- 규격: `docs/ui/brand/README.md`
- SVG path는 만들어서 개발자에게 보여주고 승인

## Phase 5 (별도, 4 완료 후)

- Storybook 스토리 전부 최종 상태로. Playground 시드 = 확정값. `Foundations/Colors`·`Type` 갱신
- `docs/ui/design-system.md ## 기초` 채우기 (ADR 1~8 요약)
- `docs/ui/design-system-worklog.md` 삭제 (durable 내용 흡수 후)
- `docs/ui/_worklog-assets/` 정리

## AC (GitHub 이슈)

- Storybook a11y 전 스토리 대비 AA (텍스트 4.5 / 채운 UI 3.0)
- 위젯 스크린샷이 승인 팔레트와 일치
- `pnpm -r typecheck` · `pnpm --filter @codit/extension lint test build` green
- **레이아웃·컴포넌트 트리·UI State 변경 없음** (레이아웃 재설계는 후속 이슈)
