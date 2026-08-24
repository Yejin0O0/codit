# Codit

SWEA 문제 풀이 통계 및 오답노트 Chrome 익스텐션

## 프로젝트 구조

```
codit/
├── apps/
│   └── extension/       # Chrome 익스텐션 (WXT + React + TypeScript)
├── packages/
│   └── shared-types/    # 공유 타입 정의 (Problem, Attempt, Tag…)
├── backend/             # Spring Boot API 서버
└── docs/decisions/      # 구조 결정 문서 (ADR)
```

## 시작하기

### 사전 요구사항

- Node.js 20+
- pnpm 9+
- Java 21
- Docker (로컬 DB)

### 설치

```bash
pnpm install
```

### 개발

```bash
# 익스텐션 개발 서버
pnpm dev:ext

# 백엔드
cd backend && ./gradlew bootRun
```

## 기술 스택

| 영역 | 기술 |
|---|---|
| 익스텐션 | WXT, React, TypeScript, Tailwind CSS |
| 공유 타입 | TypeScript |
| 백엔드 | Java 21, Spring Boot, Gradle |
| DB | PostgreSQL (AWS RDS) |
