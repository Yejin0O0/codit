# ADR 001: 모노레포 구조 결정

> **상태:** 확정  
> **결정일:** 2026-08-24  
> **작성자:** @Yejin0O0

---

## 배경

SSAFY 과정에서 사용하는 코딩 테스트 연습 사이트 **SWEA**는 오답노트, 풀이 통계, 태그별 분류 등의 기능을 제공하지 않는다.  
이를 보완하기 위해 Chrome 익스텐션 기반 프로젝트 **Codit**을 팀으로 진행한다.

### 기술 스택

| 영역 | 기술 |
|---|---|
| 익스텐션 | WXT, React, TypeScript, Manifest V3, Tailwind CSS |
| 백엔드 | Java 21, Spring Boot, Gradle, PostgreSQL |
| 인프라 | AWS RDS PostgreSQL |

### 팀 상황

- 팀플 경험이 없는 팀원이 있어 **단순한 구조**가 중요하다.
- 지금 당장은 익스텐션 + 백엔드 두 가지만 개발하지만, 향후 대시보드 웹앱 등 **몸집을 불려나갈 계획**이다.
- 프론트엔드(TypeScript/JS)와 백엔드(Java)가 **다른 생태계**를 사용한다.

---

## 검토한 대안들

### 방안 1. 단순 디렉토리 분리 + 루트 스크립트

```
codit/
├── extension/
├── backend/
└── Makefile
```

별도 도구 없이 `Makefile` 또는 쉘 스크립트로 두 프로젝트를 조율하는 방식이다.

**장점**
- 설정 파일이 거의 없어 팀원 누구나 즉시 이해 가능
- 각 프로젝트의 독립성이 완전히 보장됨

**단점**
- 공유 코드(예: API 응답 타입) 추출이 불가능
- 나중에 대시보드를 추가하거나 구조를 확장할 때 대규모 재편이 필요
- CI 구성 시 수동 작업이 많아짐

---

### 방안 2. pnpm workspaces (JS 영역) + 백엔드 병렬 구조

```
codit/
├── apps/
│   ├── extension/         # 배포되는 앱
│   └── dashboard/         # 추후 추가
├── packages/
│   ├── shared-types/      # 공유 타입 라이브러리
│   └── api-client/        # fetch 래퍼 (추후 추가)
├── backend/               # Spring Boot, workspace 외부
└── pnpm-workspace.yaml
```

JS/TS 패키지들은 pnpm workspace로 묶고, Java 백엔드는 같은 레포 안에 두되 workspace에는 참여시키지 않는 방식이다.

> **"workspace에 참여하지 않는다"는 의미**  
> pnpm workspace의 핵심 기능(패키지 간 `workspace:*` 의존성 링크, `node_modules` 호이스팅)은 `package.json`을 가진 JS 패키지들 사이에서만 동작한다. Java/Gradle 프로젝트는 `package.json`이 없으므로 pnpm이 인식조차 하지 못한다. 같은 레포 안에 있는 폴더일 뿐이고, workspace의 어떤 혜택도 받지 않는다. 이는 단점이 아니라 **의도된 설계**다.

**장점**
- `apps/` vs `packages/` 구분으로 역할이 명확 (앱 vs 라이브러리)
- 공유 타입을 `@codit/shared-types`로 추출해 extension과 향후 dashboard가 함께 사용 가능
- `pnpm --filter @codit/extension dev` 같은 통합 명령어로 팀 경험 통일
- 구조 변경 없이 새 앱/패키지 추가 가능

**단점**
- 방안 1보다 초기 설정 파일이 조금 더 많음 (`pnpm-workspace.yaml`, 루트 `package.json` 등)
- pnpm workspace 개념을 처음 접하는 팀원은 짧은 학습이 필요

---

### 방안 3. Nx 모노레포

```
codit/
├── apps/
│   └── extension/
├── libs/
│   └── shared-types/
├── backend/
└── nx.json
```

빌드 캐싱, 영향받은 프로젝트만 빌드/테스트하는 기능을 제공하는 전문 모노레포 도구다.

**장점**
- 변경된 패키지에만 영향받는 빌드/테스트 실행 (대규모 팀에 유리)
- 프로젝트 의존 그래프 시각화 제공
- 대규모 확장에 최적화

**단점**
- 초기 설정 복잡도가 높아 팀플 경험이 없는 팀원에게 진입장벽
- 현재 프로젝트 규모에서는 명백한 오버스펙
- Java/Spring Boot 플러그인의 성숙도가 낮음

---

## 결정: 방안 2 (apps/packages 구조의 pnpm workspaces)

### 결정 근거

**1. 지금은 단순하고, 나중에도 확장 가능하다**

방안 1처럼 `Makefile` 하나로 시작할 수 있지만, 향후 대시보드를 추가하거나 공유 타입이 생길 때 구조를 갈아엎어야 한다. 방안 2는 처음부터 확장을 위한 자리를 만들어두면서도 지금 당장 복잡하지 않다.

**2. 공유 타입이 반드시 필요해진다**

익스텐션이 백엔드와 통신하는 순간, API 응답 타입(Problem, Attempt, Tag 등)을 프론트에서 직접 정의해야 한다. 이를 `packages/shared-types`로 분리해두면 나중에 대시보드가 추가될 때도 **타입을 복붙하지 않고** 그대로 가져다 쓸 수 있다.

**3. `apps/` vs `packages/` 구분은 표준 컨벤션이다**

Turborepo, Nx 등 주요 모노레포 도구들이 모두 채택한 방식으로, 팀원이 레퍼런스를 찾기 쉽다.

- `apps/` → 최종 사용자에게 배포되는 것
  - `apps/extension/` : Chrome 웹스토어에 올라가는 익스텐션
  - `apps/dashboard/` : (추후) 브라우저에서 접속하는 웹사이트
- `packages/` → 앱들이 가져다 쓰는 내부 라이브러리. 혼자선 실행되거나 배포되지 않음
  - `packages/shared-types/` : Problem, Attempt, Tag 타입 정의. extension이 import해서 쓰는 것

```ts
// apps/extension/src/content.ts
import type { Problem } from '@codit/shared-types' // packages에서 가져옴

const problem: Problem = { ... }
```

나중에 dashboard가 추가되어도 같은 타입을 복붙 없이 재사용할 수 있다.

```
apps/extension/  → import { Problem } from '@codit/shared-types'
apps/dashboard/  → import { Problem } from '@codit/shared-types'
                                              ↑
               packages/shared-types/   한 곳에서 관리, 양쪽에서 재사용
```

**4. backend는 `apps/` 안이 아닌 루트에 둔다**

`apps/backend/`로 두는 안도 검토했다. 기술적으로는 문제없다. pnpm workspace는 `package.json`이 있는 디렉토리만 패키지로 인식하므로, `apps/*`로 설정해도 `package.json`이 없는 Spring Boot 프로젝트는 pnpm이 자동으로 무시한다.

그럼에도 루트에 둔 이유는 **컨벤션과 가독성** 때문이다.

- `apps/`는 JS 모노레포 생태계(Turborepo, Nx 등)에서 JS/TS 앱을 위한 디렉토리로 통용된다.
- `apps/` 안을 보면 "여기는 JS 앱들"이라는 기대가 생기는데, Java 프로젝트가 섞이면 처음 보는 팀원이 어색함을 느낄 수 있다.
- 루트에 `backend/`를 두면 "이건 JS workspace와 다른 생태계"라는 의도가 구조만 봐도 즉시 전달된다.

기술적 제약이 아닌 **의도를 구조로 표현한 선택**이다.

**5. 방안 3은 지금 이 팀에 맞지 않는다**

Nx가 주는 이점(빌드 캐싱, 그래프 시각화)은 패키지가 10개 이상일 때 빛난다. 지금은 익스텐션 하나뿐이다. 팀플 경험이 없는 팀원이 있는 상황에서 Nx의 학습 비용을 추가하는 건 불필요한 부담이다.

---

## 최종 디렉토리 구조

```
codit/
├── apps/
│   ├── extension/                    # WXT + React + TypeScript + Tailwind
│   │   ├── entrypoints/              # content.ts, background.ts
│   │   ├── components/
│   │   ├── assets/
│   │   ├── public/
│   │   ├── .env.example
│   │   ├── package.json              # name: @codit/extension
│   │   ├── tsconfig.json
│   │   └── wxt.config.ts
│   │
│   └── dashboard/                    # 추후 추가 예정
│
├── packages/
│   ├── shared-types/                 # Problem, Attempt, Tag 등 공유 타입
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json              # name: @codit/shared-types
│   │   └── tsconfig.json
│   │
│   └── api-client/                   # 추후 추가 예정 (fetch/axios 래퍼)
│
├── backend/                          # Spring Boot (Gradle, workspace 외부)
│
├── .github/
│   └── workflows/                    # CI 파이프라인
│
├── docs/
│   └── decisions/
│       └── 001-monorepo-structure.md # 이 문서
│
├── .editorconfig
├── .gitignore
├── package.json                      # 루트 workspace 설정 (스크립트 허브)
├── pnpm-workspace.yaml
└── README.md
```

### workspace 설정 (`pnpm-workspace.yaml`)

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  # backend는 Java/Gradle 프로젝트이므로 의도적으로 제외
```

### 패키지 간 의존 관계

```
@codit/extension
    └── depends on → @codit/shared-types (workspace:*)

@codit/dashboard (추후)
    └── depends on → @codit/shared-types (workspace:*)
                  → @codit/api-client (workspace:*)

backend (Spring Boot)
    └── 독립적으로 Gradle 빌드/배포
```

---

## 트레이드오프 요약

| | 방안 1 | **방안 2 (선택)** | 방안 3 |
|---|:---:|:---:|:---:|
| 초기 설정 단순함 | ★★★ | ★★☆ | ★☆☆ |
| 공유 코드 관리 | ✗ | ✓ | ✓ |
| 확장성 | ✗ | ✓ | ✓✓ |
| 팀 진입장벽 | 낮음 | **낮음~중간** | 높음 |
| 현재 규모 적합성 | ✓ | **✓** | ✗ |
