# Design System

> Codit Chrome Extension UI 설계 기준. 아키텍처 규칙은 [ui-architecture.md](./ui-architecture.md) 참조.
>
> **두 섹션의 소유가 다르다:**
> - `## 기초` — `design-system` 스킬이 소유. 토큰 값·팔레트·스케일·테마 정책. `/design-system`으로만 변경.
> - `## feature별 인벤토리` — `fe-ui-design` 스킬이 Feature마다 업데이트. 컴포넌트·EXTEND·CUSTOM 목록.
>
> `tdd-green-frontend`는 이 문서를 읽어 구현 시 참조한다.

---

## 기초

> `/design-system` 스킬 소유. v1 리스킨 확정 (2026-09-07, 이슈 #45). 근거·트레이드오프 전문: [`docs/features/design-system/prd.md`](../features/design-system/prd.md) ADR-1~8.
> SoT는 `apps/extension/styles/tokens.css`. 이 표는 요약 — 값이 갈리면 tokens.css가 정답.
> 카탈로그·튜닝: `pnpm --filter @codit/extension storybook` (`Foundations/Playground`).

### UI Library

- **shadcn/ui** (복사형 — 레포가 소스를 소유). style `new-york`. 라이브러리 교체 안 함 (Shadow DOM 제약).
- **팔레트 방법론**: Radix Colors 12-step (`iris` 브랜드 + `mauve` 뉴트럴 + `green`/`amber`/`red` 의미).
- dependency 절감 — 공통 interactive primitive를 CUSTOM으로 재구현하지 않는다. 아이콘 = 인라인 SVG only.

### 테마 정책

| 항목 | 결정 |
|------|------|
| 다크모드 | **v1 미지원.** 고정 라이트. `.dark` variant는 dormant(라이브러리 호환 선언). v2 = Surface 오버라이드 값 교체 |
| 2계층 | 공통 베이스(`tokens.css :root`) + Surface 오버라이드(`:host` 위젯 / `:root` 페이지, elevation·밀도만) |
| 테마 독립성 | 위젯은 호스트(SWEA) 테마와 무관하게 자체 라이트 확정 |

### 색 토큰 (OKLCH — tokens.css 참조)

| 토큰 | hex | Radix | 용도 |
|------|-----|-------|------|
| `--primary` / `-foreground` | `#5B5BD6` / `#FFF` | iris-9 | 주요 버튼·링크·포커스링·로고 C. 흰 5.3:1 |
| `--ring` | `#9B9EF0` | iris-8 | 포커스 링 3px |
| `--accent` / `-foreground` | `#F1EEFE` / `#5753C6` | iris-3 / -11 | hover 배경 / 그 위 텍스트 |
| `--background` | `#FAF9FC` | mauve-2 | 페이지·위젯 바탕 |
| `--foreground` | `#1A1523` | mauve-12 | 본문·제목·타이머 |
| `--card` / `--popover` | `#F1EFEF` | — | 카드·위젯 표면 (회색 패널 — SWEA 흰 페이지 위 분리). ≈ muted (알려진 트레이드오프) |
| `--muted` / `--secondary` | `#F1EFF5` | mauve-3 | 보조 표면·스켈레톤 / secondary 버튼·미선택 칩 |
| `--muted-foreground` | `#65636E` | mauve-11 | 캡션·날짜·step. ~5:1 |
| `--secondary-foreground` | `#211E28` | mauve-12 | |
| `--border` | `#D8D3E0` | mauve-7 | 카드·구분선·미선택 토글 |
| `--input` | `#C4BDD2` | mauve-8 | 입력창 테두리 (누를 수 있게 진하게) |
| `--success` / `-foreground` | `#30A46C` / `#FFF` | green-9 | 정답 — 토글·배지·완료 체크 |
| `--warning` / `-foreground` | `#FFC53D` / `#4F3422` | amber-9 / -12 | 보류 |
| `--destructive` / `-foreground` | `#D1343D` / `#FFF` | red-9 근사(L↓) | 오답·삭제. red-9(`#E5484D`)는 흰 텍스트와 3.91:1로 WCAG AA 미달(#66) — 같은 hue·chroma에서 L만 낮춰 4.93:1 확보 |
| `--brand-wordmark-from/to` | `#8FB5FB` / `#A193FA` | — | "Codit" 워드마크 그라데이션 (`@utility brand-wordmark`) |

**SWEA 공존**: `--primary` hue ~240° — SWEA 파랑(`#4590E3` ~211°) 회피 밴드 밖(경계). 상세 [`host-audit-swea.md`](./host-audit-swea.md).

### 스케일

| 종류 | 값 | 근거 |
|------|-----|------|
| radius | `--radius: 0.625rem`(10) + sm6/md8/lg10/xl14 · pill `rounded-full` | shadcn new-york |
| 간격 | Tailwind 스페이싱 스케일 (4px 베이스, `.5` 하프스텝 허용). `gap` 우선. **위젯 프레임**(`PanelShell`): 헤더·푸터 `px-4 py-3.5`(16/14) · 본문 `px-4 py-5`(16/20) — roomy 밀도 (R0 스파이크 결정) | Tailwind |
| 타이포 | 시스템 스택(웹폰트 X) · 본문 14px · **한글 line-height 1.6** · size xs12/sm13/base14/lg16/xl20/2xl24/4xl36(타이머) · weight 400/500/600/700 | Tailwind + Apple HIG |
| elevation | `@theme` `--shadow-2xs~xl`. **위젯 프레임 = `shadow-lg`** (primary 틴트 — "Codit 패널" 각인, SWEA 분리) | Material 3 |
| motion | `--ease-out`/`--ease-in-out`, `--duration-fast120/base200/slow300`. **idle 위젯 무애니.** `prefers-reduced-motion` 전역 0 | Material 3 |
| z-index | `--z-widget 999999`(mount.tsx JS와 동기) / `--z-overlay` / `--z-toast` | — |
| 위젯 프레임 폭 | `320px` 고정 · collapsed pill `h-10`(40) | timer / timer-persistence |
| Extension Page max-width | auth ≈ 400px / history ≈ 720px (구현 시) | auth / problem-history |

### 컴포넌트 사용 규칙 (variant → 역할)

| 역할 | 컴포넌트 / variant | 규칙 |
|------|------|------|
| 주요 진행 액션 (완료·다음·저장) | `Button` `default` | **화면당 1개.** 하단, 위젯 full-width |
| 뒤로·취소 | `Button` `outline` | **테두리 유지.** primary 옆이면 왼쪽 |
| 보조 액션 (드묾) | `Button` `secondary` | |
| 파괴적 | `Button` `destructive` | 확인 다이얼로그 동반 |
| 인라인 텍스트 링크 | `Button` `link` | 문장 안에서만 |
| 결과 선택/표시 | `ResultToggleGroup` / `ResultBadge` | 정답 success / 오답 destructive / 보류 warning, 채운 배경 |
| 결과 필터 탭 | `ResultFilterToggleGroup` | **중립색** segmented — 의미색은 배지에만 |
| 태그 | `TagToggleGroup`(미선택 secondary / 선택 primary) · `TagChipList`(secondary) | |
| 화면 프레임 | `PanelShell`(위젯) / `ExtensionPageShell`(페이지) | |

**Do / Don't**: 화면당 primary 1개 · 의미색은 결과에만(필터·중립 배지 X) · idle 위젯 저채도(primary는 버튼·링크·마크에만, 큰 표면 X) · 클릭 타깃 ≥ 36px(pill 40).

### 예외 사항

> 규칙과 충돌하지만 개발자가 명시적으로 확정한 화면 한정 예외. 일반화 금지.

| 화면 | 이슈 | 예외 | 근거 |
|------|------|------|------|
| 태그 선택 | #74 | "추가"·"저장" `default` 버튼 2개 공존 ("화면당 primary 1개" 위반) | "추가"는 화면 진행이 아니라 직접 입력 확정 액션 — 성격이 달라 예외 확정 |

---

## feature별 인벤토리

> `fe-ui-design` 스킬 소유. Feature마다 새 컴포넌트/EXTEND/CUSTOM 행을 추가한다. `## 기초`는 건드리지 않는다.

### 사용 중인 컴포넌트

| 컴포넌트 | 출처 | 분류 | 커스터마이징 | 첫 사용 Feature |
|---------|------|------|------------|----------------|
| Button | shadcn/ui | USE | 없음 | timer |
| Card | shadcn/ui | USE / EXTEND(`PanelShell`) | 헤더에 스텝 인디케이터 슬롯 | timer |
| Textarea | shadcn/ui | USE | 없음 | timer |
| Label | shadcn/ui | USE | 없음 | timer |
| Input | shadcn/ui | USE | 없음 (태그 직접 입력) | timer |
| Toggle Group | shadcn/ui (Radix) | EXTEND | `ResultToggleGroup`(single·의미색), `TagToggleGroup`(multiple·chip) | timer |
| Collapsible | shadcn/ui (Radix) | USE / EXTEND(`TagFilterPanel`) | 태그 "더보기", 정답 "메모 추가하기" / 태그 필터 패널 | timer |
| Badge | shadcn/ui | USE (선택) / EXTEND(`ResultBadge`) | 결과 표시 / 태그 chip | timer |
| Alert | shadcn/ui | USE (`FormAlert`) | 로그인·회원가입 서버 에러, SignUp 성공 안내. npm 추가 없음 (cva/tailwind 단일 파일, Radix 의존 없음) | auth |
| Skeleton | shadcn/ui | USE (`ListSkeleton`, `DetailSkeleton`) | Problem List / Detail mock 로딩 표현. npm 추가 없음 | problem-history |
| Toggle Group | shadcn/ui (Radix) | EXTEND (`ResultFilterToggleGroup`) | 전체/정답/오답/보류 단일 선택 필터 | problem-history |
| Card | shadcn/ui | EXTEND (`AuthCard`, `ProblemCard`) | Auth 카드 프레임 / 클릭 가능 문제 카드 | auth / problem-history |

---

### EXTEND 패턴

| 이름 | 기반 | 확장 내용 |
|------|------|----------|
| `PanelShell` | Card | 헤더(제목 + 스텝 인디케이터) 고정 레이아웃. 각 화면의 공통 프레임 (Floating Widget 전용) |
| `ResultToggleGroup` | Toggle Group (single) | 정답/오답/보류 3항목. 의미 토큰(`--success`/`--destructive`/`--warning`) 스타일 |
| `TagToggleGroup` | Toggle Group (multiple) | chip 형태 렌더. 핵심 태그 + 더보기 태그 + 직접입력 태그를 하나의 선택 집합으로 관리 |
| `AuthCard` | Card | Extension Page용 인증 카드. 브랜드 슬롯 + 폼 슬롯 + 하단 링크 슬롯 고정 레이아웃 |
| `ProblemCard` | Card | 클릭 가능 문제 카드. problemId + `ResultBadge` + 제목(조건부) + 메타 라인 + 태그 chip 슬롯 |
| `ResultBadge` | Badge | `CORRECT`/`WRONG`/`HOLD` → 의미 토큰 + 한글 라벨 매핑. Problem List / Detail / Attempt 공유 (Codit 공용 조합 승격) |
| `ResultFilterToggleGroup` | Toggle Group (single) | 전체/정답/오답/보류 4항목 세그먼트 필터. 탭은 중립 색, 의미색은 `ResultBadge`에만 |
| `TagFilterPanel` | Collapsible + `TagToggleGroup` | 태그 다중 선택 필터. `TagPicker`에서 직접입력 제거한 버전 |
| `FormAlert` | Alert | 폼 레벨 서버 에러 / 성공 안내 배너. `role="alert"` |

---

### CUSTOM 컴포넌트

| 이름 | 근거 |
|------|------|
| `CoditWidget` | Shadow host 래퍼 / 위젯 프레임 (Floating Widget Surface) |
| `TimerDisplay` | `tabular-nums` 대형 `mm:ss` 표시. 대응 primitive 없음 |
| `ExtensionPageShell` | Extension Page Surface 프레임 (배경 / 중앙 정렬 컨테이너 / 헤더 슬롯). Auth·Problem History 공유 |
| `PageHeader` | Extension Page 상단 바 (브랜드 + 현재 사용자(mock) + 로그아웃 자리). 대응 primitive 없음 |
| `BrandHeader` | Codit 로고 마크(인라인 SVG) + 서비스명 + 문구. lucide 미도입 원칙에 따라 인라인 SVG |
| `AttemptTimeline` | Attempt 회차 내림차순 나열 컨테이너 |
| `AttemptItem` | 회차 / 결과 / 풀이 시간 / 태그 / 메모 / 날짜 표시. 구분선은 `border-t` 유틸. 대응 primitive 없음 |
| `EmptyState` | empty / filtered-empty / 방어 3변형. 문구 + 선택적 액션 버튼 |
| `CollapsedTimer` | Floating Widget 접힌 상태. Codit 아이콘 + `mm:ss`(`tabular-nums`) + 상시 펼치기 chevron(chevron-up) + stopped 시 인라인 check 아이콘. pill 전체가 펼치기 버튼 — accessible name 은 name-from-contents(sr-only 동작 문구 + 보이는 시간), 장식 아이콘 전부 `aria-hidden`, `aria-live` 미사용. Button 베이스(`h-10`) + 인라인 SVG. 첫 사용 Feature: timer-persistence |

---

### 컴포넌트 패턴

- Floating Widget의 모든 화면은 `PanelShell`을 최상위 프레임으로 사용한다.
- Extension Page의 모든 화면은 `ExtensionPageShell`을 최상위 프레임으로 사용한다.
- 화면 전환은 Surface 상위의 단일 상태로 관리한다. Floating Widget = `screen`, Extension Page = `view` (`login | signup | list | detail`). Router 라이브러리를 도입하지 않는다.
- 결과값(정답/오답/보류)에 따른 분기는 화면 내부 조건부 렌더링(UI State)으로 표현한다.
- 조건부 데이터(문제 제목, 풀이 날짜, 메모, 태그 등)는 있을 때만 렌더하고 없으면 해당 영역을 생략한다. 필수 데이터로 가정하지 않는다.
- **Floating Widget 표현 상태**: `WidgetViewState = expanded | collapsed` 는 `screen`(화면 전환)과 **별개**의 단일 상태로 Surface 상위(`App`)가 소유한다. 기본값 `expanded`. 접기/펼치기는 순수 view toggle — `useTimer`·`screen`·입력값·persistence 를 바꾸지 않는다. `App` 과 `App` 이 소유한 state 는 collapse 중에도 유지되나, expanded UI subtree 는 조건부 렌더링으로 unmount 될 수 있으므로 **보존이 필요한 workflow state 는 `App`(또는 상위)이 소유**한다. (timer-persistence, `prd.md` ADR-5)
- `PanelShell` 은 선택적 접기 컨트롤 슬롯을 받는다(주입 시 헤더 최우측 아이콘 버튼, `aria-label`; 미주입 시 미렌더 → 기존 사용처 영향 없음). (timer-persistence)
- Floating Widget 내 아이콘(Codit 마크 / chevron / check 등)은 인라인 SVG 로 둔다 — lucide 미도입 원칙(`BrandHeader`, `SaveSuccessScreen` 과 동일).
