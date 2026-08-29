---
name: api-contract
description: >
  익스텐션↔백엔드 API 계약을 확정하는 스킬. "/api-contract {이슈번호}", "API 계약 작성",
  "엔드포인트 설계", "shared-types 정의", "요청/응답 형식 확정", "API 스펙 작성" 등의
  요청에 반드시 이 스킬을 사용하세요. prd.md ADR을 읽어 [확정]/[결정 포인트] 형식으로
  API 설계를 제안하고, 개발자 승인 후 api-contract.md와 shared-types 변경 목록을 생성합니다.
---

# API Contract

`docs/features/{기능명}/prd.md`의 ADR을 읽어 익스텐션↔백엔드 API 계약을 확정한다.

[확정] / [결정 포인트] 형식으로 설계를 제안하고, 개발자 승인 후 계약 문서를 생성한다.
계약 문서는 이후 `test-scenarios`, `tdd-red-backend`, `tdd-green-backend`의 단일 참조 기준점이 된다.

```
prd.md ADR
    ↓ 코드베이스 탐색 (기존 엔드포인트·타입 패턴)
    ↓ API 설계 제안 ([확정] / [결정 포인트])
    ↓ [GATE] 개발자 승인
    ↓ 계약 문서 저장
docs/features/{기능명}/api-contract.md
packages/shared-types/ 변경 목록
```

---

## 시작 전: 입력 확인

- **이슈 번호**: `$ARGUMENTS`에서 추출. 없으면 질문한다.
- **기능명 추출**: 이슈 번호로 feature 디렉터리를 자동 탐색한다.
  ```bash
  find docs/features -name "issue-{N}.md" 2>/dev/null
  ```
  찾은 경로에서 feature 디렉터리 이름을 추출한다. 없으면 `docs/features/` 하위 디렉터리 목록을 보여주고 기능명을 직접 묻는다.
- **prd 파일**: `docs/features/{기능명}/prd.md` — 없으면 중단하고 알린다.
- **기존 계약**: `docs/features/{기능명}/api-contract.md`가 이미 있으면 덮어쓸지 확인한다.

---

## 1단계: 컨텍스트 수집

### 1-1. prd.md ADR 읽기

`docs/features/{기능명}/prd.md`에서 추출:

- **ADR**: 데이터 구조, 상태 관리, API 레이어 결정 사항
- **사용자 스토리**: 어떤 행동이 API 호출을 유발하는가
- **Out of Scope**: API에서 다루지 않을 기능

### 1-2. 기존 패턴 탐색

코드베이스에서 기존 API 패턴을 확인한다:

```bash
# 기존 Controller 패턴
ls backend/src/main/java/com/codit/backend/controller/ 2>/dev/null

# 기존 응답 형식
grep -r "ResponseEntity\|ApiResponse\|CommonResponse" \
  backend/src/main/java/com/codit/backend/controller/ --include="*.java" -l 2>/dev/null

# 기존 에러 응답 형식
grep -r "ExceptionHandler\|ControllerAdvice" \
  backend/src/main/java/com/codit/backend/exception/ --include="*.java" 2>/dev/null | head -30

# 기존 shared-types
ls packages/shared-types/src/ 2>/dev/null
```

기존 패턴을 기준으로 새 API를 설계한다. 패턴이 없으면 Spring Boot 관례를 따른다.

---

## 2단계: API 설계 제안

prd.md ADR과 기존 패턴을 바탕으로 API 설계를 제안한다.

설계 항목은 두 가지로 나눠서 제시한다.

**[확정]** — prd.md ADR, 사용자 스토리, 기존 코드 패턴에 의해 이미 결정된 항목.

**[결정 포인트]** — ADR에 명시되지 않았거나 해석의 여지가 있어 개발자 판단이 필요한 항목.
대안 2개 이상과 각각의 트레이드오프를 제시한다.

### 제시 형식

```
### [확정] 항목명

**근거**: 이 설계가 이미 결정된 출처 (prd.md ADR-N / 기존 패턴명 / 사용자 스토리 #N)

{엔드포인트 또는 타입 정의}

---

### [결정 포인트] 항목명

**근거**: 어떤 상황이 이 결정을 필요로 하는가. ADR의 어느 부분이 침묵하고 있는가.

**안 A** (제안):
{정의}

**안 B**:
{정의}

**제안 이유**: 안 A를 제안하는 이유.
**안 B의 단점**: 왜 안 B를 고르지 않는가.
```

### 설계 항목 목록

아래 항목을 순서대로 다룬다. 해당 없으면 건너뛴다.

1. **엔드포인트 목록** — HTTP 메서드, 경로, 역할 한 줄 설명
2. **요청 형식** — Request Body / Query Parameter / Path Variable 타입 정의
3. **응답 형식** — 성공 응답 바디 타입 정의, HTTP 상태 코드
4. **에러 응답** — 각 에러 조건별 HTTP 상태 코드 및 응답 바디
5. **shared-types 변경** — 익스텐션↔백엔드가 공유할 타입 추가/수정 목록

### 엔드포인트 표기 예시

```
### [확정] POST /api/items — 아이템 생성

**근거**: prd.md ADR-1 (백엔드 저장 결정), 사용자 스토리 #2

**Request**
POST /api/items
Content-Type: application/json

{
  "name": string       // 필수, 최대 100자
}

**Response** 201 Created
{
  "id": number,
  "name": string,
  "createdAt": string  // ISO 8601
}

**Error**
400 Bad Request — name이 비어있거나 100자 초과
401 Unauthorized — 인증 없음
409 Conflict — 중복 name
```

### shared-types 표기 예시

```
### [확정] shared-types: CreateItemRequest, ItemResponse

**근거**: 익스텐션과 백엔드가 동일한 타입을 사용해야 함 (prd.md ADR-1)

// packages/shared-types/src/item.ts (신규)
export interface CreateItemRequest {
  name: string;
}

export interface ItemResponse {
  id: number;
  name: string;
  createdAt: string;
}
```

### 결정 포인트 요약

결정 포인트가 있으면 모든 항목 제시 후 마지막에 묶어준다:

```
**답변이 필요한 결정 포인트:**

1. [항목명] — {이 결정이 다루는 상황 한 줄 요약}
   - 안 A (제안): {한 줄 설명}
   - 안 B: {한 줄 설명}

2. ...
```

---

## [GATE] 개발자 승인 대기

설계 제안 후 **개발자가 결정 포인트에 답변하고 "확정"을 줄 때까지 기다린다.**

승인 전에 파일 저장이나 코드 작성으로 넘어가지 않는다.

---

## 3단계: api-contract.md 저장

승인된 설계를 `docs/features/{기능명}/api-contract.md`에 저장한다.

```markdown
# {기능명} API Contract

> 이 문서는 익스텐션↔백엔드 API의 단일 기준점이다.
> test-scenarios, tdd-red-backend, tdd-green-backend는 이 문서를 참조한다.

## 엔드포인트 목록

| Method | Path | 역할 |
|--------|------|------|
| POST   | /api/... | ... |

---

## 요청/응답 명세

### {엔드포인트 이름}

**Request**
...

**Response**
...

**Error**
| 조건 | Status | Body |
|------|--------|------|
| ...  | 400    | ...  |

---

## shared-types 변경 목록

### 신규 추가

- `packages/shared-types/src/{파일}.ts`
  ```typescript
  ...
  ```

### 수정

- `packages/shared-types/src/{파일}.ts` — {변경 사유}
  ```typescript
  // Before
  ...
  // After
  ...
  ```

### 삭제 (없으면 섹션 생략)

- ...

---

## 에러 코드 전체 목록

| Status | 조건 | 응답 바디 |
|--------|------|-----------|
| 400    | ...  | ...       |
| 401    | ...  | ...       |
| 409    | ...  | ...       |
```

---

## 4단계: 결과 보고

```
API Contract 완료 — {기능명}
파일: docs/features/{기능명}/api-contract.md

엔드포인트 (N개)
  POST /api/...  — {역할}
  GET  /api/...  — {역할}

shared-types 변경 (N개)
  신규: packages/shared-types/src/{파일}.ts
  수정: packages/shared-types/src/{파일}.ts

다음 단계: /test-scenarios {이슈번호}
```

---

## 제약

- `prd.md`가 없으면 중단하고 알린다.
- ADR에 명시된 결정을 뒤집는 설계를 임의로 제안하지 않는다.
- Out of Scope 항목은 API 설계에 포함하지 않는다.
- 결정 포인트 없이 임의로 선택하지 않는다 — 반드시 개발자 승인 후 저장한다.
- `shared-types` 변경은 목록만 제시한다. 실제 파일 작성은 `tdd-red` 단계에서 한다.
- 기존 Controller/응답 패턴과 불일치하는 설계는 그 이유를 명시한다.
