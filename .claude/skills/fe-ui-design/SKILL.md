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
docs/ui/design-system.md → ## feature별 인벤토리 만 업데이트 (## 기초 는 /design-system 소관)
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

`docs/ui/design-system.md`는 두 섹션으로 나뉜다:

| 섹션 | 소유 | fe-ui-design 권한 |
|------|------|------------------|
| `## 기초` | `design-system` 스킬 | **읽기 전용 입력** — 토큰 값·팔레트·스케일·SWEA 공존 규칙 |
| `## feature별 인벤토리` | fe-ui-design | 읽기 + 이 feature 항목 추가 (5-2단계) |

**파일이 없는 경우**

기초 레이어가 아직 없다는 뜻이다. shadcn/ui 기본값을 기준으로 설계를 진행하되,
새 토큰 값을 지어내지 않는다. 설계 완료 후 개발자에게 `/design-system` 실행을 권한다.
5단계에서 `## feature별 인벤토리`만 생성한다 (`## 기초`는 생성하지 않는다).

**파일이 있는 경우**

- `## 기초` — 확정된 토큰(색·간격·폰트·radius 등)과 SWEA 공존 규칙을 읽어 **일관된 설계의 전제로 삼는다.** 값을 바꾸거나 새 값을 제안하지 않는다.
- `## feature별 인벤토리` — 이미 사용 중인 컴포넌트·EXTEND 패턴·프로젝트 컴포넌트 패턴을 읽는다.

이미 확정된 토큰·컴포넌트 선택을 뒤집지 않는다. 이 feature가 `## 기초`에 없는
새 토큰(색·간격·radius 등)을 필요로 하면, **값을 정하지 말고** "이 토큰이 필요함"만
Product Decision(2단계) 또는 결과 보고에 flag하고 `/design-system` 소관으로 넘긴다.

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

### 5-2. design-system.md `## feature별 인벤토리` 업데이트

이 Feature에서 새로 사용하거나 커스터마이징한 컴포넌트를 `docs/ui/design-system.md`의
`## feature별 인벤토리` 섹션에만 반영한다.

- **`## 기초` 섹션은 절대 건드리지 않는다** — 토큰 값·팔레트·스케일은 `/design-system` 소관.
- **디자인 토큰 행을 추가하지 않는다.** 이 feature가 새 토큰을 필요로 했다면 6단계 결과 보고에 flag만 한다.

**`## feature별 인벤토리`가 없는 경우:** 섹션을 새로 만든다 (파일 전체를 생성하지 않는다 — `## 기초`는 `/design-system`이 만든다).

```markdown
## feature별 인벤토리

### 사용 중인 컴포넌트

| 컴포넌트 | 출처 | 분류 | 커스터마이징 | 첫 사용 Feature |
|---------|------|------|------------|----------------|
| Badge   | shadcn/ui | USE | 없음 | {feature명} |

### EXTEND 패턴

| 이름 | 기반 | 확장 내용 |
|------|------|----------|

### CUSTOM 컴포넌트

| 이름 | 근거 |
|------|------|
```

**섹션이 이미 있는 경우:** 이 Feature에서 새로 추가된 컴포넌트/EXTEND/CUSTOM 행만 추가한다. 기존 행은 수정하지 않는다.

---

## 6단계: 결과 보고

```
fe-ui-design 완료 — {feature명} (이슈 #{N})

산출물
  docs/features/{feature}/ui-design.md
  docs/ui/design-system.md ## feature별 인벤토리 ({N}개 항목 추가)

와이어프레임: {화면 수}개 화면
컴포넌트: {컴포넌트 수}개 ({shadcn 컴포넌트 수}개 shadcn/ui)
UI State: {상태 수}개 상태 정의

이번 Feature에서 추가된 shadcn/ui 컴포넌트
  {컴포넌트명} — {용도}

필요한 새 토큰 (있으면 — /design-system 소관)
  {토큰명} — {용도}. 값 미정

다음 단계: /test-scenarios {N}
```

---

## 제약

- **코드 작성 금지** — 이 스킬은 설계 문서만 생성한다. `.ts`, `.tsx` 파일을 생성하거나 수정하지 않는다.
- **Out of Scope 포함 금지** — prd.md Out of Scope 항목은 와이어프레임과 State에 포함하지 않는다.
- **production 소스 읽기 금지** — `apps/extension/entrypoints/`의 구현 코드는 패턴 파악용으로만 참조한다. 의존하지 않는다.
- **Product Decision은 한 번만 보고** — 여러 결정 포인트가 있어도 모아서 한 번에 BLOCKED 처리한다.
- **기존 design-system.md 결정 뒤집기 금지** — 이미 확정된 컴포넌트 선택과 토큰은 바꾸지 않는다.
- **design-system.md 기존 내용 수정 금지** — `## feature별 인벤토리`에 새 항목 추가만 허용. 기존 행은 건드리지 않는다.
- **토큰 값 정의·변경 금지** — 색·간격·radius·타이포·elevation·motion 값은 `/design-system` 소관. `## 기초` 섹션은 읽기 전용. 새 토큰이 필요하면 값을 정하지 말고 flag만 한다.

관련 스킬: `design-system` (토큰 기초 레이어 — `## 기초` 섹션 소유)
