# Extension Page Foundation — AS-BUILT Current Spec

**Status: AS-BUILT / Retrospective.** PR #10 (`0fda5f6`, `team/develop` 머지)까지의
실제 구현·테스트·리뷰 결과만 기록한다. 새 요구사항을 만들어내지 않는다.

이 문서는 [`issue-7.md`](./issue-7.md) 를 **대체하지 않는다.** `issue-7.md` 는 시그니처·
시나리오·AC·TDD 로그 원본이고, 이 문서는 현재 코드 기준의 AS-BUILT 요약이다.

---

## 사용자 목적

Codit 익스텐션의 **일반 document 화면(popup 이 아닌 full page)** 을 제공한다. 현재는
Problem History 의 컨테이너이며, 이후 Auth 등 다른 화면의 공통 프레임(shell / header)
역할을 한다. 두 UI Surface(Floating Widget / Extension Page)가 **같은 semantic token
을 공유**하도록 확정한다.

---

## 현재 구현된 동작

### 1. Page entrypoint

- `entrypoints/page/index.html` — `<div id="root">` + `main.tsx` 모듈 스크립트,
  `lang="ko"`, `<title>Codit</title>`. WXT 가 `page.html` 산출물로 빌드.
- `entrypoints/page/main.tsx` — `ReactDOM.createRoot(#root).render(<React.StrictMode>
  <ExtensionPageApp /></React.StrictMode>)`, `./style.css` import.
- `entrypoints/page/style.css` — `@import 'tailwindcss'` + `tw-animate-css` +
  `../../styles/tokens.css`. **`:root` → `:host` 치환 없이** `:root` 로 토큰 적용
  (자체 document). document 전용 리셋(`html/body/#root` min-height 100vh, body
  `background: var(--muted)`, `color-scheme: light`, 시스템 폰트 14px, `@layer base`
  border/outline).

### 2. Shell / Header 조합 (`components/codit/`)

| 컴포넌트 | 동작 |
|---|---|
| `ExtensionPageShell` | `props: { maxWidth: number, header?: ReactNode, children, className? }`. 바깥 프레임 `bg-muted min-h-screen`, `header` 있으면 헤더 슬롯을 콘텐츠 위에, 중앙 정렬 컨테이너 `mx-auto w-full px-4 py-6` 에 `style={{ maxWidth }}` (px inline). `data-slot` 부여. |
| `PageHeader` | `props: { userName?: string, className? }`. 좌측 `BrandHeader variant="compact"`, 우측 `userName` 있으면 텍스트, 그리고 `data-slot="page-header-logout"` 자리(hidden, 버튼 없음). |
| `BrandHeader` | `props: { variant?: 'full' \| 'compact', className? }`. 인라인 SVG 로고 마크 + "Codit" 워드마크. `variant="full"`(기본) 은 설명 문구 포함, `compact` 는 생략. lucide 미도입 — 인라인 `<svg><path>`. |

### 3. Page 루트 (`entrypoints/page/App.tsx`) — 현재는 History + auth placeholder

`ExtensionPageApp({ initialAuthed })`:

- `useState(initialAuthed ?? false)` — **mock, 테스트 주입용. 실제 auth 로직 없음.**
- `isAuthed` → `<ExtensionPageShell maxWidth={720} header={<PageHeader userName="you@example.com"/>}>`
  안에 `<HistoryView />` (Problem History Feature).
- 미인증 → `<ExtensionPageShell maxWidth={400} header={<PageHeader/>}>` +
  `<section aria-label="로그인 화면 자리">` placeholder ("로그인 화면은 이후 이슈에서
  구현됩니다").
- Router 라이브러리 없음. 두 분기가 같은 document URL 에서 렌더된다.

### 4. Semantic token Source of Truth (`styles/tokens.css`)

- 두 Surface 가 공유하는 semantic token 값 선언 + 공유 `@theme inline` 매핑만 둔다.
- Floating Widget(content): 번들 CSS 의 `:root` → `:host` 치환으로 Shadow Root 스코프.
- Extension Page: 치환 없이 `:root`.
- Surface 전용 스타일(`:host` reset, 320px, html/body sizing)은 각 `style.css` 책임.
- 라이트 고정 테마(`.dark` variant 는 라이브러리 호환 선언만).

---

## 현재 상태 / 데이터 모델

| 개념 | 형태 | 비고 |
|---|---|---|
| `initialAuthed` | `boolean?` (기본 false) | mock — 실제 세션 판정 없음 |
| `AUTH_MAX_WIDTH` / `HISTORY_MAX_WIDTH` | `400` / `720` | inline `style.maxWidth` px |
| `MOCK_USER` | `'you@example.com'` | 인증 분기 PageHeader 표시용 |
| semantic tokens | shadcn `neutral`(OKLCH) + `--success`/`--warning`/`--destructive`/`--radius` | `styles/tokens.css` SoT |

`chrome.*` / `browser.action` / `getURL` / router / API — `entrypoints/page/` 에 0건.

---

## 주요 Production 코드

| 파일 | 역할 |
|---|---|
| `apps/extension/entrypoints/page/{index.html, main.tsx, style.css}` | Page entrypoint |
| `apps/extension/entrypoints/page/App.tsx` | Page 루트 — auth 분기, shell + header 조립 |
| `apps/extension/components/codit/extension-page-shell.tsx` | 배경 / 중앙 정렬 컨테이너 / 헤더 슬롯 프레임 |
| `apps/extension/components/codit/page-header.tsx` | 상단 바 (브랜드 + 사용자(mock) + 로그아웃 자리) |
| `apps/extension/components/codit/brand-header.tsx` | 로고 마크(인라인 SVG) + 서비스명 + 문구 |
| `apps/extension/styles/tokens.css` | 두 Surface 공유 semantic token SoT |
| `apps/extension/styles/tokens.test.ts` | 토큰 선언 완전성 검증 |

---

## 현재 Test 가 보장하는 동작

| 파일 (it 수) | 보장 요지 |
|---|---|
| `components/codit/extension-page-shell.test.tsx` (7) | children 을 가운데 컨테이너에 렌더 · header 주어지면 콘텐츠 위 · `maxWidth`(number) → inline `max-width` px · 바깥 프레임 `bg-muted` · `className` 병합 · 400px/720px 정확 적용 · header 없으면 헤더 영역 생략 |
| `components/codit/page-header.test.tsx` (7) | 좌측 compact BrandHeader · 브랜드 설명 문구 미표시 · `userName` 주어지면 우측 표시 · `data-slot="page-header-logout"` placeholder 존재 · DOM 에 있으나 비표시, 버튼 없음 · `userName` 없으면 사용자 영역 생략(브랜드 유지) · `userName` 없어도 로그아웃 placeholder 유지·숨김·버튼 없음 |
| `components/codit/brand-header.test.tsx` (5) | `variant="full"` → 인라인 SVG 로고 + "Codit" + 설명 · `variant="compact"` → 설명 생략 · 로고는 `<img>` 아닌 인라인 `<svg>` · `className` 루트 병합 · `variant` 생략 시 "full" |
| `entrypoints/page/App.test.tsx` (6) | (Problem History spec-current 에 상세) `initialAuthed=false` → 로그인 placeholder · 인증 → `HistoryView` · 생략 시 기본 placeholder · 비인증 max-width 400 + userName 없는 PageHeader · 인증 max-width 720 + mock userName · 두 분기 같은 URL(router 없음) |
| `styles/tokens.test.ts` (3) | `styles/tokens.css` 가 모든 semantic token 값 선언 · `entrypoints/content/style.css` 는 custom-property 값 선언 안 함(var() 참조만) · `entrypoints/page/style.css` 존재 + custom-property 값 선언 안 함 |

---

## Resolved Review Feedback

이 Feature 에 직접 대응한 PR #10 리뷰 코멘트는 없다. (Extension Page 컨테이너
maxWidth 등은 `docs/handoff/frontend-handoff.md` §8 에 "구현 시 확정" 으로만 표기.)

간접 연결: `321f54c` 의 `eslint .` 확장으로 `styles/tokens.test.ts` 가 lint 대상이
되었다 (이전엔 `entrypoints components lib` 만 검사).

---

## Regression Constraints

1. **semantic token SoT** — 토큰 값은 `styles/tokens.css` 한 곳에서만 선언한다.
   각 Surface `style.css` 는 `var()` 참조와 Surface 전용 리셋만 둔다. `tokens.test.ts`
   가 이를 강제한다.
2. **Surface 분리** — Floating Widget = Shadow DOM(`:root`→`:host`), Extension Page =
   자체 document(`:root`). 두 Surface 가 서로의 스타일에 의존하지 않는다.
3. **Router 미도입** — 화면 전환은 상위 단일 상태(`isAuthed`, 이후 실제 인증 상태).
4. **`entrypoints/page/` 순수성** — `chrome.*` / `getURL` / API 호출 없음(현재). Auth
   연동 담당자가 여기서 인증 상태를 연결할 때 이 파일이 공유 integration boundary.
5. **lucide 미도입** — 브랜드/아이콘은 인라인 SVG.

---

## Known Gaps

- Auth 는 placeholder — 실제 로그인/세션 없음(`initialAuthed` prop 만).
- `docs/features/auth/ui-design.md` 는 **stale** (email/password 기반, Product Decision
  으로 폐기). 현재 구현 기준 아님. Auth 는 다른 FE 담당자 범위(Social Login only).
- popup / background entrypoint 는 WXT 기본 스캐폴드 그대로 (이 Feature 산출물 아님).
- Toolbar icon → Extension Page 진입(`chrome.tabs.create` / `chrome.runtime.getURL`)
  은 `issue-7.md` Out of Scope, 미구현.

---

## Follow-up

- **Auth (Social Login only)** — 다른 FE 담당자. `entrypoints/page/App.tsx` 의
  `isAuthed` 를 실제 인증 상태에 연결. `docs/features/auth/ui-design.md` 는 재설계 대상.
- **Toolbar → Extension Page 연결** — icon 클릭 시 page 열기.
- **Extension Page breakpoint 확장** — 현재 `w-full` + `max-width` 고정.

---

## Deferred

- Manifest metadata 정리(name/description/icons/version).
- Extension Page 다중 화면 라우팅.

---

## 관련 Commit

`ca6b713`(핵심 — Extension Page UI Foundation) · `08a873c`(설계 docs — design-system /
ui-architecture / ui-design) · `4e09ede`(auth 분기에서 placeholder → `HistoryView`) ·
`321f54c`(lint) · `5702ef4`(테스트 설명 한국어).
