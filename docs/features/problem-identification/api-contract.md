# problem-identification API Contract

> 이 문서는 익스텐션↔백엔드 API의 단일 기준점이다.
> test-scenarios, tdd-red-backend, tdd-green-backend는 이 문서를 참조한다.

## 엔드포인트 목록

| Method | Path | 역할 |
|--------|------|------|
| POST   | `/api/problems` | 문제 식별 및 등록 (Upsert) |

---

## 요청/응답 명세

### POST /api/problems — 문제 식별 및 등록 (Upsert)

SWEA 문제 페이지 진입 시 URL에서 파싱한 `problemId`(=SWEA `contestProbId`)로 문제를 조회하고, 존재하지 않으면 새로 생성한다. 인증 불필요 — `Problem`은 특정 사용자에 속하지 않는 공개 마스터 데이터다.

**Request**
```
POST /api/problems
Content-Type: application/json

{
  "problemId": string,   // 필수, SWEA URL의 contestProbId
  "url": string           // 필수, 문제 상세 페이지 URL
}
```

**Response** `200 OK` (이미 존재하는 문제)
```json
{ "id": 12, "problemId": "AZ8R8haaeYnHBITH", "url": "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=AZ8R8haaeYnHBITH" }
```

**Response** `201 Created` (신규 생성)
```json
{ "id": 13, "problemId": "AZ8R8haaeYnHBITH", "url": "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=AZ8R8haaeYnHBITH", "createdAt": "2026-08-26T10:00:00Z" }
```

**Error**
| 조건 | Status | Body |
|------|--------|------|
| `problemId` 또는 `url` 누락 | 400 | `{ "code": "INVALID_REQUEST", "message": "..." }` |

---

## shared-types 변경 목록

### 신규 추가

- `packages/shared-types/src/index.ts`
  ```typescript
  export interface IdentifyProblemRequest {
    problemId: string;
    url: string;
  }

  export interface ProblemResponse {
    id: number;
    problemId: string;
    url: string;
    createdAt?: string; // 201 응답에만 포함
  }
  ```

### 수정

없음

### 삭제

없음

---

## 에러 코드 전체 목록

| Status | 조건 | 응답 바디 |
|--------|------|-----------|
| 400    | `problemId` 또는 `url` 누락 | `{ "code": "INVALID_REQUEST", "message": "..." }` |

---

## 설계 변경 이력

- 최초 제안: `Problem`(마스터) + `ProblemIdentification`(사용자별 방문 로그) 분리, JWT 인증 필요 — 사용자별 통계를 위해 "누가 언제 봤는지" 기록이 필요하다고 판단했음
- **변경**: 사용자별 활동 기록은 향후 `Attempt`(실제 풀이 기록) 이슈가 담당하기로 결정. "문제 식별"은 `Problem` 마스터 데이터 upsert만 담당 — 인증도, 방문 로그도 불필요해짐
- 엔드포인트(`POST /api/problems`)와 upsert 패턴은 팀 기존 스펙(담당: 지은)을 따르되, 필드 구성은 지은님 원본 명세와 다르게 확정함. 지은님 명세의 "팀 확정 필요 항목 #2"(`title` 파싱 필요 여부)에 대한 답으로 두 필드를 재검토함:
  - **`title` 제외**: 이번 이슈에서 DOM 파싱을 구현하지 않기로 확정(Out of Scope). 지은님 명세에서도 선택 필드였고, 파싱 로직이 없으면 항상 `null`이라 의미가 없어 아예 필드에서 뺌
  - **`url` 필수 추가** (지은님 원본 명세엔 없던 필드): SWEA 문제 진입 경로가 여러 개다 — 스터디 박스 경유(`.../talk/solvingClub/problemView.do?...&contestProbId=...`), 일반 목록 경유(`.../code/problem/problemDetail.do?contestProbId=...`) 등 — 경로마다 붙는 쿼리 파라미터는 다르지만 `contestProbId`는 공통으로 존재함을 확인함. 이 `contestProbId`를 기준으로 정규화된 기본 문제 상세 페이지 URL을 만들어 저장해두면, 어느 경로로 들어왔든 이후 기능(예: 문제 페이지 바로가기)에서 동일한 URL로 이동할 수 있음
