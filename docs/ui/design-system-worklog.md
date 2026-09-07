# Design System — 기획 진행 상황 (Worklog)

> **목적**: 이 문서 하나로 다른 PC에서 작업을 이어받는다.
> 다음 세션 시작 시: "docs/ui/design-system-worklog.md 읽고 이어서 진행" 이라고 하면 된다.
>
> 상태: **스킬 골격 작성 완료.** `.claude/skills/design-system/SKILL.md` 존재.
> 이 문서(§2 SWEA / §3 로고 / §6 열린 결정)는 `/design-system` 실행 시 Phase 0~2 입력으로 쓴다.
> Phase 5에서 durable 내용을 `design-system.md ## 기초`로 흡수한 뒤 **삭제 예정**.
> `develop` 기준 브랜치 `feat/디자인시스템-기획`.
> 최종 갱신: 2026-09-07
>
> **아래 §5·§7은 SKILL.md로 대체됨** — 최신 파이프라인·수정사항은 `SKILL.md`와
> memory `design-system-skill-plan` 참조. 실행 순서: STEP 1(스킬 골격, 완료) →
> STEP 2 PR-A(FE 구조 정규화) → STEP 3 하네스 → STEP 4 `/design-system`.

---

## 0. 한 줄 목표

Codit 익스텐션 UI를 **싹 리스킨**한다. 그 작업을 **`design-system` 스킬**로 만들어서 진행한다.
현재 UI는 전부 shadcn `neutral` 기본값(무채색) + mock. Codit만의 색·타이포·간격이 설계된 적 없음.

---

## 1. 확정된 사실 (재논의 불필요)

### 1-1. 컴포넌트 라이브러리 → **바꾸지 않는다**
- 현재: **shadcn/ui (복사형, 레포 소유) + Radix UI + cva + Tailwind v4 + React 19**
- 크롬 확장 = Shadow DOM. MUI/Ant/Chakra 등은 `document.head`/`document.body`에 주입해서 **Shadow DOM에서 깨짐**. 사실상 사용 불가.
- 확장에 맞는 방식 = "헤드리스 행동(Radix) + 내가 만든 스킨" = 지금 구조 그대로.
- "싹 고치기" = 토큰(50%) + 컴포넌트 Tailwind 클래스(30%) + 레이아웃(20%). **라이브러리 교체 아님.**
- 특정 라이브러리 룩이 좋으면 → 레퍼런스로만 삼고 Radix 위에 재현.

### 1-2. 아키텍처 제약 (`docs/ui/ui-architecture.md`가 이미 잠금)
- OKLCH 색공간, `.dark`는 라이브러리 호환용 선언만 (v1 고정 라이트 — 단 아래 열린 결정 참고)
- 토큰은 `:host`(위젯) / `:root`(Extension Page) 이중 스코프. `:root`-only 금지.
- 아이콘 = 인라인 SVG. lucide 미도입. (단 `components.json`엔 `iconLibrary: lucide`로 잘못 남아있음 → 정리 대상)
- 2 Surface: Floating Widget(320px, Shadow DOM) / Extension Page(자체 문서, 중앙정렬)
- 새 npm 의존성(interactive primitive) 추가 금지

### 1-3. 위젯이 실제로 뜨는 곳 = **`solvingProblem.do` 하나**
- content script `matches`는 SWEA 전역이지만 `mountCoditWidget()`은 문제 식별 성공 시에만 마운트
- 로그인/메인/문제목록 페이지 = **디자인 대상 아님**
- `solvingProblem.do`는 URL에 `contestProbId` 없음 → hidden input에만 있음 (이미 `resolveProblemId` DOM fallback 구현됨, 이슈 #17)

---

## 2. SWEA 호스트 사이트 감사 결과

브라우저로 실제 캡처·픽셀 샘플링함. 상세: `docs/ui/host-audit-swea.md`. 요약:

| 역할 | 값 | 비고 |
|------|-----|------|
| 페이지·에디터·사이드바 배경 | `#FFFFFF`, `#F6F6F6`, `#F9F9F9` | **전부 라이트** |
| 섹션 헤더 띠 (문제 풀이/TEST) | `#E3EDF5` | 옅은 블루그레이 |
| 보더 | `#DEE0E3` ~ `#B5B5B5` | 옅은 회색 |
| **SWEA 액센트 파랑** | **`#4590E3`** (hue ≈ 212°) | 제출버튼·링크·섹션띠. **Codit primary 회피 기준** |
| "Pass" 결과 표시 | `#2599E0` | 밝은 시안블루 (SWEA는 이 페이지선 성공=파랑) |
| 본문 텍스트 | `#292B2C` | 약간 따뜻한 near-black |
| 코드 에디터 (CodeMirror) | **라이트 테마**, `#FFFFFF` bg, 키워드/문자열 = **보라 계열** | |
| 난이도 배지 (문제목록에만) | 노랑 `#FFE161` / 초록 `#6BCB77` / 파랑 `#4D96FF` / 빨강 `#FF6B6B` | 위젯 뜨는 페이지엔 거의 안 보임 → 충돌 우선순위 낮음 |

### 공존 규칙 (스킬 `[확정]`에 박을 것)
1. **Codit primary hue ∉ [190°, 235°]** — SWEA 파랑 회피
2. 위젯은 `#FFFFFF` 위에 뜸 → 표면 분리를 그림자+보더로 강제(라이트) 또는 다크로 최대 대비. 에디터가 라이트라 **다크 위젯이 안 묻힘 (검증됨)**
3. 에디터 syntax가 보라 → Codit primary를 순보라(~290°)로 하면 살짝 rhyme → **인디고(~255~265°) 권장**
4. 타이머 도중 = 코드 집중 시간 → idle 위젯 저채도·무애니메이션·여백 넉넉히
5. semantic 초록/빨강은 채운 pill로 SWEA 파스텔 배지와 구분 (우선순위 낮음)

---

## 3. 로고 분석

원본 파일: `docs/ui/brand/codit-logo-icon.png` (아이콘), `docs/ui/brand/codit-logo-lockup.png` (아이콘+워드마크)
**둘 다 ChatGPT 생성 래스터.** 3D 베벨·그라데이션·AI 노이즈 → **그대로 사용 불가.** 색·컨셉 레퍼런스로만.

| 요소 | 픽셀 샘플 (근사) |
|------|----------------|
| 아이콘 배경 그라데이션 | `#A5BEFA` (페리윙클) → `#C5BBFA` (라벤더) |
| 워드마크 그라데이션 | `#8FB5FB` (파랑, hue~218°) → `#A193FA` (바이올렛, hue~250°) |
| 그린 체크 | `#A7F8CE` (파스텔 민트) |
| "C" | 흰색, 기하학적(라운드 옥타곤), 오른쪽 열림, 체크가 입구에 겹침 |

**중요**: 로고의 파랑 끝은 SWEA 파랑과 같은 hue 계열(약간 밝고 덜 채도). → **`--primary`는 로고의 바이올렛 끝**을 쓰면 로고에 충실 + SWEA와 최대 분리.
컨셉 "C + 그린 체크" = "기록/완료"를 브랜드에 박은 것. 톤은 **부드럽고 파스텔·그라데이션 중심** (하드한 개발자툴 아님).
→ 절충: 브랜드 아이덴티티(로고/워드마크/빈 화면)는 친근하게, 작업 UI(타이머 도는 중)는 차분·저산만.

---

## 4. 제안 팔레트 (초안 — 미확정, 눈으로 검토함)

시각 비교 페이지: `docs/ui/_worklog-assets/design-direction-draft.html` (브라우저로 열기) / 스크린샷 `.png`

| 토큰 | 값(초안) | 근거 |
|------|---------|------|
| `--primary` | `#6C5CE7` (인디고-바이올렛 ~255°) | 로고 바이올렛 + SWEA 회피 |
| `--primary-hover` | `#5B4BD6` | |
| `--primary-subtle` | `#EEEBFC` | |
| `--success` | `#12B981` | 로고 민트 rhyme, semantic용 채도↑ |
| `--warning` | `#E8992F` (앰버) | SWEA 노랑(`#FFE161`)과 구분되게 딥하게 |
| `--destructive` | `#E5484D` | SWEA 파스텔 빨강보다 채도↑ |
| neutral 램프 | `#F8F8FB` / `#EEF0F5` / `#D9DCE5` / `#9AA0B4` / `#3A3F52` / `#1E2030` | 살짝 쿨(바이올렛 틴트) |
| 다크 위젯 표면 | `#1E2030` / border `#2F3247` | |

아직 스케일 미정: typography(size/lh/weight), spacing 베이스(4/8px), radius 스케일, elevation(shadow), z-index, motion.

---

## 5. `design-system` 스킬 스펙 (합의된 초안)

| 항목 | 값 |
|------|-----|
| 이름 | `design-system` |
| 모드 | `/design-system` (수립/개편) · `/design-system audit` (drift 점검: tokens.css ↔ design-system.md ↔ components.json ↔ 실제 grep 사용처) |
| 경계 | `fe-ui-design`은 feature별 컴포넌트 인벤토리 담당. 새 스킬은 **기초 레이어**(토큰 값·팔레트·스케일·원칙 + 갤러리). `design-system.md`를 `## 기초`(새 스킬) / `## feature별 인벤토리`(fe-ui-design) 두 섹션으로 분리 |
| 코드 작성 | `tokens.css` + 갤러리는 생성. 화면 리스킨은 **체크리스트만** 내고 실제 작업은 개발자/`tdd` |

### 파이프라인
```
0. 컨텍스트 수집: ui-architecture 제약 / 현 tokens.css / design-system.md 인벤토리 보존 /
   package.json·components.json / 로고 / SWEA 팔레트 카드(아래 [확정]) / 기존 화면 스크린샷(before)
1. 방향 입력 → [BLOCKED] 한 번만: 브랜드 색조(로고에서 추출됨), 재디자인 깊이(스킨만/레이아웃까지), 스케일 취향
2. 토큰 세트 제안 → [확정]/[결정 포인트], 각 항목에 "이 값이면 이렇게 보임" 미리보기
3. [GATE] 개발자 승인
4. 산출물: tokens.css / design-system.md ## 기초 / 갤러리(부품 카탈로그 + SWEA 오버레이 목업) /
   components.json 불일치 수정 / 리스킨 체크리스트
5. 검증 [GATE]: pnpm typecheck·lint·test·build 통과 + browser-automation 스크린샷
   결함만 차단(레이아웃 깨짐/텍스트 잘림/WCAG 대비 실패), 의도된 시각 변화는 개발자 눈 승인
```

### 스킬 `[확정]` 리소스 (SWEA 팔레트 카드)
```
host-bg #FFFFFF / #F6F6F6      host-section-band #E3EDF5
host-border #DEE0E3~#B5B5B5    host-accent #4590E3 (hue~212°)
host-result-pass #2599E0       host-text #292B2C
host-editor 라이트, syntax=보라
공존규칙: primary hue ∉ [190,235] / 표면 분리 강제 / idle 저채도·무애니 / semantic 채운 pill
```

### 갤러리 = WXT page entrypoint (`entrypoints/gallery/`) 권장 — 실제 Shadow DOM/토큰 조건으로 렌더

### 가드레일 (스킬이 거부)
새 npm/아이콘 라이브러리 · `:root`-only · 다크 실제구현(열린결정 전) · Radix 행동 수정 · 인벤토리 삭제 · 테스트 수정(스냅샷 제외) · SWEA 파랑과 동일 hue · 고채도 idle 위젯

---

## 6. 열린 결정 (다음 세션에서 개발자가 정할 것)

1. **위젯 표면: 라이트 플로팅 카드 vs 다크 패널.** ← 가장 큰 결정.
   - 다크가 SWEA 흰 배경에서 확실히 분리 + 코드 집중에 유리 (에디터 라이트라 안 묻힘 검증됨)
   - 라이트가 로고의 부드러운 톤에 더 맞음
   - 시각 비교: `design-direction-draft` 참고
2. **v1 다크모드 지원 여부** (지금 문서는 "고정 라이트"). 위젯을 다크로 하면 이 결정과 얽힘.
3. **재디자인 깊이**: 스킨만(2~3일) vs 레이아웃까지(화면별 `fe-ui-design` 재실행 필요)
4. **`--primary` 최종값**: `#6C5CE7` 계열 확정 or 조정
5. **타이포 스케일 / 간격 베이스(4 vs 8px) / radius·elevation·motion 스케일**
6. C 마크 SVG: A(라운드 stroke) / B(기하학 채움) 중 택1 후 다듬기. 워드마크는 그라데이션 텍스트로.

---

## 7. 다음 단계 (순서)

1. 위 열린 결정 1~3 확정 (개발자)
2. `design-system` `SKILL.md` 초안 작성 → `.claude/skills/design-system/SKILL.md`
3. Phase 0: 기존 화면 before 스크린샷 (`pnpm dev:ext` → browser-automation)
4. Phase 1: `tokens.css` 재작성 (색 먼저)
5. Phase 2~3: primitive → 조합 → 화면 리스킨 (테스트 green 유지하며 하나씩)
6. Phase 4: 갤러리 + 시각 QA
7. Phase 5: 스킬로 절차 포장 + `design-system.md` 재구성

---

## 8. 자산 위치

| 자산 | 경로 |
|------|------|
| 로고 원본 (아이콘) | `docs/ui/brand/codit-logo-icon.png` |
| 로고 원본 (락업) | `docs/ui/brand/codit-logo-lockup.png` |
| 방향 검토 페이지 (HTML) | `docs/ui/_worklog-assets/design-direction-draft.html` |
| 방향 검토 스크린샷 | `docs/ui/_worklog-assets/design-direction-draft.png` |
| SWEA 문제목록 스크린샷 | `docs/ui/_worklog-assets/swea-problemlist.png` |
| SWEA 상세 감사 | `docs/ui/host-audit-swea.md` |
| 현재 토큰 | `apps/extension/styles/tokens.css` (색+radius만 있음) |
| 현재 DS 문서 | `docs/ui/design-system.md` (feature별 결정 로그) |
| 아키텍처 규칙 | `docs/ui/ui-architecture.md` |
| 현재 로고 placeholder | `apps/extension/components/codit/brand-header.tsx` (마름모 `<path>`) |

---

## 9. 병행 컨텍스트 (이 세션에서 처리한 무관한 일)

- 이슈 #17, #37 수동 종료 (스택 머지로 자동 종료 누락됨)
- 로컬 `develop` = `origin/develop` (`da0b1b9`) 동기화
- 머지 완료 스택 브랜치 3개 원격 삭제 (`feat/타이머세션연속성` 등)
- PR #41(태그 API)에 태그 payload 정리 코멘트 작성 — `POST /api/attempts`는 `tagIds: number[]` FK 방식으로 통일 제안. 백엔드 답변 대기 중.
- "문제 식별 팝업(#6) → `POST /api/problems` 연동"이 FE가 지금 착수 가능한 유일한 API 연동 이슈 (백엔드 develop에 있음)
