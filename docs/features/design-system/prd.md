# 디자인 시스템 v1 — PRD (토큰 세트 + 사용 규칙)

> `/design-system` Phase 2~3 산출. ADR = 토큰 세트 결정. Phase 3 승인 후 `issues.md` + GitHub 이슈로 이어짐.
> 근거 표기: 각 스케일이 어느 디자인 시스템에서 왔는지 명시 (memory: feedback-ground-in-design-systems).

## 목표

shadcn `neutral` 무채색 + mock → Codit 브랜드 팔레트 + 검증된 스케일. 화면 간 톤 통일.
Q1=C(통일 라이트 + Surface 오버라이드 2계층) · Q2=B(레이아웃은 화면별 후속) · Q3=A(stroke C).

## Out of Scope

- 다크모드 실제 구현 (v2 — 오버라이드 레이어만 준비)
- 화면 레이아웃·구성 재설계 (화면별 `/fe-ui-design` → TDD)
- 컴포넌트 내부(props·cva 구조)

---

## ADR-1. 색 토큰 — Radix Colors 기반 [확정 · 개발자 승인 2026-09-07]

**근거**: Radix Colors 12-step 스케일. `violet`(브랜드) + `mauve`(바이올렛 틴트 뉴트럴, Radix가 violet에 페어링 권장) + `green`/`amber`/`red`(의미). step 선택은 Radix 관례(9=solid, 11=보조 텍스트, 12=제목). 전 fg/bg 쌍 WCAG 2.2 AA 통과(측정).

| 토큰 | 값 | Radix | 대비 |
|---|---|---|---|
| `--primary` | `#6E56CF` | violet-9 | 흰 텍스트 5.4:1 |
| `--primary-foreground` | `#FFFFFF` | | |
| `--ring` | `#A594F9` | violet-a8 계열 | 포커스 링 |
| `--accent` | `#F1EEFE` | violet-3 | hover 배경 |
| `--accent-foreground` | `#6550B9` | violet-11 | 5.4:1 on accent |
| `--background` | `#FDFCFE` | mauve-1 | |
| `--foreground` | `#1A1523` | mauve-12 | 17:1 on bg |
| `--card` `--popover` | `#FFFFFF` | | 순백 → 틴트 bg 위에서 뜸 |
| `--muted` `--secondary` | `#F4F2F7` | mauve-3 | |
| `--muted-foreground` | `#6F6D78` | mauve-11 | 4.6:1 on muted |
| `--secondary-foreground` | `#211E28` | mauve-12 계열 | 14.8:1 |
| `--border` | `#E3DFEA` | mauve-6 | |
| `--input` | `#D7D0E0` | mauve-7 | |
| `--success` | `#30A46C` | green-9 | 흰 3.2:1 (채운 UI) |
| `--success-foreground` | `#FFFFFF` | | |
| `--warning` | `#FFC53D` | amber-9 | |
| `--warning-foreground` | `#4F3422` | amber-12 | 7.2:1 |
| `--destructive` | `#E5484D` | red-9 | 흰 3.9:1 (채운 UI) |
| `--destructive-foreground` | `#FFFFFF` | | |

**Surface 오버라이드 (2계층)**: 위 값은 공통 베이스. 위젯(`:host`)은 SWEA 흰 배경 위에 뜨므로 `--background`를 mauve-2(`#FBFAFC`)로 살짝 더 틴트해 대비 확보 가능 — 4a에서 확정. Extension Page(`:root`)는 베이스 그대로.

**SWEA 공존**: `--primary` HSL hue ~253° — SWEA 파랑(`#4590E3`, ~211°) 회피 밴드 밖. 에디터 보라 syntax(~280°)와도 이격.

---

## ADR-2. 타이포그래피 [결정 포인트 — 제안]

**근거**: Tailwind type scale + Apple HIG(대형 헤딩 letter-spacing 타이트닝) + 한글 가독성.

- **폰트 스택**: 현행 시스템 스택 유지 — `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif`. **웹폰트 미도입** (확장·오프라인·Shadow DOM·의존성 0). shadcn도 시스템 스택 기본.
- **size 스케일** (Tailwind 기반):

  | 토큰 | px | 용도 |
  |---|---|---|
  | `text-xs` | 12 | 캡션·메타·step |
  | `text-sm` | 13 | 보조 |
  | `text-base` | 14 | **본문 기본** (위젯 `:host` 확정) |
  | `text-lg` | 16 | 화면 제목 |
  | `text-xl` | 20 | 강조 |
  | `text-2xl` | 24 | |
  | `text-4xl` | 36 | 위젯 타이머 `mm:ss` (`TimerDisplay`) |

- **line-height**: 본문 1.5 / **한글 문단 1.6** / 헤딩 1.3
- **weight**: 400 본문 · 500 라벨·버튼 · 600 헤딩·강조 · 700 타이머
- **letter-spacing**: 대형 헤딩·타이머 `-0.01em` (HIG) / 본문 0 / 대문자 라벨 `+0.06em`
- **`tabular-nums`**: 타이머, 목록 숫자 정렬

---

## ADR-3. 간격 [확정 — 레퍼런스 그대로]

**근거**: Tailwind spacing (4px 베이스). 새 토큰 안 만듦 — 유틸리티 그대로 쓰고 규칙만.

- 4px 베이스. 스텝: 4·6·8·12·16·20·24·32
- **`gap` 우선, per-element margin 지양** (ui-architecture "layout does the spacing")
- 위젯 프레임 안쪽 여백: `p-4`(16px) — 가독성 위해 현행 14px에서 상향 제안
- 화면 요소 간 세로 간격: `gap-3`(12px) 기본, 섹션 간 `gap-4`(16px)

---

## ADR-4. radius [확정]

**근거**: shadcn `new-york` 프리셋(`0.625rem`) + 로고 라운드 스퀘어의 부드러운 톤.

- `--radius: 0.625rem` (10px) — 유지
- 파생: `sm` = radius−4 (6) · `md` = radius−2 (8) · `lg` = radius (10) · `xl` = radius+4 (14)
- pill·완전 원형 = `999px` (collapsed pill, 태그 칩, 배지)

---

## ADR-5. elevation [결정 포인트 — 제안]

**근거**: Material 3 elevation 레벨. 위젯은 SWEA 흰 배경에서 확실히 떠야 함 → 브랜드 틴트 그림자.

| 토큰 | 값 | 용도 | M3 |
|---|---|---|---|
| `--shadow-sm` | `0 1px 2px 0 color-mix(in srgb, var(--foreground) 6%, transparent)` | 위젯 내부 카드 | level 1 |
| `--shadow-md` | `0 2px 8px -2px color-mix(in srgb, var(--foreground) 10%, transparent)` | 드롭다운·팝오버 | level 2 |
| `--shadow-lg` | `0 16px 40px -12px color-mix(in srgb, var(--primary) 28%, transparent), 0 4px 12px -2px color-mix(in srgb, var(--foreground) 10%, transparent)` | **위젯 프레임** — 바이올렛 틴트로 "Codit 패널"임을 각인, SWEA 흰 배경에서 분리 | level 3 |
| `--shadow-xl` | `0 24px 56px -16px color-mix(in srgb, var(--primary) 30%, transparent), 0 6px 18px -4px color-mix(in srgb, var(--foreground) 12%, transparent)` | 모달 | level 4 |

---

## ADR-6. motion [확정 — 레퍼런스 그대로]

**근거**: Material 3 easing/duration. + Codit 원칙 "idle 위젯 무애니".

- `--ease-out: cubic-bezier(0.2, 0, 0, 1)` (M3 standard) — 진입·확장
- `--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)` — 상태 전환
- `--duration-fast: 120ms` (hover·토글) · `--duration-base: 200ms` (접기/펼치기·화면 전환) · `--duration-slow: 300ms` (드묾)
- **idle 위젯 무애니**: 타이머 진행 중 ambient 애니메이션 금지. transition은 사용자 상호작용에만
- `@media (prefers-reduced-motion: reduce)` → 모든 transition·animation 0

---

## ADR-7. z-index [확정]

| 토큰 | 값 | 용도 |
|---|---|---|
| `--z-widget` | `999999` | SWEA 위 위젯 (현행 유지) |
| `--z-overlay` | `2147483000` | 위젯 내 팝오버·드롭다운 (Shadow DOM 내부지만 명시) |
| `--z-toast` | `2147483001` | 토스트 |

---

## ADR-8. 컴포넌트 사용 규칙 [결정 포인트 — 제안]

**근거**: GitHub Primer / Atlassian 형식 (variant→역할 표 + do/don't). 라이브러리(shadcn/Radix)는 고정, "어떤 역할에 무엇"만 디자인 시스템이 정한다.

| 역할 | 컴포넌트 / variant | 규칙 |
|---|---|---|
| 주요 진행 액션 (완료·다음·저장) | `Button` `default` (bg-primary) | **화면당 1개.** 하단, 위젯은 full-width |
| 뒤로·취소 | `Button` `ghost` | primary와 나란히 두면 왼쪽. (현행 `outline` → `ghost`로 변경 제안 — 위계 낮춤) |
| 보조 액션 (드묾) | `Button` `outline` | |
| 파괴적 (기록 삭제) | `Button` `destructive` | 확인 다이얼로그 동반 |
| 인라인 텍스트 링크 (로그인↔회원가입) | `Button` `link` | 문장 안에서만 |
| 결과 선택 | `ResultToggleGroup` | 정답=`success` / 오답=`destructive` / 보류=`warning`, 채운 배경 |
| 결과 표시 | `ResultBadge` | 동일 의미색. Problem List/Detail/Attempt 공유 |
| 결과 필터 탭 | `ResultFilterToggleGroup` | **중립색** segmented. 의미색은 배지에만 |
| 태그 선택 | `TagToggleGroup` chip | 미선택 `secondary` / 선택 `primary` |
| 태그 표시 | `TagChipList` | `secondary`, 비상호작용 |
| 로딩 | `Skeleton` | `--muted` |
| 폼 레벨 알림 | `FormAlert` | `role="alert"` |
| 화면 프레임 | `PanelShell`(위젯) / `ExtensionPageShell`(페이지) | 최상위 고정 |

**Do / Don't**
- ✅ 화면 하단 primary 버튼 1개 · ❌ 한 화면 primary 2개
- ✅ 의미색은 결과에만 · ❌ 필터 탭·중립 배지에 의미색
- ✅ idle 위젯 저채도 — primary는 버튼·링크·마크에만 · ❌ 위젯 배경·큰 표면에 primary 채우기
- ✅ 클릭 타깃 ≥ 36px (데스크톱 확장, HIG/M3의 44/48은 터치 기준이라 완화) · pill·아이콘 버튼 40px

---

## 검증 (Phase 4 · Phase 6)

- `e2e/design-system.spec.ts` 대비 단언 — 전 쌍 AA (텍스트 4.5 / 채운 UI 3.0)
- 갤러리·위젯 스크린샷 — 승인된 팔레트와 일치
- `pnpm typecheck·lint·test·build` green
- 레이아웃 불변 (이 스킬 범위 — 레이아웃 재설계는 후속 이슈)
