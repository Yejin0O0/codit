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
| Collapsible | shadcn/ui (Radix) | USE | 태그 "더보기", 정답 "메모 추가하기" | timer |
| Badge | shadcn/ui | USE (선택) | 결과 표시 | timer |

---

## EXTEND 패턴

| 이름 | 기반 | 확장 내용 |
|------|------|----------|
| `PanelShell` | Card | 헤더(제목 + 스텝 인디케이터) 고정 레이아웃. 각 화면의 공통 프레임 |
| `ResultToggleGroup` | Toggle Group (single) | 정답/오답/보류 3항목. 의미 토큰(`--success`/`--destructive`/`--warning`) 스타일 |
| `TagToggleGroup` | Toggle Group (multiple) | chip 형태 렌더. 핵심 태그 + 더보기 태그 + 직접입력 태그를 하나의 선택 집합으로 관리 |

---

## CUSTOM 컴포넌트

| 이름 | 근거 |
|------|------|
| `CoditWidget` | Shadow host 래퍼 / 위젯 프레임 |
| `TimerDisplay` | `tabular-nums` 대형 `mm:ss` 표시. 대응 primitive 없음 |

---

## 컴포넌트 패턴

- 모든 화면은 `PanelShell`을 최상위 프레임으로 사용한다.
- 화면 전환은 위젯 상위의 단일 상태(`screen`)로 관리한다.
- 결과값(정답/오답/보류)에 따른 분기는 화면 내부 조건부 렌더링(UI State)으로 표현한다.
