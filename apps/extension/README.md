# Codit

> 개발자의 성장과 생산성을 돕는 Chrome Extension 서비스

---

# Project Overview

Codit은 Chrome Extension 기반 개발 생산성 도구입니다.

사용자의 개발 환경과 작업 흐름을 분석하고,
개발 과정에서 필요한 정보와 기능을 제공하는 것을 목표로 합니다.

---

# Frontend Environment

Codit Frontend는 Chrome Extension 개발을 위해
WXT + React + TypeScript 기반으로 구성되어 있습니다.

## Tech Stack

### Extension Framework

- WXT
- Chrome Extension Manifest V3

### Frontend

- React 19
- TypeScript

### Styling

- Tailwind CSS

### Code Quality

- ESLint
- Prettier

### Package Management

- pnpm Workspace

---

# Frontend Structure

```text
apps
└── extension

    ├── entrypoints
    │
    │   ├── background.ts
    │   │
    │   ├── content
    │   │   ├── index.tsx
    │   │   ├── App.tsx
    │   │   └── style.css
    │   │
    │   └── popup
    │       ├── main.tsx
    │       ├── App.tsx
    │       └── style.css
    │
    ├── eslint.config.js
    ├── prettier.config.js
    ├── package.json
    └── wxt.config.ts
```

---

# Development Setup

## Install

프로젝트 루트에서 실행합니다.

```bash
pnpm install
```

---

## Run Frontend Extension

```bash
pnpm dev:ext
```

또는:

```bash
cd apps/extension

pnpm dev
```

---

## Build

```bash
pnpm --filter @codit/extension build
```

빌드 결과:

```text
apps/extension/.output
```

---

# Code Quality

## ESLint

코드 품질 검사를 실행합니다.

검사 항목:

- TypeScript 규칙
- React Hook 규칙
- Import 관리
- Unused Import 검사


실행:

```bash
pnpm --filter @codit/extension lint
```

---

## Prettier

코드 스타일을 통일합니다.

적용 규칙:

- 4 spaces indentation
- Single Quote
- Semicolon
- Trailing Comma


실행:

```bash
pnpm --filter @codit/extension format
```

검사:

```bash
pnpm --filter @codit/extension format:check
```

---

# Type Check

전체 Workspace TypeScript 검사를 실행합니다.

```bash
pnpm typecheck
```

검사 대상:

- apps/extension
- packages/shared-types

---

# Development Workflow

기능 개발 후 Commit 전 실행:

```bash
pnpm lint

pnpm typecheck

pnpm build
```

---

# Commit Convention

| Prefix | Description |
| --- | --- |
| feat | 기능 추가 |
| fix | 버그 수정 |
| chore | 환경 설정 |
| docs | 문서 수정 |
| refactor | 코드 개선 |


Example:

```bash
feat: add content analysis panel
```

```bash
chore: setup frontend environment
```

```bash
docs: update frontend guide
```

---

# Monorepo Structure

```text
codit

├── apps
│   └── extension
│
├── packages
│   └── shared-types
│
└── backend
```

각 영역:

| Folder | Responsibility |
|---|---|
| apps/extension | Chrome Extension Frontend |
| packages/shared-types | Shared Type Definition |
| backend | Spring Boot API Server |

---

# Development Rule

- Component는 하나의 책임만 가진다.
- 기능별 Component 분리를 유지한다.
- Commit 전 코드 품질 검사를 실행한다.
- 공통 타입은 shared-types를 사용한다.