# Issue 7: [FE] Extension Page UI Foundation

> Source of Truth: `docs/ui/ui-architecture.md`, `docs/ui/design-system.md`,
> `docs/features/auth/ui-design.md`, `docs/features/problem-history/ui-design.md`
> 이 문서는 test-scenarios 스킬 산출물 — 시그니처 + 테스트 시나리오 + AC 커버리지.

---

## 범위 (확정)

### In Scope

| 항목 | 위치 (신규) |
|------|------|
| WXT Extension Page entrypoint | `apps/extension/entrypoints/page/index.html` → 빌드 시 `page.html` |
| React mount | `apps/extension/entrypoints/page/main.tsx` |
| Page App | `apps/extension/entrypoints/page/App.tsx` (`ExtensionPageApp`) |
| Extension Page document 전용 스타일 + reset | `apps/extension/entrypoints/page/style.css` |
| 공유 semantic token SoT | `apps/extension/styles/tokens.css` (신규) |
| `ExtensionPageShell` | `apps/extension/components/codit/extension-page-shell.tsx` |
| `PageHeader` | `apps/extension/components/codit/page-header.tsx` |
| `BrandHeader` | `apps/extension/components/codit/brand-header.tsx` |
| `content/style.css` token refactor | 기존 token 선언 → `styles/tokens.css` import 로 치환 (구조적 refactor만) |

### Out of Scope

- toolbar icon 클릭 처리 · `chrome.tabs.create` · `chrome.runtime.getURL` 진입 로직
- toolbar action 을 위한 manifest 커스터마이징
- Popup → Extension Page 이동
- 실제 Auth UI (#8) · 실제 Problem History UI (#9)
- 인증 상태 영속화 (`chrome.storage` 등) · 다크 모드 · 실제 로그아웃 로직
- semantic token 실제 **값** 변경

> WXT 가 Page entrypoint 빌드 시 자동 생성하는 manifest/output 은 허용.

### `entrypoints/content/**` 변경 규칙 (정밀)

**허용**: `entrypoints/content/style.css` 의 token 선언을 `styles/tokens.css` import 로 치환하는 구조적 refactor
("같은 값을 다른 위치에서 공급"). Floating Widget 의 시각/동작 변경 없음.

**불허**: `entrypoints/content/App.tsx`, `entrypoints/content/screens/**`, Timer UI 컴포넌트/flow/상태/mock data,
Widget 크기·위치·동작, semantic token 실제 값.

---

## 시그니처

### 프론트엔드 (TypeScript)

> 반환 타입 주석은 설명용. 실제 구현은 기존 `components/codit/*` 패턴대로 implicit 반환 + `cn()` className 병합.

#### `ExtensionPageShell` — `components/codit/extension-page-shell.tsx`

```ts
interface ExtensionPageShellProps {
    /** 중앙 컨테이너 최대 폭 (px). feature 별로 주입 */
    maxWidth: number;
    /** 상단 헤더 슬롯 (보통 <PageHeader />). 없으면 헤더 영역 생략 */
    header?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export function ExtensionPageShell(props: ExtensionPageShellProps): React.JSX.Element;
```

- **책임**: 배경(`bg-muted`, `min-h-screen`) / 폭(`mx-auto`, `style={{ maxWidth }}`) / 헤더 슬롯 / 본문 프레임.
- **수직 중앙 정렬 안 함** — #8 Auth 가 자체 처리. 컨테이너는 상단 기준.
- `data-slot`: 루트 `extension-page-shell`, 헤더 영역 `extension-page-shell-header` (`header` 있을 때만, 컨테이너보다 앞), `maxWidth` 적용 컨테이너 `extension-page-shell-container` (기존 `components/ui/*` 의 `data-slot` 컨벤션).

#### `BrandHeader` — `components/codit/brand-header.tsx`

```ts
interface BrandHeaderProps {
    /** full: 로고 + 워드마크 + 설명 문구 / compact: 로고 + 워드마크 (설명 문구만 생략) */
    variant?: 'full' | 'compact';
    className?: string;
}

export function BrandHeader(props: BrandHeaderProps): React.JSX.Element;
```

| variant | 인라인 SVG 로고 | "Codit" 워드마크 | 설명 문구 "문제풀이 기록을 관리하세요" |
|---------|:---:|:---:|:---:|
| `full` (기본) | ✅ | ✅ | ✅ |
| `compact` | ✅ | ✅ | ❌ |

- `variant` 타입은 `'full' | 'compact'` 로 제한. 미전달(undefined) → `full` 렌더.
- 로고: 인라인 `<svg>` 마름모 마크. 아이콘 라이브러리 import 없음.
- 워드마크·문구 문자열은 컴포넌트 내부 상수.
- `data-slot`: 루트 `brand-header`.

#### `PageHeader` — `components/codit/page-header.tsx`

```ts
interface PageHeaderProps {
    /** 현재 로그인 사용자 표시 (mock). 없으면 우측 사용자 영역 생략 */
    userName?: string;
    className?: string;
}

export function PageHeader(props: PageHeaderProps): React.JSX.Element;
```

- 레이아웃: `◆ Codit  ····················  userName`
- 좌: `<BrandHeader variant="compact" />` 고정 (내부 사용).
- 우: `userName` 있으면 표시, 없으면 생략.
- 로그아웃 자리: `<div data-slot="page-header-logout" hidden />` — DOM 존재, 미표시. 실제 Button/동작 없음.
- `data-slot`: 루트 `page-header`, 우측 사용자 영역 `page-header-user` (`userName` 있을 때만 렌더), 로그아웃 자리 `page-header-logout`.

#### Page 루트 — `entrypoints/page/App.tsx`

```ts
interface ExtensionPageAppProps {
    /** 초기 인증 상태 (mock, 테스트 주입용). 기본 false */
    initialAuthed?: boolean;
}

export default function ExtensionPageApp(props: ExtensionPageAppProps): React.JSX.Element;
```

```ts
const AUTH_MAX_WIDTH = 400;      // px
const HISTORY_MAX_WIDTH = 720;   // px

const [isAuthed] = useState(props.initialAuthed ?? false);  // setter 미선언 (#8에서 추가)
```

| `isAuthed` | 렌더 |
|---|---|
| `false` (기본) | `<ExtensionPageShell maxWidth={AUTH_MAX_WIDTH} header={<PageHeader />}>` + `<section aria-label="로그인 화면 자리">` placeholder |
| `true` | `<ExtensionPageShell maxWidth={HISTORY_MAX_WIDTH} header={<PageHeader userName="you@example.com" />}>` + `<section aria-label="문제풀이 기록 화면 자리">` placeholder |

- Router 미도입. `isAuthed` 토글 UI 없음.

#### `entrypoints/page/main.tsx`

```ts
ReactDOM.createRoot(document.getElementById('root')!).render(<ExtensionPageApp />);
```

`index.html` = `<div id="root"></div>` + `main.tsx` 스크립트 (popup 선례와 동일 구조).

### CSS 자산 구조

```
apps/extension/styles/tokens.css
  → 두 Surface 공유 semantic token SoT
  → --background --foreground --card --card-foreground --popover --popover-foreground
    --primary --primary-foreground --secondary --secondary-foreground
    --muted --muted-foreground --accent --accent-foreground
    --destructive --border --input --ring --success --warning --radius
  → 공유 @theme inline mapping (semantic token → Tailwind utility)
  → Surface 전용 스타일은 넣지 않음

apps/extension/entrypoints/content/style.css
  → @import '@/styles/tokens.css' (또는 상대경로)
  → Floating Widget / Shadow DOM 전용: :host reset, 320px width, 상속 속성 확정
  → content script 가 최종 번들 CSS 에 대해 :root → :host 치환 수행 (기존 index.tsx 유지)

apps/extension/entrypoints/page/style.css
  → @import '@/styles/tokens.css'
  → Extension Page document 전용: html/body/#root sizing, page background, document 기본 레이아웃
  → 치환 없음 — token 이 :root 에 그대로 적용
```

### 에러 케이스

| 조건 | 동작 |
|------|------|
| `ExtensionPageShell` `header` 미전달 | 헤더 영역 렌더 안 함, 크래시 없음, children 정상 렌더 |
| `PageHeader` `userName` 미전달 | 우측 사용자 영역 생략 (좌측 브랜드 유지) |
| `BrandHeader` `variant` 미전달 (undefined) | `full` 로 렌더 |
| `ExtensionPageApp` `initialAuthed` 미전달 | `false` → 로그인 화면 자리 |
| 공유 `tokens.css` import 가 `?inline` CSS 에 미포함되거나 `:root → :host` 치환 미적용 | **토큰 복제로 우회하지 않는다.** 빌드 결과·원인 보고 후 중단 (Green 단계 규칙) |

---

## 테스트 시나리오

### 정상

- [정상] BrandHeader — should render inline SVG logo + "Codit" wordmark + description text when variant is "full"
- [정상] BrandHeader — should render inline SVG logo + "Codit" wordmark and omit the description text when variant is "compact"
- [정상] BrandHeader — should render the logo as an inline `<svg>` element (no `<img>`, no icon-library import)
- [정상] BrandHeader — should merge `className` into the root element
- [정상] PageHeader — should render the Codit brand (compact BrandHeader: wordmark shown, description hidden) on the left
- [정상] PageHeader — should render `userName` on the right when `userName` is given
- [정상] PageHeader — should render a logout placeholder region carrying `data-slot="page-header-logout"`
- [정상] PageHeader — should keep the logout placeholder present in the DOM but not visible, with no button/role
- [정상] ExtensionPageShell — should render `children` inside the centered container
- [정상] ExtensionPageShell — should render the `header` slot above the content when `header` is given
- [정상] ExtensionPageShell — should apply `maxWidth` (number) as the container's `max-width` inline style in px
- [정상] ExtensionPageShell — should apply the muted page background to the outer frame
- [정상] ExtensionPageShell — should merge `className`
- [정상] ExtensionPageApp — should render the login-screen placeholder (`aria-label="로그인 화면 자리"`) when `initialAuthed` is `false`
- [정상] ExtensionPageApp — should render the problem-history placeholder (`aria-label="문제풀이 기록 화면 자리"`) when `initialAuthed` is `true`
- [정상] ExtensionPageApp — should mount ExtensionPageShell with `maxWidth` 400 and a PageHeader without `userName` in the unauthenticated branch
- [정상] ExtensionPageApp — should mount ExtensionPageShell with `maxWidth` 720 and a PageHeader with the mock `userName` in the authenticated branch
- [정상] token SoT — should declare every semantic token **value** (`--background:` `--foreground:` `--card:` `--popover:` `--primary:` `--secondary:` `--muted:` `--accent:` `--destructive:` `--border:` `--input:` `--ring:` `--success:` `--warning:` `--radius:`, i.e. `<token>:` value declarations) only in `styles/tokens.css`, with `entrypoints/content/style.css` and `entrypoints/page/style.css` re-declaring none of those values
  - 허용(실패 아님): `var(--background)` 등 token **참조** · `@theme inline` 의 `--color-*` mapping · `tokens.css` import · 각 Surface 전용 스타일(`:host` reset, 320px width, html/body sizing 등)
  - 검증 대상: "semantic token 사용 금지" 가 아니라 "semantic token **값 중복 선언** 금지"

### 경계

- [경계] BrandHeader — should render the "full" layout (description present) when `variant` prop is omitted (`variant` 타입은 `'full' | 'compact'` 로 제한되므로 미인식 값 케이스는 다루지 않는다)
- [경계] ExtensionPageShell — should apply `max-width` exactly `400px` and exactly `720px` when those values are passed
- [경계] ExtensionPageApp — should default to the login-screen placeholder when `initialAuthed` is omitted

### 예외

- [예외] PageHeader — should omit the user area (no user text node) when `userName` is not given, while still rendering the brand
- [예외] ExtensionPageShell — should omit the header region (no header element) and still render `children` when `header` is not given
- [예외] ExtensionPageApp — should render both auth branches at the same document URL — no `history`/`location` navigation, no router (state-driven branch only)

### 빌드·통합 검증 (non-unit — Vitest 범위 밖, create-pr / dev 확인 단계)

- [통합] Extension Page entrypoint — `wxt build` 산출물에 `page.html` 이 생성되고, 해당 URL 직접 접근 시 `ExtensionPageApp` 이 렌더된다
- [통합] Extension Page computed style — `:root` 기준으로 semantic token(`--background` `--foreground` `--primary` `--border` `--radius` `--success` `--warning` `--destructive`)이 정상 적용된다 (치환 없음)
- [통합] Floating Widget computed style — 동일 token 이 Shadow DOM `:host` 기준으로 정상 적용된다 (content script 치환 경로 유지)
- [통합] Floating Widget 회귀 — token 추출 전/후 Widget 주요 computed style(background / foreground / primary / border / radius / success / warning / destructive)이 동일하다
- [통합] Timer 시각 회귀 — dev 에서 기존 Timer 화면을 직접 열어 시각적 회귀가 없다
- [통합] CI 게이트 — `typecheck` / `lint` / `test` / `build` 전부 통과한다

---

## AC 커버리지

> AC 는 이번 세션 결정으로 정밀화됨 (GitHub Issue #7 본문과 동기화).

| AC | 커버 시나리오 |
|----|--------------|
| AC-1 `ExtensionPageShell` 이 배경 + 중앙 정렬 컨테이너 + 헤더 슬롯을 렌더하고 `maxWidth` 를 외부 주입 | [정상] ExtensionPageShell children/header/background · [정상] ExtensionPageShell maxWidth inline style · [경계] max-width 400/720 · [예외] header 미전달 시 생략 |
| AC-2 `PageHeader` 가 브랜드 + mock 사용자 슬롯을 렌더하고, 로그아웃 영역은 자리만 존재+미표시 | [정상] PageHeader 브랜드(compact) · [정상] userName 표시 · [정상] logout `data-slot` 존재 · [정상] logout 미표시·버튼 없음 · [예외] userName 미전달 시 사용자 영역 생략 |
| AC-3 `BrandHeader` 가 인라인 SVG 로고 + 서비스명 렌더 (외부 아이콘 라이브러리 의존 없음) | [정상] full 로고+워드마크+문구 · [정상] compact 문구 생략 · [정상] 인라인 `<svg>` (no img/import) · [경계] variant 생략 시 full |
| AC-4 Page 루트 mock `isAuthed` 값에 따라 Auth 자리 / Problem History 자리 분기 | [정상] false → 로그인 자리 · [정상] true → 기록 자리 · [정상] 분기별 maxWidth/PageHeader · [경계] initialAuthed 생략 시 로그인 자리 |
| AC-5 화면 전환에 Router 라이브러리 사용 안 함 | [예외] ExtensionPageApp — 두 분기 동일 URL, router 없음 (state-driven) · [통합] CI 게이트 (router 의존성 미추가) |
| AC-6 Extension Page 에서 shadcn 프리미티브 + 디자인 토큰이 `:root` scope 로 정상 적용 (Shadow DOM 경로 아님) | [정상] token SoT 단일 파일 · [통합] Extension Page computed style `:root` 적용 |
| AC-7 Floating Widget Production 동작·UI 컴포넌트 미변경. `content/style.css` token import refactor 만 허용. 추출 전후 Widget 주요 computed style 불변 | [정상] token SoT (content/style.css 토큰 재선언 없음) · [통합] Floating Widget `:host` computed style · [통합] Widget 회귀 (전후 동일) · [통합] Timer 시각 회귀 |
| AC-8 Extension Page 가 존재하고, WXT 가 생성한 Page URL 직접 접근 시 렌더된다 | [통합] `wxt build` → `page.html` 생성 및 렌더 · [정상] ExtensionPageApp 렌더 시나리오 전부 |

### 커버리지 노트

- AC-5 / AC-6 / AC-7 / AC-8 은 jsdom 단위 테스트로 완전 검증 불가 → **빌드·통합 검증** 항목으로 보완. Vitest 는 `ExtensionPageApp` + 3개 컴포넌트의 렌더/분기/슬롯 동작 + token SoT 정적 검사를 담당.
- `[예외]` "동일 URL, router 없음" 은 `initialAuthed` 두 값으로 렌더 후 `window.location` 불변 확인 + router 패키지 미도입 정적 확인으로 성립.
- token SoT 테스트는 semantic token **값 선언**(`<token>:` 형태)의 중복만 검사한다. `var(--token)` 참조, `@theme inline` 의 `--color-*` mapping, `tokens.css` import, Surface 전용 스타일은 실패 사유가 아니다.
- `BrandHeader.variant` 는 `'full' | 'compact'` 타입으로 제한되므로 "미인식 variant" 예외 시나리오는 두지 않는다 (타입을 우회해 테스트하지 않는다). `variant` 미전달 → `full` 경계 시나리오만 유지.

---

## TDD Red → Green (2026-09-02)

### 테스트 결과 — 27/27 통과

| 테스트 파일 | 통과 | 구현 파일 커버리지 |
|---|---|---|
| `components/codit/brand-header.test.tsx` | 5 | `brand-header.tsx` 100% |
| `components/codit/page-header.test.tsx` | 6 | `page-header.tsx` 100% |
| `components/codit/extension-page-shell.test.tsx` | 7 | `extension-page-shell.tsx` 100% |
| `entrypoints/page/App.test.tsx` | 6 | `page/App.tsx` 100% |
| `styles/tokens.test.ts` | 3 | (정적 파일 검사) |

미커버: `entrypoints/page/main.tsx` (React mount, `[통합]` 레벨 — 단위 시나리오 없음).

### 구현 파일

- `components/codit/brand-header.tsx` — `BrandHeader` (인라인 SVG 마름모 + "Codit" + full 시 문구)
- `components/codit/page-header.tsx` — `PageHeader` (compact BrandHeader + userName + hidden logout slot)
- `components/codit/extension-page-shell.tsx` — `ExtensionPageShell` (bg-muted / mx-auto + inline maxWidth / header slot)
- `entrypoints/page/App.tsx` — `ExtensionPageApp` (`useState(initialAuthed ?? false)`, isAuthed 분기 + placeholder)
- `entrypoints/page/index.html` + `main.tsx` — WXT Page entrypoint (`ExtensionPageApp` mount)
- `entrypoints/page/style.css` — Extension Page document reset + `@import '../../styles/tokens.css'`
- `styles/tokens.css` — semantic token 값 + `@theme inline` (두 Surface SoT)
- `entrypoints/content/style.css` — token 선언 제거, `@import '../../styles/tokens.css'` 로 치환 (구조적 refactor)
- `vitest.config.ts` — `@` alias 추가 (WXT 빌드 alias 를 vitest 에 제공)
- `vitest.d.ts` — vitest globals + jest-dom 타입 참조

### 빌드·통합 검증 결과

- `wxt build` → `page.html` (496 B) + `assets/page-*.css` 정상 생성. EXIT 0.
- **Floating Widget 회귀 없음 (byte-identical)**: refactor 전/후 `wxt build` 산출물 `content.js` 의 `:root{--radius…}` 토큰 블록이 **완전히 동일**함을 확인 (`git stash` 로 전/후 빌드 비교, `OLD === NEW` = true).
- 공유 `tokens.css` 의 `@import` 가 content script `?inline` 번들에 정상 인라인됨. 런타임 `$i.replaceAll(':root', ':host')` 로 토큰이 `:host` 스코프에 재배치됨 (기존 메커니즘 그대로).
- Extension Page CSS (`page-*.css`) 의 `:root` 토큰 블록이 content 번들과 동일 값.
- Tailwind v4 기본 theme 는 `:root,:host` 양쪽을 타깃하므로 Shadow DOM 호환 유지.
- typecheck 0 errors · `eslint entrypoints components lib` clean · vitest 27/27.

## AC 검증 결과 — /ac-verifier 7 PASS (2026-09-02)

독립 검증(ac-verifier 에이전트) + 실제 Chrome(시스템 채널) 렌더 검증.

| AC | 판정 | 근거 |
|----|------|------|
| AC-1 ExtensionPageShell | MET | 코드 + 7 테스트 (bg-muted / mx-auto+maxWidth inline / header 조건부 슬롯) |
| AC-2 PageHeader | MET | 코드 + 6 테스트 + 실브라우저: `<PageHeader />`(userName 없음) 렌더 시 `page-header-logout` DOM 존재 & `not visible`, 실제 버튼 없음 |
| AC-3 BrandHeader | MET | 코드 + 5 테스트 (인라인 `<svg>`, 아이콘 라이브러리 import 0, full=문구 포함 / compact=문구만 생략, `variant` 타입 `'full'\|'compact'`) |
| AC-4 isAuthed 분기 | MET | 코드 + 6 테스트 (`useState(initialAuthed ?? false)`, false→maxWidth 400 placeholder / true→720 placeholder, setter 미선언) |
| AC-5 Router 미사용 | MET | router 의존성 0, `window.location` 두 분기 불변, `wxt.config.ts` 무변경 |
| AC-6 Extension Page `:root` scope | MET | `page/style.css` `:host` 규칙 0 · **실브라우저**: `getComputedStyle(:root)` `--background: oklch(100% 0 0)` / `--primary: oklch(20.5% 0 0)`, 페이지에 `#codit-root` 없음 (Shadow DOM 경로 아님) |
| AC-7 Floating Widget 무회귀 | MET | **빌드 산출 `content.js` 전체가 리팩터 전/후 byte-for-byte 동일 (292001 B, `git show HEAD` 스왑 후 `cmp`)** · `manifest.json` 동일 · `content/` 변경은 `style.css` 1개(토큰 블록 제거 + `@import`)뿐 · `content/index.tsx`의 `replaceAll(':root',':host')` 유지 · 실브라우저 위젯 렌더 정상(`:host` 토큰 스코프, `:root` 누수 없음, 320px/14px) |
| AC-8 page.html 직접 접근 렌더 | MET | `wxt build` → `page.html`(496 B) + `assets/page-*.css` · **실브라우저(로컬 http + 시스템 Chrome)**: `#root` 렌더(844자), `pageerror` 0, `console.error` 0 (favicon.ico 404만 — Chrome 자동 요청, 무해), 리소스 전부 200, placeholder + `◆ Codit` 표시 |

### 게이트 명령 (전부 통과)

| 명령 | 결과 |
|---|---|
| `tsc --noEmit` | EXIT 0, 0 errors |
| `eslint entrypoints components lib` | EXIT 0, clean |
| `vitest run` | 27/27 pass (5 files) |
| `wxt build` | ✔ EXIT 0, `page.html` 생성 |

### 경계 재확인

- `packages/shared-types/**` 무변경 · `wxt.config.ts` 무변경 · `manifest.json` 무변경 (page.html 항목 없음)
- `entrypoints/page/`에 `chrome.*` / `browser.action` / `getURL` 0건
- `entrypoints/content/App.tsx` · `screens/**` · `useTimer.ts` · `mockData.ts` · `index.tsx` diff 0
- Auth 자리 / Problem History 자리는 `<section aria-label>` placeholder만 — form/input/list/filter 컴포넌트 없음

## TDD Refactor (2026-09-02)

### 코드 구조 리팩터 — 적용 0건

Green 구현이 이미 하우스 패턴(`components/codit/*`, `entrypoints/content/App.tsx`의 wrapper 반복 스타일)에 부합. 임의 구조 변경은 컨벤션 이탈이 되어 미적용:
- `App.tsx`의 두 분기 `<ExtensionPageShell>` 반복은 `content/App.tsx`의 `<CoditWidget>` 5회 반복과 동일 패턴 → dedup 안 함. placeholder는 #8/#9에서 교체될 임시 코드.

### AC verifier 비차단 항목 처리 — 2건

| 항목 | 처리 |
|---|---|
| A. PageHeader 테스트 gap | `page-header.test.tsx`에 테스트 1건 추가 — `userName` 없을 때도 `page-header-logout` 존재 + `not visible` + logout `<button>` 없음 검증. 기존 테스트와 비중복 (기존 4·5번은 `userName` 있는 케이스). |
| B. coverage 산출물 | `@vitest/coverage-v8` 기본 출력 `apps/extension/coverage/`가 미ignore 확인 → `apps/extension/.gitignore`의 빌드 산출물 블록(`.output` 옆)에 `coverage` 1줄 추가. `--coverage` 재실행 후 git status 미노출 확인. |

### 게이트 재실행 (전부 통과)

| 명령 | 결과 |
|---|---|
| `tsc --noEmit` | EXIT 0, 0 errors |
| `eslint entrypoints components lib` | EXIT 0, clean |
| `vitest run` | **28/28 pass** (27 → +1) |
| `wxt build` | ✔ EXIT 0, `page.html` 496 B |

### 경계 확인

- `entrypoints/content/**` production 코드 변경 0 (이번 라운드는 test 파일 + `.gitignore`만). `content/style.css`는 Green 상태 그대로 → `content.js` 빌드 산출 HEAD 대비 byte-identical 유지.
- `packages/shared-types/**` 변경 0 · #8/#9 범위 코드 0.

---

## Security Review (2026-09-02) — /security-review 7 PASS

### #7 범위 내 실제 취약점: 0건

| 점검 | 결과 |
|---|---|
| `dangerouslySetInnerHTML` / `innerHTML` / `eval` / `new Function` | 없음 |
| 외부 입력 → HTML 주입 | 없음 (mock `userName`은 `{userName}` plain JSX text child, React 자동 이스케이프) |
| unsafe inline script | 없음 (`page/index.html`은 로컬 번들 `<script type="module" src="./main.tsx">`만) |
| 외부 script / remote resource | 없음 (BrandHeader SVG 인라인 `<path>` 1개, `xlink`/`<use>`/`<image>`/이벤트 핸들러 0 · CSS `@import`는 전부 npm/로컬 빌드타임 · `url()`/remote `@import`/`http:` 0) |
| `chrome.*` / 새 extension permission | 없음 (`entrypoints/page/`에 `chrome.*`·`browser.*` 0건) |
| manifest 권한 변경 | 없음 (빌드 manifest에 `permissions`/`host_permissions`/`content_security_policy`/`web_accessible_resources` 키 자체가 없음 — pre-#7과 동일) |
| 외부 URL navigation / open redirect | 없음 (`window.location`·`.open`·`<a href>` 0, router 없음) |
| credential/token 저장 · localStorage/sessionStorage/chrome.storage/IndexedDB/cookie | 없음 |
| 실제 Auth API / History API 호출 (`fetch`/`XHR`/`axios`) | 없음 |
| console 민감정보 출력 | 없음 (#7 소스에 `console.*` 0건) |
| 신규/위험 dependency | 없음 (`apps/extension/package.json`·루트·`shared-types` + `pnpm-lock.yaml` 전부 무변경) |
| 빌드 아웃풋 secret 노출 | 없음 (page 번들: JWT/API key/AWS key/PEM/Bearer 0. `you@example.com`은 하드코딩 placeholder 리터럴) |
| `.env` 노출 | N/A (repo에 `.env` 파일 없음) |

### 의존성 취약점: 2 high — pre-existing, #7 범위 밖, 미shipped → Future Concern

`image-size <= 2.0.2` (2× high, JXL/HEIF 파서 무한루프 DoS)
- 경로: `wxt`/`web-ext` → `addons-linter` → `image-size` (빌드·린트 전용 devDependency)
- **shipped 번들에 없음** (`.output/`의 "imageSize" grep 매치는 React `imageSrcSet`/`imageSizes` prop — false positive)
- **#7이 도입하지 않음** (`package.json`·`pnpm-lock.yaml` 무변경) · patched 버전 없음 (`<0.0.0`)
- 실질 공격 벡터 negligible (개발자가 자기 확장 패키지에 악성 이미지 넣고 린트할 때만)
- **분류: Informational — #7 BLOCK 안 함. `wxt`/`web-ext` 업그레이드 시 재확인.**

### Future Concern (#8/#9 Auth/API 단계 검토 — 현재 #7 비차단)

1. mock `isAuthed` boolean은 신뢰 경계가 아님 — #8 실제 인증 시 서버/토큰 검증 필수.
2. `MOCK_USER` 하드코딩 → #8/#9에서 실제 사용자 데이터로 교체 시 `{userName}` plain-text 렌더 패턴 유지 (`dangerouslySetInnerHTML` 금지).
3. `page.html`이 `web_accessible_resources`에 없음 — #8 toolbar 진입 추가 시 노출 범위 재검토.
4. `content_security_policy` 미선언 (MV3 기본 CSP 적용 중) — #8 API 호출 추가 시 `connect-src` 명시 검토.

### 게이트 (전부 통과)

`tsc --noEmit` 0 errors · `eslint entrypoints components lib` clean · `vitest run` 28/28 · `wxt build` EXIT 0.

### 처리

수정 0건 (#7 범위 내 조치 필요 항목 없음). Critical/High 실취약점 없음.
