---
name: fe-ui-design
description: >
  프론트엔드 UI 설계 스킬. "/fe-ui-design {이슈번호}", "UI 설계해줘", "와이어프레임 만들어줘",
  "UI 구조 잡아줘", "화면 설계해줘" 등의 요청에 반드시 이 스킬을 사용하세요.
  prd.md의 사용자 스토리와 AC를 읽어 ASCII 와이어프레임 + 컴포넌트 트리 + UI State 테이블을
  생성하고 docs/features/{feature}/ui-design.md에 저장합니다.
  코드는 작성하지 않으며, tdd-red 전 단계로 개발자가 시각적 스펙을 확인하는 단계입니다.
---

# fe-ui-design

prd.md를 읽어 UI 설계 문서를 작성한다.

이 스킬의 산출물은 `tdd-green-frontend`가 구현 시 참조하는 시각적 명세다.
코드를 작성하지 않는다 — UI 구조, 상태, 컴포넌트 경계를 확정하는 것이 목적이다.

```
prd.md (사용자 스토리 + AC)
    ↓ design-system.md 유무 확인 (자동 감지)
    ↓ UI 구조 결정 (와이어프레임 + 컴포넌트 트리)
    ↓ UI State 정의
    ↓ Product Decision 수집 → BLOCKED (한 번만)
    ↓ 개발자 응답 후 확정
    ↓ 산출물 저장
docs/features/{feature}/ui-design.md
docs/ui/design-system.md (최초 실행 시 생성 / 이후 업데이트)
```

---

## 시작 전: 입력 확인

- **이슈 번호**: `$ARGUMENTS`에서 추출. 없으면 질문한다.
- **feature명**: `docs/features/` 하위에서 해당 이슈를 다루는 디렉터리 이름을 찾는다.
  ```bash
  find docs/features -name "issue-{N}.md" 2>/dev/null   # test-scenarios 완료 후 존재
  find docs/features -name "prd.md" 2>/dev/null          # 위 결과가 없으면 prd.md로 탐색
  ```
  둘 다 없으면 `docs/features/` 하위 디렉터리 목록을 보여주고 feature명을 직접 묻는다.
- **prd 파일**: `docs/features/{feature}/prd.md` — 없으면 중단하고 알린다.

---

## 1단계: 컨텍스트 수집

### 1-1. prd.md 읽기

다음 항목을 추출한다:

- **사용자 스토리**: 역할 / 행동 / 목적
- **Acceptance Criteria**: UI 동작에 영향을 주는 조건
- **Out of Scope**: 이번 Feature에서 제외된 항목 — 설계에 포함하지 않는다
- **ADR**: UI에 영향을 주는 기술 결정 (상태 관리 방식, 피드백 방식, 제한 조건 등)

### 1-2. design-system.md 자동 감지

```bash
ls docs/ui/design-system.md 2>/dev/null
```

**파일이 없는 경우 (최초 실행)**

shadcn/ui 기본값을 기준으로 설계를 진행한다. 설계 완료 후 5단계에서 파일을 새로 생성한다.

**파일이 있는 경우**

`docs/ui/design-system.md`를 읽어 다음을 파악한다:

- 이미 사용 중인 shadcn/ui 컴포넌트와 커스터마이징 내용
- 확정된 디자인 토큰 (색상, 간격, 폰트)
- 프로젝트 컴포넌트 패턴

기존 결정과 일관된 설계를 한다. 이미 확정된 토큰·컴포넌트 선택을 뒤집지 않는다.

### 1-3. 기존 컴포넌트 패턴 파악

```bash
ls apps/extension/entrypoints/ 2>/dev/null
ls apps/extension/src/components/ 2>/dev/null
```

기존 컴포넌트의 레이아웃 패턴과 명명 방식을 파악한다. 새 설계가 기존 패턴에서 크게 벗어나지 않도록 한다.

---

## 2단계: Product Decision 수집

설계를 시작하기 전에 prd.md를 읽으며 아래 항목을 수집한다:

**Product Decision이 필요한 신호:**
- prd.md에 "TBD", "미정", "논의 필요", "결정 필요" 표시
- AC가 충돌하거나 우선순위가 불명확한 경우
- 두 가지 이상의 UX 방향이 가능하고 prd.md가 침묵한 경우

Product Decision이 없으면 이 단계를 건너뛰고 3단계로 진행한다.

Product Decision이 있으면 모두 수집한 뒤 아래 형식으로 한 번만 보고하고, 개발자 응답을 기다린다.
개발자가 응답하기 전까지 3단계로 넘어가지 않는다.

```
🔴 BLOCKED — Product Decision 필요

설계를 완성하려면 아래 항목에 대한 결정이 필요합니다.

1. [항목명]
   상황: {어떤 UX 선택이 필요한지}
   안 A: {설명}
   안 B: {설명}
   제안: 안 A — {이유}

2. [항목명]
   ...

모든 항목에 답변 후 "계속"이라고 입력해주세요.
```

---

## 3단계: UI 구조 결정

사용자 스토리와 AC를 기반으로 UI 구조를 결정한다.

UI 결정은 자율적으로 내린다 — 개발자에게 묻지 않는다.
(단, 2단계의 Product Decision 응답 내용을 반영한다.)

### ASCII 와이어프레임

각 화면 또는 주요 상태별로 레이아웃을 표현한다.
실제 픽셀 크기보다 요소의 배치와 계층 구조에 집중한다.

```
┌─────────────────────────────┐
│  [Header]                   │
├─────────────────────────────┤
│  검색 입력창      [필터 ▼]  │
├─────────────────────────────┤
│  ┌───────┐  ┌───────┐       │
│  │ 태그A │  │ 태그B │  ...  │
│  └───────┘  └───────┘       │
├─────────────────────────────┤
│  결과 목록                  │
│  ─────────────────────────  │
│  • 항목 1                   │
│  • 항목 2                   │
└─────────────────────────────┘
```

### 컴포넌트 트리

와이어프레임의 계층 구조를 컴포넌트 단위로 표현한다.
각 컴포넌트가 어떤 shadcn/ui 컴포넌트를 사용하는지 명시한다.

```
FeaturePage
├── SearchBar               → shadcn Input
├── FilterDropdown          → shadcn Select
├── TagList
│   └── TagBadge (반복)    → shadcn Badge
└── ResultList
    └── ResultItem (반복)  → 커스텀 컴포넌트
```

---

## 4단계: UI State 정의

각 컴포넌트가 가질 수 있는 상태를 테이블로 정의한다.

| 컴포넌트 | 상태 | 트리거 | 표현 방식 |
|---------|------|--------|----------|
| SearchBar | idle | 초기 진입 | placeholder 표시 |
| SearchBar | active | 포커스 | 테두리 강조 |
| FilterDropdown | closed | 기본 | 드롭다운 닫힘 |
| FilterDropdown | open | 클릭 | 옵션 목록 표시 |
| ResultList | loading | 검색 실행 중 | 스켈레톤 |
| ResultList | empty | 결과 없음 | 빈 상태 메시지 |
| ResultList | error | API 실패 | 에러 메시지 + 재시도 버튼 |
| ResultList | populated | 결과 있음 | 항목 목록 |

상태가 다른 컴포넌트에 영향을 주는 경우 (예: 부모 상태가 자식 표시를 제어) 별도로 명시한다.

---

## 5단계: 산출물 저장

### 5-1. ui-design.md 저장

`docs/features/{feature}/ui-design.md`에 저장한다.

```markdown
# {feature명} UI Design

> 이 문서는 tdd-green-frontend의 시각적 명세 참조 기준이다.
> 코드를 작성하지 않는다.

## 와이어프레임

### {화면 또는 주요 상태명}

{ASCII 와이어프레임}

---

## 컴포넌트 트리

{컴포넌트 트리}

---

## UI State

{UI State 테이블}

---

## shadcn/ui 사용 컴포넌트

| 컴포넌트 | 용도 | 커스터마이징 |
|---------|------|------------|
| Badge   | 태그 표시 | variant 추가 없음 |
| Input   | 검색창 | 없음 |

---

## Out of Scope (이번 Feature 제외)

{prd.md Out of Scope에서 UI 관련 항목}
```

### 5-2. design-system.md 업데이트

이 Feature에서 새로 사용하거나 커스터마이징한 shadcn/ui 컴포넌트와 디자인 토큰을 `docs/ui/design-system.md`에 반영한다.

**최초 실행 (파일 없음):** 파일을 새로 생성한다.

```markdown
# Design System

> Codit Chrome Extension UI 설계 기준.
> fe-ui-design 스킬이 Feature마다 업데이트한다.
> tdd-green-frontend는 이 문서를 읽어 구현 시 참조한다.

## UI Library

shadcn/ui

## 사용 중인 컴포넌트

| 컴포넌트 | 커스터마이징 | 첫 사용 Feature |
|---------|------------|----------------|
| Badge   | 없음        | {feature명}     |

## 디자인 토큰

| 토큰 | 값 | 용도 | 첫 사용 Feature |
|------|-----|------|----------------|

## 컴포넌트 패턴

{프로젝트 공통 패턴이 생기면 여기에 추가}
```

**기존 파일 있음:** 이 Feature에서 새로 추가된 컴포넌트·토큰만 추가한다. 기존 내용은 수정하지 않는다.

---

## 6단계: 결과 보고

```
fe-ui-design 완료 — {feature명} (이슈 #{N})

산출물
  docs/features/{feature}/ui-design.md
  docs/ui/design-system.md ({신규 생성 / N개 항목 추가})

와이어프레임: {화면 수}개 화면
컴포넌트: {컴포넌트 수}개 ({shadcn 컴포넌트 수}개 shadcn/ui)
UI State: {상태 수}개 상태 정의

이번 Feature에서 추가된 shadcn/ui 컴포넌트
  {컴포넌트명} — {용도}

다음 단계: /test-scenarios {N}
```

---

## 제약

- **코드 작성 금지** — 이 스킬은 설계 문서만 생성한다. `.ts`, `.tsx` 파일을 생성하거나 수정하지 않는다.
- **Out of Scope 포함 금지** — prd.md Out of Scope 항목은 와이어프레임과 State에 포함하지 않는다.
- **production 소스 읽기 금지** — `apps/extension/entrypoints/`의 구현 코드는 패턴 파악용으로만 참조한다. 의존하지 않는다.
- **Product Decision은 한 번만 보고** — 여러 결정 포인트가 있어도 모아서 한 번에 BLOCKED 처리한다.
- **기존 design-system.md 결정 뒤집기 금지** — 이미 확정된 컴포넌트 선택과 토큰은 바꾸지 않는다.
- **design-system.md 기존 내용 수정 금지** — 새 항목 추가만 허용. 기존 행은 건드리지 않는다.
