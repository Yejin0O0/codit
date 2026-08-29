# 개발 워크플로우 가이드

이 문서는 Codit 프로젝트의 TDD 기반 개발 사이클을 설명한다.
새 팀원이 이 문서만 읽고 워크플로우를 따라올 수 있도록 작성했다.

---

## 시작하기 전 준비

### 브랜치 규칙

```
develop
└── feature/{spec}         # 스펙 단위 브랜치 (예: feature/tag-management)
    └── feat/{issue-slug}  # 이슈 단위 브랜치 (예: feat/태그-삭제-기능)
```

작업 이슈가 생기면 `feature/{spec}` 브랜치에서 `feat/{issue-slug}` 브랜치를 분기해 작업한다.
PR은 `feature/{spec}` 브랜치로 올린다.

### 필요한 도구

```bash
gh auth login          # GitHub CLI 인증
pnpm install           # 의존성 설치 (Husky 훅도 자동 설치됨)
```

### tdd-loop 실행 전 준비: prd.md

`tdd-loop`를 실행하기 전에 해당 기능의 `prd.md`가 먼저 작성되어 있어야 한다.
api-contract, fe-ui-design, e2e-write 단계가 모두 이 파일을 읽는다.

```bash
/my-prd    # spec-fixed.md를 바탕으로 prd.md 생성
```

산출물: `docs/features/{feature}/prd.md`

---

## 전체 흐름

GitHub 이슈 하나를 처음부터 PR까지 처리하는 전체 사이클이다.

```
0.   사전 점검          브랜치 상태, 이슈 확인
 ↓
0.5  api-contract      익스텐션 ↔ 백엔드 API 계약 확정  (새 엔드포인트 있을 때만)
 ↓
0.7  fe-ui-design      와이어프레임 + UI State 설계      (FE UI 있을 때만)
 ↓
1.   test-scenarios    함수/컴포넌트 시그니처 + 시나리오 확정
 ↓
2.   tdd-red           실패하는 테스트 코드 작성
 ↓
3.   tdd-green         테스트를 통과하는 최소 구현
 ↓
4.   ac-verifier       AC 충족 여부 독립 검증
 ↓
5.   tdd-refactor      코드 구조 개선 (동작 변경 없음)
 ↓
6.   security-review   타입 오류·보안 취약점 점검
 ↓
6.5  e2e-write         Playwright E2E 테스트 작성       (UI 또는 API 연동 흐름 있을 때만)
 ↓
7.   create-pr         PR 생성
```

---

## tdd-loop

`tdd-loop`는 위 단계들을 순서대로 실행하는 **오케스트레이터 스킬**이다.
각 단계를 직접 구현하지 않고, 해당 스킬을 호출하는 역할만 한다.

```bash
/tdd-loop 15    # 이슈 15번 전체 사이클 실행
```

### tdd-loop의 역할

- 단계 순서를 보장한다
- 각 단계의 실행/스킵 여부를 이슈 내용 기반으로 자동 판단한다
- 단계 실패 시 중단하고 재개 방법을 안내한다
- 각 스킬 내부의 승인 게이트는 그대로 작동한다 — tdd-loop가 건너뛰지 않는다

### tdd-loop vs 개별 스킬 직접 실행

| 상황 | 방법 |
|------|------|
| 이슈를 처음 시작할 때 | `/tdd-loop {이슈번호}` |
| 중간 단계부터 재시작할 때 | `/tdd-green 15` 처럼 해당 스킬 직접 실행 |
| 특정 단계만 단독으로 실행할 때 | 해당 스킬 직접 실행 |

### 단계 실패 시

tdd-loop가 어느 단계에서 실패했는지와 재개 방법을 아래 형식으로 출력한다.

```
❌ N단계 ({단계명}) 실패

원인: {에러 메시지}

재개 방법:
  /{스킬명} {이슈번호}
```

원인을 해결한 뒤 해당 스킬을 직접 실행해서 재개한다. `/tdd-loop`를 처음부터 다시 실행하지 않는다.

---

## FE/BE 역할 분리 시 워크플로우

FE 개발자와 BE 개발자가 나뉘어 작업할 때의 흐름이다.

### api-contract가 동기화 지점이다

api-contract.md가 확정되기 전까지는 FE와 BE가 병렬로 작업하면 안 된다.
API 형태가 확정되지 않은 상태에서 각자 구현하면 나중에 통합 시 충돌이 발생한다.

```
[공동 작업]
  api-contract 실행 → api-contract.md 확정
          ↓
  ┌───────┴───────┐
  │               │
[FE 개발자]    [BE 개발자]
fe-ui-design   (0.7 스킵)
test-scenarios test-scenarios
tdd-red        tdd-red
tdd-green      tdd-green
ac-verifier    ac-verifier
tdd-refactor   tdd-refactor
security-review security-review
e2e-write      (6.5 스킵)
create-pr      create-pr
```

### 각자 실행하는 명령어

두 개발자 모두 동일하게 `/tdd-loop {자신의_이슈번호}`를 실행한다.
스킬이 이슈의 레이어를 자동으로 감지해 FE 이슈면 FE 스킬을, BE 이슈면 BE 스킬을 실행한다.

### FE가 BE보다 먼저 작업해야 할 때

api-contract.md를 mock 기준으로 삼아 FE 개발을 진행할 수 있다.
실제 BE가 완성되면 E2E 테스트로 실제 연동을 검증한다.

---

## 0단계: 사전 점검 (`/tdd-loop` 실행 시 자동)

다음 조건을 모두 만족해야 작업을 시작할 수 있다.

- GitHub 이슈가 존재하는가
- uncommitted 변경사항이 없는가
- `feature/{spec}` 브랜치에 있는가

`/tdd-loop {이슈번호}`를 실행하면 자동으로 점검하고 `feat/{slug}` 브랜치를 생성한다.

---

## 0.5단계: API 계약 (`/api-contract {이슈번호}`)

**무엇을 하는가**

`docs/features/{feature}/prd.md`의 ADR을 읽어 엔드포인트·요청/응답 형식을 설계하고,
개발자 승인 후 `docs/features/{feature}/api-contract.md`를 저장한다.

FE↔BE 경계의 계약을 확정하는 단계다. 이 문서가 확정되면 FE와 BE는 독립적으로 병렬 작업할 수 있다.

**실행 조건**

| 이슈 유형 | 실행 여부 |
|----------|---------|
| FE 이슈 + 새 BE 엔드포인트 필요 | 실행 |
| BE 이슈 + 새 엔드포인트 추가 (FE 연동 예정) | 실행 |
| FE 이슈 + chrome.storage 전용 (BE 연동 없음) | 스킵 |
| BE 이슈 + 내부 로직만 변경 (새 엔드포인트 없음) | 스킵 |

**산출물**

```
docs/features/{feature}/api-contract.md
```

---

## 0.7단계: UI 설계 (`/fe-ui-design {이슈번호}`)

**실행 조건**: 이슈에 UI 컴포넌트(화면, 팝업, 사이드패널 등)가 포함될 때 — FE 이슈 전용

**무엇을 하는가**

prd.md 사용자 스토리를 읽어 다음 세 가지를 작성한다:

1. **ASCII 와이어프레임** — 화면 레이아웃과 요소 배치
2. **컴포넌트 트리** — 컴포넌트 계층 구조와 shadcn/ui 매핑
3. **UI State 테이블** — 컴포넌트별 상태 (idle/loading/error/empty 등)

**산출물**

```
docs/features/{feature}/ui-design.md
docs/ui/design-system.md          # 최초 실행 시 생성, 이후 업데이트
```

**스킵 조건**: 훅·유틸·백엔드 전용 이슈는 자동으로 건너뛴다.

---

## 1단계: 시나리오 확정 (`/test-scenarios {이슈번호}`)

**무엇을 하는가**

1. 함수·컴포넌트 시그니처를 제안하고 **[GATE] 개발자 승인**을 받는다
2. AC를 기반으로 테스트 시나리오를 도출하고 **[GATE] 개발자 승인**을 받는다

이 단계에서 코드는 작성하지 않는다. 무엇을 만들지만 확정한다.

**산출물**

```
docs/features/{feature}/issue-{N}.md   # 시그니처 + 시나리오 목록
```

**승인 게이트**: 시그니처 확정, 시나리오 확정 각 1회 (총 2회 승인 필요)

---

## 2단계: 실패 테스트 작성 (`/tdd-red {이슈번호}`)

**무엇을 하는가**

`issue-{N}.md`의 시나리오를 하나씩 실패하는 테스트 코드로 변환한다.
이 단계가 끝나면 **모든 시나리오가 AssertionError로 실패**해야 한다.

레이어 자동 감지:
- FE → `/tdd-red-frontend` 실행
- BE → `/tdd-red-backend` 실행

**산출물**

```
# 프론트엔드
apps/extension/entrypoints/**/*.test.ts(x)

# 백엔드
backend/src/test/java/**/*Test.java
```

---

## 3단계: 최소 구현 (`/tdd-green {이슈번호}`)

**무엇을 하는가**

실패하는 테스트를 하나씩 통과시키는 **최소한의 코드**만 작성한다.
테스트가 검증하지 않는 기능은 구현하지 않는다.

FE 이슈인 경우, 다음 문서를 참조해 시각 스펙에 맞게 구현한다:
- `docs/features/{feature}/ui-design.md` — 와이어프레임·컴포넌트 트리·UI State
- `docs/ui/design-system.md` — shadcn/ui 컴포넌트 사용 방식과 디자인 토큰

**피드백 루프**: 최대 5회 수정 후에도 통과하지 못하면 개발자에게 보고하고 중단한다.

---

## 4단계: AC 검증 (`@ac-verifier`)

**무엇을 하는가**

테스트가 통과했다고 해서 AC를 충족하는 것은 아니다.
`ac-verifier` 에이전트가 이슈 AC를 독립적으로 읽고, 구현이 AC의 **의도**를 충족하는지 검증한다.

AC 갭이 발견되면 추가 시나리오 작성 여부를 묻는다 (필요하면 2단계로 돌아간다).

---

## 5단계: 코드 정리 (`/tdd-refactor {이슈번호}`)

**무엇을 하는가**

동작을 바꾸지 않고 코드를 읽기 좋게 만든다.

점검 기준:
- 중복 제거
- 네이밍 명확성
- 단일 책임
- 불필요한 복잡도 제거
- 프로젝트 컨벤션 일치

**규칙**: 테스트 파일은 수정하지 않는다. 테스트를 바꿔야 통과하는 리팩토링은 리팩토링이 아니다.

**승인 게이트**: 개선 후보 목록을 보고한 뒤 개발자가 승인해야 실제 수정을 시작한다.

---

## 6단계: 보안 점검 (`/security-review {이슈번호}`)

**무엇을 하는가**

다음 항목을 스캔하고 심각도별로 분류한다:

| 항목 | 도구 |
|------|------|
| TypeScript 타입 오류 | `pnpm typecheck` |
| npm 취약점 | `pnpm audit` |
| `.env` 하드코딩 여부 | grep |
| Gradle 의존성 CVE | `cd backend && ./gradlew dependencies` |
| manifest.json 과도한 권한 | grep + 수동 검토 |
| 빌드 아웃풋 시크릿 노출 | grep |

**승인 게이트**: 즉시 수정 필요 항목을 보고한 뒤 개발자 승인 후 처리한다.

---

## 6.5단계: E2E 테스트 작성 (`/e2e-write {이슈번호}`)

**실행 조건**: 여러 컴포넌트/계층이 함께 동작하는 사용자 흐름이 있거나, API 저장 후 데이터 영속성이 AC에 포함될 때 — 순수 유틸·훅 이슈는 스킵

**무엇을 하는가**

`prd.md`의 사용자 스토리를 읽어 단위 테스트와 겹치지 않는 E2E 시나리오를 결정하고, Playwright 테스트 코드를 작성한다.

**산출물**

```
e2e/{feature}/{feature}.spec.ts
```

> Chrome Extension E2E는 실제 브라우저(`headless: false`)가 필요하다. 백엔드 연동 흐름은 백엔드 서버가 실행 중이어야 한다.

---

## 7단계: PR 생성 (`/create-pr`)

**무엇을 하는가**

1. 변경사항을 분석해 PR 제목·본문 초안 작성
2. **[GATE] 개발자 승인**
3. `pnpm test:e2e` 실행 (6.5단계에서 작성한 E2E 포함)
4. 통과 시 push + PR 생성

> E2E가 없는 이슈(스킵 조건 해당)는 create-pr이 자동으로 E2E를 건너뛰고 PR을 생성한다.

> `tdd-loop`로 실행한 경우, PR 생성 완료 후 해당 이슈에 PR URL 코멘트(`gh issue comment`)가 자동으로 남겨진다. `/create-pr` 단독 실행 시에는 이 동작이 없다.

**실패 시**: E2E 실패 원인을 분석해 근본 원인 수정 절차를 안내한다. E2E 테스트 코드를 수정해서 통과시키는 것은 금지다.

---

## Husky 훅 (자동 실행)

커밋·푸시 시 자동으로 실행된다. 별도 실행 불필요.

| 훅 | 실행 시점 | 내용 |
|----|----------|------|
| pre-commit | `git commit` | FE lint + FE typecheck |
| pre-push | `git push` | FE build |

훅이 실패하면 커밋/푸시가 중단된다. 오류를 수정한 뒤 다시 실행한다.

---

## 산출물 전체 목록

이슈 하나를 처리하면 다음 파일들이 생성된다.

```
docs/
├── features/{feature}/
│   ├── api-contract.md      # API 계약 (새 엔드포인트 있을 때)
│   ├── ui-design.md         # 와이어프레임 + UI State (FE UI 시)
│   └── issue-{N}.md         # 시그니처 + 시나리오 목록
└── ui/
    └── design-system.md     # shadcn 컴포넌트 + 디자인 토큰 누적 (FE)

apps/extension/entrypoints/
└── **/*.test.ts(x)          # FE 단위 테스트

backend/src/test/java/
└── **/*Test.java            # BE 단위 테스트

e2e/
└── {feature}/{feature}.spec.ts   # E2E 테스트 (UI/API 연동 흐름 있을 때)
```

---

## 자주 묻는 질문

**Q. 이슈에 FE와 BE가 둘 다 포함되어 있으면?**

풀스택 이슈다. `tdd-red`, `tdd-green`은 각각 FE와 BE를 순서대로 처리한다. `api-contract`를 먼저 실행해 계약을 확정해야 양쪽 구현이 어긋나지 않는다.

**Q. 시나리오를 잘못 설계했다는 걸 tdd-green 도중에 알았다면?**

`/test-scenarios {이슈번호}`를 다시 실행해 시나리오를 수정한다. 이미 작성한 테스트가 있으면 `/tdd-red`도 다시 실행한다.

**Q. ac-verifier가 갭을 발견하면?**

추가 시나리오가 필요한지 판단한다. 필요하면 `/tdd-red {이슈번호}`로 돌아가 시나리오를 추가하고 `/tdd-green`을 다시 실행한다.

**Q. tdd-refactor에서 테스트가 깨졌다면?**

즉시 롤백한다: `git checkout -- {파일경로}`. 롤백 후 테스트를 다시 실행해 Green 상태가 복원됐는지 확인한다.

**Q. security-review에서 critical 취약점이 나왔는데 지금 고치기 어렵다면?**

개발자가 승인 게이트에서 보류 결정을 내릴 수 있다. 다음 스프린트 이슈로 등록하고 PR에 해당 내용을 명시한다.
