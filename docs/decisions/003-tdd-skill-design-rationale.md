# 003 — TDD 스킬 설계 결정 기록

> 이 문서는 Claude Code 스킬 사이클을 왜 이 구조로 설계했는지를 기록한다.
> "무엇을 만들었는가"가 아니라 "왜 이 선택을 했는가"에 집중한다.

---

## 배경

이 프로젝트는 **Chrome Extension (WXT + React + TypeScript + Tailwind) + Spring Boot 백엔드**의 모노레포 구조다.
초기 스킬들은 일반 웹 프론트엔드를 가정하고 작성되어 있었다. 실제 스택과 맞지 않는 부분이 있었고,
백엔드와의 연동, UI 설계, 품질 게이트 단계가 누락되어 있었다.

이 문서는 스킬을 정비하면서 내린 결정들을 기록한다.

---

## 결정 1: Chrome Extension 스택으로 전환

### 무엇을 바꿨나

- 테스트 명령어: `npm test` → `pnpm --filter @codit/extension test`
- 빌드 명령어: 레이어별 분기 (`pnpm --filter @codit/extension build` / `./gradlew build`)
- 파일 경로 기준: `src/` → `apps/extension/src/` (FE) / `backend/src/main/` (BE)
- 레이어 감지: `issue-{N}.md`의 시그니처 경로로 FE/BE/풀스택 자동 판단

### 왜

일반 웹 프론트엔드와 Chrome Extension은 빌드 아웃풋 구조, 테스트 환경, 진입점 구조가 다르다.
스킬이 잘못된 경로나 명령어를 실행하면 개발자가 수동으로 수정해야 하므로 스킬의 가치가 없어진다.

### 고려한 대안

- 공통 스킬 하나를 유지하고 실행 시 레이어 선택: 매번 입력이 필요해 자동화 가치가 낮다.
- FE/BE 스킬을 완전히 분리 (예: `fe-tdd-red`, `be-tdd-red`): 구현 내용이 근본적으로 다른 `tdd-red`, `tdd-green`은 분리가 타당하다. 반면 `tdd-refactor`는 6단계 로직이 90% 동일하므로 레이어 감지를 내부에서 처리하는 단일 파일로 유지했다 (결정 3 참고).

---

## 결정 2: api-contract 스킬 신설

### 무엇을 만들었나

`docs/features/{feature}/api-contract.md`를 생성하는 스킬.
prd.md ADR을 읽어 엔드포인트·요청/응답·에러 형식을 [확정] / [결정 포인트] 형식으로 제안하고, 개발자 승인 후 저장한다.

### 왜

`tdd-red-backend`와 `tdd-green-frontend`가 서로 다른 API 형태를 가정하고 구현하는 문제가 반복될 수 있다.
이를 방지하려면 **코드 작성 전에 API 계약을 단일 문서로 확정**해야 한다.
`test-scenarios` 전에 실행해 시나리오가 올바른 API 형태를 기준으로 작성되도록 한다.

### tdd-loop에서의 위치

```
api-contract → fe-ui-design → test-scenarios → tdd-red → tdd-green
```

api-contract는 test-scenarios보다 먼저 와야 한다. 시나리오가 API 형태를 참조하기 때문이다.

### 실행 조건 (이슈 유형별)

api-contract는 FE 이슈에만 해당하지 않는다. BE 이슈라도 새 엔드포인트를 추가한다면 FE가 나중에 그 엔드포인트를 사용하므로 계약 확정이 필요하다.

| 이슈 유형 | api-contract |
|----------|-------------|
| FE + 새 BE 엔드포인트 필요 | 실행 |
| BE + 새 엔드포인트 추가 | 실행 (FE 연동 예정) |
| FE + chrome.storage 전용 | 스킵 |
| BE + 내부 로직만 변경 (새 엔드포인트 없음) | 스킵 |

### 입력 인터페이스

초기 설계에서는 feature명을 인자로 받았으나, 다른 모든 스킬이 이슈 번호를 인자로 받는 것과 일관성이 없었다. 이슈 번호를 받아 `find docs/features -name "issue-{N}.md"`로 feature 디렉터리를 자동 탐색하는 방식으로 수정했다.

### shared-types 처리

api-contract 스킬은 shared-types 변경 목록만 제시한다. 실제 파일 작성은 `tdd-red` 단계에서 한다.
설계 시점에 타입을 먼저 작성하면 이후 구현이 바뀔 때 타입도 함께 수정해야 하는 이중 작업이 생기기 때문이다.

### 역할 분리 시 api-contract의 역할

FE 개발자와 BE 개발자가 나뉘어 작업할 때 api-contract는 **유일한 공동 작업 지점**이다.
api-contract.md가 확정되면 두 개발자는 독립적으로 병렬 작업할 수 있다.
FE 개발자는 BE가 완성되기 전에도 api-contract.md를 mock 기준으로 삼아 개발을 진행할 수 있다.

---

## 결정 3: tdd-refactor 단일 파일 유지

### 선택지

- **안 A**: 단일 파일 + 내부 레이어 감지 (채택)
- **안 B**: `tdd-refactor-frontend` / `tdd-refactor-backend`로 분리

### 왜 A를 선택했나

`tdd-red`와 `tdd-green`은 FE와 BE의 구현 방식이 근본적으로 다르다 (Vitest vs JUnit, React 컴포넌트 vs Spring Service).
반면 `tdd-refactor`의 6단계 로직은 거의 동일하다:
- 전체 테스트 통과 확인
- 변경 파일 목록 추출
- 5가지 점검 기준 적용 (중복, 네이밍, 단일 책임, 복잡도, 컨벤션)
- 승인 게이트
- 하나씩 변경 → 테스트 → 확인
- 요약

차이는 테스트 명령어, 파일 경로, 컨벤션 체크리스트뿐이다. 이 정도 차이를 위해 90% 동일한 내용을 두 파일에 복붙하면 유지보수 비용이 더 크다.

---

## 결정 4: fe-ui-design 스킬 신설

### 무엇을 만들었나

prd.md 사용자 스토리를 읽어 ASCII 와이어프레임 + 컴포넌트 트리 + UI State 테이블을 생성하고
`docs/features/{feature}/ui-design.md`에 저장하는 스킬.

### 왜 test-scenarios 전에 넣었나

`test-scenarios`가 컴포넌트 시그니처를 확정할 때 "이 컴포넌트가 어떤 Props를 받아야 하는가"를 결정한다.
UI 구조를 먼저 확정하지 않으면 시그니처 결정이 구현자의 추측에 의존하게 된다.
UI 설계 → 시그니처 확정 → 테스트 작성 → 구현이 올바른 순서다.

### 접근법 선택: C (실용형)

세 가지 안을 검토했다:

| 안 | 특징 | 탈락 이유 |
|----|------|----------|
| A (완전 구조형) | HANDOFF 6개 항목 필수 입력, 정식 State Machine | 단순한 Feature에도 overhead 발생 |
| B (최소형) | 컴포넌트 목록만 나열, design-system.md 연동 없음 | tdd-green-frontend가 참조할 시각 스펙 부재 |
| C (실용형) | prd.md만 읽으면 실행 가능, design-system.md 자동 연동 | **채택** |

**통계 대시보드를 고려한 판단**: 대시보드는 복잡한 필터 상태와 드릴다운이 있어 State Machine이 유용할 수 있다. 그러나 현재 Feature 대부분은 단순 CRUD 수준이다. 모든 Feature에 A 방식의 overhead를 주는 것보다, 지금은 C로 시작하고 대시보드 Feature 작업 직전에 스킬을 업그레이드하는 것이 낫다고 판단했다.

---

## 결정 5: design-system.md 자동 생성 방식

### 배경

shadcn/ui를 내부적으로 채택하기로 결정했으나, `docs/ui/design-system.md` 문서가 없었다.

### 선택지

- 별도 `/design-system` 스킬로 수동 생성
- fe-ui-design이 최초 실행 시 자동 생성 (채택)

### 왜 자동 생성을 선택했나

`design-system.md`는 Feature가 쌓이면서 자연스럽게 커지는 문서다.
처음에 "완성된 디자인 시스템"을 만들려고 하면 실제로 쓰이지 않는 항목이 채워진다.
대신 fe-ui-design이 각 Feature를 설계할 때마다 실제로 사용하는 shadcn 컴포넌트와 토큰만 누적하면 자연스럽게 현실을 반영한 문서가 만들어진다.

```
최초 실행: docs/ui/design-system.md 없음 → 설계 후 파일 생성
이후 실행: 파일 읽고 기존 결정 유지 → 새 항목만 추가
```

---

## 결정 6: quality-gate 스킬 → Husky로 대체

### 배경

PR 직전에 lint/typecheck/build를 확인하는 `quality-gate` 스킬을 만들려 했다.

### 왜 Husky를 선택했나

Husky pre-commit/pre-push 훅이 동일한 역할을 더 신뢰성 있게 수행한다.
- **스킬**: 개발자가 직접 실행해야 함 → 깜빡하면 누락
- **Husky 훅**: git 명령어에 연결되어 자동 실행 → 건너뛸 수 없음

프로젝트에 Husky가 설치되지 않은 상태였으므로 설치하고 훅을 구성했다.

**훅 구성 결정:**

| 훅 | 실행 내용 | 제외한 것 |
|----|----------|----------|
| pre-commit | FE lint + FE typecheck | BE checkstyle (느림) |
| pre-push | FE build | BE `./gradlew test` (느림, CI에서 처리) |

백엔드 Gradle 테스트는 로컬에서 pre-push에 넣기에 너무 느리다. CI 파이프라인에서 처리하는 것이 적합하다.

---

## 결정 7: 대시보드 대비 스킬 업그레이드 계획

통계 대시보드는 복잡한 필터 조합, 차트별 독립 loading/error 상태, 드릴다운 흐름이 생긴다.
현재 Feature 대부분은 단순 CRUD 수준이므로 지금은 실용형(C 방식)으로 시작하고, 대시보드 Feature 직전에 스킬을 업그레이드하기로 결정했다.

구체적인 업그레이드 목록은 `docs/improvements.md`에서 관리한다.
