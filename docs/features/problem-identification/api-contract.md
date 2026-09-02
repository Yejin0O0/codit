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
- 팀 내 기존 스펙(담당: 지은, `POST /api/problems`)을 기준으로 재정렬하고, `url` 필드를 추가함. `title`은 이번 이슈 범위에서 제외
