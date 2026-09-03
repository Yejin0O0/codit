# Design System

> Codit Chrome Extension UI 설계 기준.
> fe-ui-design 스킬이 Feature마다 업데이트한다.
> tdd-green-frontend는 이 문서를 읽어 구현 시 참조한다.
> 아키텍처 규칙은 [ui-architecture.md](./ui-architecture.md) 참조.

---

## UI Library

- **shadcn/ui** (복사형 — 라이브러리 의존이 아니라 레포가 소스를 소유한다)
  - style: `new-york`
  - base color: `neutral`
- **보조 프리미티브**: Base UI — Toggle 계열에서 shadcn/Radix가 제약될 경우의 후보

> dependency 절감 목적으로 공통 interactive primitive를 CUSTOM으로 재구현하지 않는다.

---

## 테마 정책

| 항목 | 결정 |
|------|------|
| 다크모드 | v1 미지원. 고정 라이트 테마. `.dark` variant는 라이브러리 호환용 선언만 |
| 테마 독립성 | 위젯은 호스트 페이지 테마와 무관하게 자체 테마를 확정 |
| 토큰 선언 위치 | Shadow Root 스코프 (문서 루트에만 존재하는 정의에 의존하지 않음) |

---

## 디자인 토큰

| 토큰 | 값 | 용도 | 첫 사용 Feature |
|------|-----|------|----------------|
| shadcn 표준 CSS 변수 | `neutral` 팔레트 (OKLCH) | `background` `foreground` `primary` `muted` `border` `ring` `card` 등 | timer |
| `--success` | (라이트 팔레트 내 green 계열) | 결과 = 정답 | timer |
| `--warning` | (라이트 팔레트 내 amber 계열) | 결과 = 보류 | timer |
| `--destructive` | shadcn 표준 | 결과 = 오답 (재사용) | timer |
| `--radius` | `0.625rem` | 공통 radius | timer |
| 위젯 프레임 폭 | `320px` (고정) | 위젯 컨테이너 | timer |
| 폰트 | 시스템 스택 (`-apple-system, "Segoe UI", Roboto, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`) | 위젯 전체. 위젯이 `font-family`·`font-size` 자체 확정 | timer |
| 기본 폰트 크기 | `14px` | 위젯 전체 | timer |
| Extension Page 컨테이너 max-width (auth) | `≈ 400px` (구현 시 확정) | Auth 카드 중앙 정렬 컨테이너 | auth |
| Extension Page 컨테이너 max-width (history) | `≈ 720px` (구현 시 확정) | Problem List / Detail 중앙 정렬 컨테이너 | problem-history |
| 위젯 collapsed pill 크기 | 높이 ≈ 40px (`h-10`) — 읽고 누를 수 있는 크기, 초소형 금지 | `CollapsedTimer` — expanded 320px 프레임과 같은 top-right anchor 에서 축소 렌더 | timer-persistence |

> 구체 색상값은 shadcn `neutral` 프리셋을 따르며, `--success`/`--warning`은 구현 시 라이트 팔레트에 맞춰 확정한다.

---

## 사용 중인 컴포넌트

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

## EXTEND 패턴

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

## CUSTOM 컴포넌트

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

## 컴포넌트 패턴

- Floating Widget의 모든 화면은 `PanelShell`을 최상위 프레임으로 사용한다.
- Extension Page의 모든 화면은 `ExtensionPageShell`을 최상위 프레임으로 사용한다.
- 화면 전환은 Surface 상위의 단일 상태로 관리한다. Floating Widget = `screen`, Extension Page = `view` (`login | signup | list | detail`). Router 라이브러리를 도입하지 않는다.
- 결과값(정답/오답/보류)에 따른 분기는 화면 내부 조건부 렌더링(UI State)으로 표현한다.
- 조건부 데이터(문제 제목, 풀이 날짜, 메모, 태그 등)는 있을 때만 렌더하고 없으면 해당 영역을 생략한다. 필수 데이터로 가정하지 않는다.
- **Floating Widget 표현 상태**: `WidgetViewState = expanded | collapsed` 는 `screen`(화면 전환)과 **별개**의 단일 상태로 Surface 상위(`App`)가 소유한다. 기본값 `expanded`. 접기/펼치기는 순수 view toggle — `useTimer`·`screen`·입력값·persistence 를 바꾸지 않는다. `App` 과 `App` 이 소유한 state 는 collapse 중에도 유지되나, expanded UI subtree 는 조건부 렌더링으로 unmount 될 수 있으므로 **보존이 필요한 workflow state 는 `App`(또는 상위)이 소유**한다. (timer-persistence, `prd.md` ADR-5)
- `PanelShell` 은 선택적 접기 컨트롤 슬롯을 받는다(주입 시 헤더 최우측 아이콘 버튼, `aria-label`; 미주입 시 미렌더 → 기존 사용처 영향 없음). (timer-persistence)
- Floating Widget 내 아이콘(Codit 마크 / chevron / check 등)은 인라인 SVG 로 둔다 — lucide 미도입 원칙(`BrandHeader`, `SaveSuccessScreen` 과 동일).
