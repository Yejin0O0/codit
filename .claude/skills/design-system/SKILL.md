---
name: design-system
description: >
  Codit 익스텐션 UI의 디자인 토큰 기초 레이어를 수립·개편하는 스킬.
  "/design-system", "/design-system audit", "/design-system verify",
  "디자인 시스템 수립", "토큰 재설계", "UI 리스킨", "팔레트 정하기",
  "디자인 시스템 점검", "토큰 drift 확인" 등의 요청에 반드시 이 스킬을 사용하세요.
  색·타이포·간격·radius·elevation·motion 토큰 값과 컴포넌트 스킨(Tailwind 클래스)·로고를
  결정하고, 승인된 토큰 문서를 바탕으로 컴포넌트를 직접 리스킨합니다.
  화면 레이아웃·컴포넌트 구조·동작 로직은 다루지 않습니다(그건 fe-ui-design + feature TDD).
---

# design-system

Codit 익스텐션 UI의 **기초 레이어**(디자인 토큰 값 + 컴포넌트 스킨 + 로고)를 정하고 코드에 반영한다.

이 스킬이 정하는 것: **"컴포넌트가 어떻게 보이는가"** — 색·타이포·간격·radius·elevation·motion 토큰 값, 프리미티브/EXTEND/CUSTOM의 Tailwind 클래스, 로고 마크.

이 스킬이 정하지 않는 것: **"어떤 컴포넌트가 있고 어떻게 배치되고 어떻게 동작하는가"** — 컴포넌트 구조·props·상태·와이어프레임·화면 전환·Radix 행동. 이건 `fe-ui-design` + 각 feature TDD 소관.

---

## 경계 — `fe-ui-design`과의 분담

| | `design-system` (이 스킬) | `fe-ui-design` |
|---|---|---|
| 담당 | 기초 레이어 — 토큰 값·스케일·원칙·SWEA 공존 규칙 + 갤러리 + 시각 QA 하네스 | feature별 — 와이어프레임·컴포넌트 트리·UI State |
| `docs/ui/design-system.md` | `## 기초` 섹션 (소유) | `## feature별 인벤토리` 섹션 (소유) |
| 코드 작성 | O — 토큰·컴포넌트 스킨·로고 SVG | X — 설계 문서만 |
| 실행 시점 | 리스킨/개편 시 | 새 feature TDD 사이클 진입 시 |

`fe-ui-design`은 `## 기초`를 **읽기 전용 입력**으로 참조하고, 새 토큰이 필요하면 값을 지어내지 않고 "이 토큰이 필요함"만 flag한다.

---

## 모드

| 명령 | 하는 일 | 코드 변경 |
|---|---|---|
| `/design-system` | 토큰 세트 수립/개편 → Phase 0~5 파이프라인 | O (Phase 4) |
| `/design-system audit` | drift 점검: `tokens.css` ↔ `design-system.md ## 기초` ↔ `components.json` ↔ grep 실사용 ↔ SWEA 재감사. 불일치 리포트 | X (승인 시 별도) |
| `/design-system verify` | 시각 QA 하네스만 실행(build → screenshot → 대비 단언) → 리포트 | X |

---

## 실행 전: 런타임 점검

```bash
# gh / pnpm 은 PATH 에 없을 수 있음 — memory: gh-cli-path 참조
git status                          # 클린해야 함
git branch --show-current           # feat/디자인시스템-기획 (develop tip 기준) 권장
pnpm --filter @codit/extension build   # 빌드 가능 확인
ls e2e/design-system.spec.ts apps/extension/entrypoints/gallery 2>/dev/null   # 하네스 존재 여부
```

하네스가 없으면 Phase 0에서 부트스트랩한다.

---

## 파이프라인 (`/design-system`)

```
Phase 0  컨텍스트 수집 + 하네스 부트스트랩         (자동)
Phase 1  [BLOCKED · 1회]  방향 결정                 ── 개발자 대기
Phase 2  토큰 세트 제안 ([확정]/[결정 포인트] + 미리보기)
Phase 3  [GATE]  토큰 세트 승인                     ── 개발자 대기
Phase 4  리스킨 리팩토링 (컴포넌트 단위 · 이 스킬이 직접 수행)
Phase 5  갤러리 완성 + design-system.md 재구성
Phase 6  [GATE]  back-half 위임 (@ac-verifier → /tdd-refactor → /security-review → /e2e-write → /create-pr)
```

`/tdd-loop`은 쓰지 않는다 — `test-scenarios`/`tdd-red`/`tdd-green`을 스킵할 수 없고, 리스킨은 test-first가 아니라 **spec-first**(승인된 토큰 문서가 구동)이기 때문. `api-contract`가 API 설계를 직접 하는 것과 같은 논리로, 이 스킬이 Phase 4를 직접 수행한 뒤 back-half 스킬만 순서대로 호출한다.

---

### Phase 0 — 컨텍스트 수집 + 하네스 부트스트랩 (자동, 게이트 없음)

**수집** (아래 "참조 문서" 표의 경로를 읽는다):

- 아키텍처 제약 — `docs/ui/ui-architecture.md`
- 현재 토큰 — `apps/extension/styles/tokens.css`
- 기존 인벤토리 (보존 대상) — `docs/ui/design-system.md`
- `package.json` · `apps/extension/components.json`
- 로고 원본·분석 — `docs/ui/brand/` + `docs/ui/design-system-worklog.md §3`
- SWEA 팔레트 + 공존 규칙 — `docs/ui/host-audit-swea.md`
- 하드코딩 색 커버리지 — `grep -rnE '#[0-9a-fA-F]{3,8}|rgb\(|hsl\(' apps/extension/{components,entrypoints,features} --include='*.tsx' --include='*.css'`

**부트스트랩** (하네스 없을 때만):

- `apps/extension/entrypoints/gallery/` — WXT page entrypoint. 현재 컴포넌트 그대로 나열(리스킨 전). dev 빌드에 `gallery.html`로 포함되며 manifest엔 링크 안 됨 (e2e가 빌드 산출물을 스크린샷하므로 빌드에 있어야 함)
- `e2e/design-system.spec.ts` — 갤러리·위젯 스크린샷 + canvas sRGB화 대비 단언 + `DS_REVIEW=1` walkthrough
- **before baseline**: `pnpm --filter @codit/extension build && pnpm test:e2e e2e/design-system.spec.ts` → 현재(shadcn neutral) 상태를 스냅샷으로 커밋

> 하네스가 이미 있으면 이 단계 스킵. `/design-system verify`로 baseline만 재생성.

---

### Phase 1 — 방향 결정 `[BLOCKED · 1회]`

**구조 결정만** 한 번에 묻는다 (색 값 아님). 여러 결정 포인트를 모아 한 번만 BLOCKED 처리한다.

```
🔴 BLOCKED — 방향 결정 필요

1. 위젯/페이지 표면 방향
   A. 다크 집중 패널   — 위젯만 다크, 최대 대비. 페이지는 라이트(Surface 명도 분리)
   B. 라이트 브랜드 카드 — 두 Surface 통일 라이트, elevation으로 분리, 로고 파스텔 계승
   C. 토큰 계층 우선     — 외형은 B, 단 공통 베이스 + Surface 오버라이드 2계층으로 구축해
                           위젯 다크 전환을 v2 오버라이드 교체만으로 가능하게
   제안: C  (Surface 오버라이드는 위젯 vs 페이지 elevation·밀도 차이로 지금도 필요)

2. 재디자인 깊이
   스킨만 (토큰 + Tailwind 클래스, 레이아웃 불변)  /  스킨 + 레이아웃 (화면별 fe-ui-design 재실행)
   제안: 스킨만 + 로고 신규

3. C 마크
   A. 라운드 stroke C + 민트 체크 (16px pill에서 유리, 부드러운 톤)
   B. 기하학 채움 C + 체크 (로고 근사, 작은 크기서 뭉갤 수 있음)
   제안: A

모든 항목에 답변 후 "계속"이라고 입력해주세요.
```

답변을 `docs/features/design-system/spec-fixed.md`에 기록한다.

---

### Phase 2 — 토큰 세트 제안

Phase 1 답변을 반영해 **전 토큰 값**을 제안한다. 순서:

```
color   (primary / 뉴트럴 램프 / 의미색 success·warning·destructive / background·card·border / ring)
  → typography  (font stack / size 스케일 / line-height / weight / letter-spacing)
  → spacing     (베이스 4 vs 8px + 스케일)
  → radius      (--radius + sm/md/lg/xl 파생)
  → elevation   (shadow 토큰 — 위젯↔SWEA 흰 배경 분리용)
  → motion      (duration / easing — idle 위젯 무애니 원칙)
  → z-index     (위젯 / 오버레이 / 토스트)
```

각 항목 표기:

- `[확정]` — 아키텍처·SWEA 제약에서 자동 도출 (예: `--primary` hue ∉ [190°, 235°] — SWEA 파랑 회피)
- `[결정 포인트]` — 개발자 취향/선택 (예: `--primary` 로고 바이올렛 255° vs 인디고 245°, 간격 4 vs 8)

**원칙**:

1. **semantic 토큰 이름 유지** — `--success` `--warning` `--destructive` `--primary` 등은 이미 존재. **값만 변경**한다. 이름·구조를 바꾸면 컴포넌트 톤-클래스 단언 테스트가 연쇄로 깨진다.
2. **미리보기 필수** — 각 후보값에 대해 `docs/ui/_worklog-assets/design-direction-draft.html`를 갱신하고, 갤러리에 후보 토큰을 적용한 스크린샷을 첨부한다. "이 값이면 이렇게 보임"을 눈으로 확인하게 한다.
3. **OKLCH 최종값 확정 전 대비 검증** — `--primary`/`--primary-foreground` 등 fg/bg 쌍이 WCAG AA(본문 4.5:1, 큰 텍스트·UI 3:1)를 통과하는지 `getComputedStyle` 기반으로 확인.

산출: `docs/features/design-system/prd.md` (사용자 스토리 = 리스킨 목표 / **ADR = 토큰 세트 결정들** / Out of Scope = 다크모드·레이아웃).

---

### Phase 3 — 토큰 세트 승인 `[GATE]`

전체 토큰 표 + 미리보기 스크린샷을 제시하고 개발자 승인을 기다린다. 부분 수정 요청 시 Phase 2의 해당 항목만 반복한다.

승인 후:

- `docs/features/design-system/issues.md` — 리스킨 체크리스트를 단위로 분해 (4a tokens 색 / 4b 스케일 / 4c popup / 4d 프리미티브 / 4e EXTEND·CUSTOM / 4f 로고)
- `docs/features/design-system/issue-{N}.md` — 시그니처(토큰명·스킨 계약) + 시나리오(대비 단언·클래스 단언·스크린샷 대상). 이 스킬이 직접 작성 (`test-scenarios` 안 씀)
- `docs/features/design-system/ui-design.md` — 최소. "이 리스킨은 레이아웃·컴포넌트 트리·UI State 변경 없음" + `design-system.md ## 기초` 링크
- GitHub 이슈 **1개** "디자인 시스템 v1 리스킨" 생성 — AC = 대비 AA 전부 통과 / 스크린샷이 승인된 방향과 일치 / typecheck·lint·test·build green / 레이아웃 불변

---

### Phase 4 — 리스킨 리팩토링 (이 스킬이 직접 수행)

`docs/features/design-system/prd.md`(승인된 토큰 세트) + `issues.md`(체크리스트)를 입력으로, 컴포넌트 단위로 리스킨한다.

**각 단위(4a~4f)마다 동일 루프**:

```
① 수정
② pnpm --filter @codit/extension build
③ pnpm test:e2e e2e/design-system.spec.ts        → 스크린샷 diff (로컬 자문) + 대비 단언 (CI 가드)
④ pnpm -r typecheck && pnpm --filter @codit/extension lint && pnpm --filter @codit/extension test
     └ Vitest 클래스/톤 단언이 깨지면 = 컴포넌트 계약 변경 → STOP, 개발자에게 보고
⑤ 개발자 눈 승인 (의도된 시각 변화 확인)
⑥ 스크린샷이 의도대로면 --update-snapshots
⑦ 커밋 (한 단위 = 한 커밋, prefix: refactor(ds):)
```

**단위**:

| 단위 | 대상 | 비고 |
|---|---|---|
| 4a | `styles/tokens.css` 색 재작성 | prd.md ADR의 OKLCH 값을 `:root`(→`:host`) + Surface 오버라이드로 배치. diff 큼 — 전면 색 변화 |
| 4b | `styles/tokens.css`에 스케일 추가 | 타이포·간격·radius·elevation·motion·z + `@theme` 매핑 + Surface `style.css` base |
| 4c | `entrypoints/popup/*.css` 정리 | WXT scaffold hex 제거. 실제 Codit 화면 아님 |
| 4d | shadcn 프리미티브 (`components/ui/*.tsx`) | 토큰값 넘어 형태 변경 결정한 경우만. 제자리 Edit |
| 4e | EXTEND/CUSTOM 조합 | `PanelShell`·`ResultToggleGroup`·`CoditWidget`·`CollapsedTimer` 등. 제자리 Edit |
| 4f | 로고 SVG 교체 | `brand-header.tsx`·`collapsed-timer.tsx` 인라인 `<path>`. Phase 1에서 고른 C 마크 |

**코드 변경 방식**: 기존 파일 **제자리 `Edit`**. 삭제+재생성 아님. rename은 `git mv`. 죽은 코드는 그 커밋 안에서 즉시 제거.

**구조 변경 감지 시 중단**: props 추가/제거, 상태 분해, 레이아웃 재배치가 필요해지면 스킨 범위 밖 → 중단하고 "이 화면은 `/fe-ui-design` 재실행 필요"로 개발자에게 넘긴다.

---

### Phase 5 — 갤러리 완성 + 문서 재구성

- `entrypoints/gallery/`를 리스킨된 전 컴포넌트 + 토큰 스와치로 완성
- `docs/ui/design-system.md`를 2섹션으로 재구성:
  - `## 기초` — 토큰 값·스케일·원칙·SWEA 공존 규칙 (이 스킬 소유). Phase 2~3 결정 반영
  - `## feature별 인벤토리` — 기존 컴포넌트 표 (fe-ui-design 소유). **기존 내용 100% 보존**, 헤더만 삽입. 스왑한 컴포넌트가 있으면 그 행만 사실 정정
- `docs/ui/design-system-worklog.md` — durable 내용(로고 분석 §3 등)을 `## 기초`로 흡수 후 **삭제**. `_worklog-assets/` 중 draft.html 외 임시물 정리
- `docs/handoff/frontend-handoff.md` 등에 남은 병행 컨텍스트가 worklog §9에 있으면 이관 확인

---

### Phase 6 — back-half 위임 `[GATE]`

```
@ac-verifier        리스킨 이슈 AC 독립 검증 (대비 AA / 스크린샷 일치 / 레이아웃 불변).
                    /design-system verify 결과를 입력으로 제공
/tdd-refactor       중복 토큰 제거, 스케일 네이밍 정리
/security-review    타입·보안 점검
/e2e-write          e2e/design-system.spec.ts 시나리오 확장 (하네스 골격 위에)
/create-pr          PR 생성. before/after 스크린샷 콘택트 시트 첨부.
                    인터랙션 있는 화면은 Playwright .webm (수동 드래그)
```

---

## `audit` 모드

`solvingProblem.do` 한 페이지 + 코드베이스를 대조한다:

1. **토큰 drift** — `tokens.css`에 선언됐지만 grep으로 사용처 없음 / 사용되지만 미선언 / `design-system.md ## 기초` 표와 값 불일치
2. **하드코딩 재발** — 컴포넌트/CSS에 hex·rgb·hsl 리터럴 (popup scaffold 제외)
3. **`components.json` 정합** — `iconLibrary` 설정 vs 실제 (lucide 미도입인데 `iconLibrary: lucide`로 남아있으면 flag)
4. **SWEA 재감사** — 실브라우저(로그인 상태) 캡처 → `host-audit-swea.md` 값 대조. SWEA 리뉴얼 시 `--primary` hue 회피 밴드 갱신

결과는 심각도별 리포트. 수정은 개발자 승인 하에 별도.

---

## `verify` 모드

```
pnpm --filter @codit/extension build
pnpm test:e2e e2e/design-system.spec.ts
```

- 스크린샷 diff (before/after 나란히) — **로컬 자문용**. headful Chrome이라 머신 의존 → CI 회귀 가드로 신뢰하지 않음. 초 단위로 바뀌는 타이머 숫자는 mask 처리됨
- canvas sRGB화 → WCAG 대비 단언 — **CI 가드**. 계산된 색상값은 결정적
- typecheck·lint·test·build 결과

**수동 검토가 필요할 때** (자동 스크린샷이 너무 빨라 페이지 전환을 못 볼 때):

```
DS_REVIEW=1 pnpm test:e2e e2e/design-system.spec.ts -g "수동 검토" --headed
```

갤러리 → 위젯 각 화면(타이머/결과선택/메모/태그/collapsed)에서 Playwright Inspector가
멈춘다. 눈으로 확인한 뒤 Resume. 갤러리는 정적 페이지라 `pnpm dev:ext` 후
`chrome-extension://{id}/gallery.html`을 직접 열어 스크롤하며 봐도 된다.

Phase 6의 `@ac-verifier` 입력, 또는 독립 실행.

---

## 하네스 (영구 산출물, 2파일)

| 파일 | 역할 |
|---|---|
| `apps/extension/entrypoints/gallery/` | 부품 카탈로그 — 토큰 스와치 + 대비 쌍 + radius + 프리미티브 + Codit 조합을 한 스크롤에. WXT page entrypoint(`:root` 스코프, Extension Page 계열). manifest 어디에도 링크 안 됨. dev 빌드에 `gallery.html`로 포함(~41KB) — 스토어 배포 시 제외 검토 |
| `e2e/design-system.spec.ts` (+ `-snapshots/`) | 갤러리 풀페이지 + 위젯 expanded(타이머)/collapsed(pill) 스크린샷(타이머 숫자 mask) + canvas 대비 단언 + `DS_REVIEW=1` 수동 walkthrough. `e2e/fixtures/extension.ts` 재사용 |

> `scripts/check-contrast.mjs` 같은 자작 OKLCH→sRGB 변환은 만들지 않는다 — 부정확 위험. 대비는 브라우저 canvas(`ctx.fillStyle`)로 임의 CSS 색을 sRGB 바이트화해 spec 안에서 계산한다.

> Extension Page auth/history는 현재 mock(`App.tsx` placeholder) → v1 검증은 **위젯 + 갤러리**만 의미 있음. 실화면 구현 시 자동으로 리스킨된 토큰 적용.

---

## 방향 A/B/C 참고 (Phase 1 결정용)

| | A 다크 집중 패널 | B 라이트 브랜드 카드 | C 토큰 계층 우선 (추천) |
|---|---|---|---|
| 위젯 배경 | `#1E2030` 계열 | `#FBFAFF` 계열 | 외형 = B |
| SWEA 분리 | 최대 대비 (에디터 라이트라 안 묻힘, 검증됨) | 강한 그림자 + 보더 | B와 동일 |
| 로고 파스텔 톤 | 거리 있음 | 충실 | 충실 |
| 다크모드 v2 | 위젯 자체가 다크 테마 | 미지원 | 공통 베이스 + Surface 오버라이드 → v2에 오버라이드 값만 교체 |
| Surface 통일 | 위젯↔페이지 명도 불일치 | 완전 통일 | 베이스 통일 + 의도된 오버라이드 |

`--primary` 후보: `#6C5CE7` (hue ~255°, 로고 바이올렛 끝, SWEA 회피 밴드 [190°, 235°] 밖, 에디터 보라 syntax ~290°와도 이격). Phase 2에서 다른 토큰과 함께 미리보기 후 확정.

---

## 제약 (스킬이 거부)

- **새 npm 의존성 / 아이콘 라이브러리(lucide 등) 도입** — 인라인 SVG only
- **`:root`-only 토큰 선언** — `:host`(위젯) 스코프 누락 금지
- **v2 결정 전 다크모드 실제 구현** — 방향 C의 오버라이드 레이어 "준비"는 허용, "활성화"는 불가
- **Radix/shadcn 프리미티브의 행동(동작 로직) 수정** — 스킨만
- **`design-system.md ## feature별 인벤토리` 삭제/재설계** — 헤더 삽입 + 스왑 행 정정만
- **테스트 파일 수정** — 스크린샷 스냅샷 `--update-snapshots`만 예외. 톤-클래스 단언이 깨지면 STOP·보고
- **`--primary` hue ∈ [190°, 235°]** — SWEA 파랑과 동일 계열
- **고채도 idle 위젯** — 강한 색은 상호작용 요소(버튼·결과 선택)에만
- **레이아웃 변경** — 재디자인 깊이 = 스킨인 경우. 필요하면 중단하고 `/fe-ui-design` 재실행으로 넘김
- **한 커밋에 여러 Phase 4 단위 섞기**
- **`/tdd-loop` 호출** — back-half 스킬을 직접 순서대로 호출한다
- **semantic 토큰 이름 변경** — 값만 변경

---

## 참조 문서 / 탐색 경로

| 용도 | 경로 |
|---|---|
| 아키텍처 제약 (OKLCH / `:host`·`:root` / 인라인 SVG / 2 Surface / v1 고정 라이트) | `docs/ui/ui-architecture.md` |
| SWEA 팔레트 + 공존 규칙 + hue 회피 밴드 | `docs/ui/host-audit-swea.md` |
| 로고 분석 + C 마크 A·B안 | `docs/ui/design-system-worklog.md §3` (Phase 5에서 `design-system.md ## 기초`로 이전) |
| 현재 토큰 SoT | `apps/extension/styles/tokens.css` |
| Surface 전용 스타일 | `apps/extension/entrypoints/content/style.css` · `entrypoints/page/style.css` |
| shadcn 설정 | `apps/extension/components.json` |
| 프리미티브 | `apps/extension/components/ui/` |
| 공용 조합 (EXTEND/CUSTOM) | `apps/extension/components/codit/` |
| 위젯 화면 | `apps/extension/entrypoints/content/screens/` · `entrypoints/content/components/` |
| E2E fixture (재사용) | `e2e/fixtures/extension.ts` |

> **PR-A(FE 구조 정규화, `src/` 해체 → `features/`) 이후** 위 `entrypoints/content/**` · `src/**` 경로는 `features/{name}/`로 바뀐다. 이 표를 그때 갱신한다.

---

## 결과 보고

```
design-system {mode} 완료

산출물
  docs/features/design-system/{생성된 문서 목록}
  apps/extension/styles/tokens.css ({N}개 토큰)
  apps/extension/entrypoints/gallery/ ({N}개 컴포넌트)
  e2e/design-system.spec.ts
  docs/ui/design-system.md (## 기초 재구성)

방향: {A/B/C}
토큰: color {N} / type {N} / space {N} / radius {N} / elevation {N} / motion {N}
대비: AA {통과/실패} — {실패 쌍 있으면 명시}
리스킨 커밋: {N}개 (4a~4f)

다음 단계: {Phase 6 back-half 또는 개발자 액션}
```
