# attempt-recording API Contract

> 이 문서는 익스텐션↔백엔드 API의 단일 기준점이다.
> test-scenarios, tdd-red-backend, tdd-green-backend는 이 문서를 참조한다.

## 엔드포인트 목록

| Method | Path | 역할 |
|--------|------|------|
| POST   | `/api/attempts` | 풀이 결과(결과·메모·태그·소요시간) 저장 |
| GET    | `/api/attempts` | 로그인 유저의 문제별 풀이 이력 **목록** (문제당 1행으로 집계) |
| GET    | `/api/attempts/{problemId}` | 특정 문제의 **회차별 시도 상세** |

---

## 요청/응답 명세

### POST /api/attempts — 풀이 결과 저장

문제 풀이를 마친 사용자가 "저장/확정" 시 호출한다. 인증 필수(`SecurityConfig` 기본 정책).
`userId`는 요청 바디가 아니라 JWT `subject`에서 추출한다(prd.md ADR-4).

**Request**
```
POST /api/attempts
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "problemId":   string,          // 필수, SWEA contestProbId. 공백 불가
  "elapsedTime": number,          // 필수, 초 단위. 0 이상
  "result":      string,          // 필수. "CORRECT" | "WRONG" | "HOLD" 중 하나
  "tagIds":      number[],        // 필수. 1개 이상. tag 테이블의 id (이슈 #40)
  "memo":        string | null    // 선택. 미작성 시 null
}
```

> `result`는 문자열로 받는다(안 A). Service에서 `AttemptResult` enum으로 변환하며
> 검증해, 허용값이 아니면 `{ code, message }` 400을 보장한다. enum 직접 바인딩 시
> Jackson 역직렬화 실패로 Spring 기본 에러 형식이 노출되는 것을 피한다.

**Response** `201 Created`
```json
{
  "id": 101,
  "problemId": "AZ8R8haaeYnHBITH",
  "elapsedTime": 342,
  "result": "WRONG",
  "tags": [
    { "id": 6, "name": "DFS", "category": "CORE" },
    { "id": 4, "name": "그리디", "category": "CORE" }
  ],
  "memo": "그리디로 접근했는데 반례 존재, DP로 다시 풀어야 함",
  "createdAt": "2026-09-05T10:22:31Z"
}
```

- `userId`는 응답에 포함하지 않는다(안 A). 요청자 본인에게 돌아가는 응답이라 불필요.
- `tags`는 저장된 태그의 전체 정보(`id`, `name`, `category`)를 반환한다(안 A). FE가 저장 결과를 바로 표시할 수 있게 한다.
- `createdAt`은 ISO 8601 (UTC).

**Error**

| 조건 | Status | Body |
|------|--------|------|
| `problemId` 누락 / 공백만 | 400 | `{ "code": "INVALID_REQUEST", "message": "problemId는 필수입니다." }` |
| `elapsedTime` 누락 / 음수 | 400 | `{ "code": "INVALID_REQUEST", "message": "elapsedTime은 0 이상이어야 합니다." }` |
| `result` 누락 / `CORRECT`·`WRONG`·`HOLD` 외의 값 | 400 | `{ "code": "INVALID_REQUEST", "message": "result는 CORRECT, WRONG, HOLD 중 하나여야 합니다." }` |
| `tagIds` 누락 / 빈 배열 | 400 | `{ "code": "INVALID_REQUEST", "message": "태그를 1개 이상 선택해야 합니다." }` |
| `tagIds`에 `null` 원소 포함 (예: `[6, null]`) | 400 | `{ "code": "INVALID_REQUEST", "message": "..." }` |
| `tagIds`에 `tag` 테이블에 없는 id 포함 | 400 | `{ "code": "INVALID_REQUEST", "message": "존재하지 않는 태그가 포함되어 있습니다." }` (부분 저장 없음) |
| 요청 본문 타입 불일치 / 깨진 JSON (예: `"elapsedTime": "abc"`, `"tagIds": [true]`) | 400 | `{ "code": "INVALID_REQUEST", "message": "요청 형식이 올바르지 않습니다." }` (`HttpMessageNotReadableException` 핸들러) |
| 유효한 인증 토큰 없음 (없음/위조/만료) | 401 | `{ "code": "UNAUTHENTICATED", "message": "..." }` (`JwtAuthenticationFilter` + `JwtAuthenticationEntryPoint` 자동) |

메시지 문구는 구현 시 조정 가능. `code`와 상태코드는 계약이다.

### 검증 위치

`problemId` / `elapsedTime` / `result` / `tagIds` 형식·필수 검증은 `AttemptService`에서
수동으로 수행하고 `InvalidRequestException`을 던진다(지은 `ProblemService` 패턴과 동일).
`tagIds` 실재 검증은 `tagRepository.findAllById(tagIds)` 결과 개수를 요청 개수와 비교한다.
`GlobalExceptionHandler`가 `InvalidRequestException` → `400 { code: "INVALID_REQUEST" }`로 변환한다(develop 기존 핸들러).

컨트롤러 메서드 진입 전 Jackson 역직렬화가 실패하는 경우(`elapsedTime`·`tagIds` 타입 불일치, 깨진 JSON)는
`AttemptService` 검증까지 도달하지 못하므로, `GlobalExceptionHandler`에 `HttpMessageNotReadableException`
핸들러를 추가해 동일하게 `400 { code: "INVALID_REQUEST" }`를 보장한다(모든 엔드포인트 공통 적용).

---

### GET /api/attempts — 풀이 이력 목록 (#88, ADR-5)

익스텐션 페이지의 "내 문제풀이" 화면(#91)이 진입 시 호출한다. 인증 필수.
본인이 저장한 `attempt`만 대상이며, `problemId`별로 묶어 문제당 1행으로 반환한다.

**Request**
```
GET /api/attempts
Authorization: Bearer <accessToken>
```
쿼리 파라미터 없음(페이지네이션·필터는 FE가 클라이언트에서 처리, `spec-current.md` 참고).

**Response** `200 OK`
```json
[
  {
    "problemId": "AZ8R8haaeYnHBITH",
    "latestResult": "CORRECT",
    "attemptCount": 3,
    "latestElapsedTime": 754,
    "latestSolvedAt": "2026-09-15T04:12:00Z",
    "tags": [
      { "id": 6, "name": "DFS", "category": "CORE" },
      { "id": 4, "name": "그리디", "category": "CORE" }
    ]
  }
]
```

- 문제당 1행. `latestResult`/`latestElapsedTime`/`latestSolvedAt`은 그 문제의 attempt 중
  `createdAt`이 가장 최근인 것 기준(ADR-5 Product Rule).
- `tags`는 그 문제에 속한 모든 attempt의 태그 합집합(id 기준 unique). `POST /api/attempts`
  응답과 동일하게 전체 객체(`id`/`name`/`category`)로 반환한다(안 A, ADR-5).
- `title` 필드는 포함하지 않는다 — `Problem` 엔티티에 `title`이 없다(ADR-3). FE의 `title?`은
  optional이라 문제없다.
- 목록 정렬은 `latestSolvedAt` 내림차순(최근 푼 문제가 먼저).
- 기록이 하나도 없으면 `200 []` (404 아님).

**Error**

| 조건 | Status | Body |
|------|--------|------|
| 유효한 인증 토큰 없음 | 401 | `{ "code": "UNAUTHENTICATED", "message": "..." }` |

---

### GET /api/attempts/{problemId} — 문제별 시도 상세 (#88, ADR-5)

히스토리 목록에서 문제 카드를 클릭했을 때 호출한다(#91). 인증 필수.
`{problemId}`는 Attempt의 PK가 아니라 **문제 비즈니스 id 문자열**이다 (`POST /api/attempts`
요청의 `problemId`와 동일한 값).

**Request**
```
GET /api/attempts/AZ8R8haaeYnHBITH
Authorization: Bearer <accessToken>
```

**Response** `200 OK`
```json
{
  "problemId": "AZ8R8haaeYnHBITH",
  "latestResult": "CORRECT",
  "attemptCount": 3,
  "tags": [
    { "id": 6, "name": "DFS", "category": "CORE" }
  ],
  "attempts": [
    { "seq": 3, "result": "CORRECT", "elapsedTime": 754, "tags": [{ "id": 6, "name": "DFS", "category": "CORE" }], "memo": null, "createdAt": "2026-09-15T04:12:00Z" },
    { "seq": 2, "result": "WRONG", "elapsedTime": 1201, "tags": [], "memo": "그리디로 접근했는데 반례 존재", "createdAt": "2026-09-14T09:00:00Z" },
    { "seq": 1, "result": "WRONG", "elapsedTime": 944, "tags": [], "memo": null, "createdAt": "2026-09-13T08:00:00Z" }
  ]
}
```

- `seq`는 그 문제 안에서 시도 순번(1부터, `createdAt` 오름차순 부여).
- `attempts`는 최신순(seq 내림차순)으로 정렬해서 반환한다 — FE(`AttemptTimeline`)가 다시
  정렬하지 않아도 된다.
- 각 시도의 `tags`/`elapsedTime`/`createdAt` 필드명은 `POST /api/attempts` 응답과 동일.

**Error**

| 조건 | Status | Body |
|------|--------|------|
| 본인이 시도한 적 없는(또는 존재하지 않는) `problemId` | 404 | `{ "code": "ATTEMPT_NOT_FOUND", "message": "..." }` |
| 유효한 인증 토큰 없음 | 401 | `{ "code": "UNAUTHENTICATED", "message": "..." }` |

---

## shared-types 변경 목록

### 삭제

- `packages/shared-types/src/index.ts` — 기존 `Attempt` interface 제거
  ```typescript
  // Before (구버전 — language, submittedAt, TIMEOUT/COMPILE_ERROR)
  export interface Attempt {
    id: string;
    problemId: string;
    submittedAt: string;
    result: 'CORRECT' | 'WRONG' | 'TIMEOUT' | 'COMPILE_ERROR';
    language: string;
    memo?: string;
  }
  ```

### 신규 추가

- `packages/shared-types/src/index.ts`
  ```typescript
  export interface CreateAttemptRequest {
    problemId: string;
    elapsedTime: number;
    result: 'CORRECT' | 'WRONG' | 'HOLD';
    tagIds: number[];
    memo?: string | null;
  }

  export interface AttemptResponse {
    id: number;
    problemId: string;
    elapsedTime: number;
    result: 'CORRECT' | 'WRONG' | 'HOLD';
    tags: { id: number; name: string; category: string }[];
    memo: string | null;
    createdAt: string;
  }

  // #88 / ADR-5 — GET /api/attempts, GET /api/attempts/{problemId}
  export interface AttemptHistoryListItem {
    problemId: string;
    latestResult: 'CORRECT' | 'WRONG' | 'HOLD';
    attemptCount: number;
    latestElapsedTime: number;
    latestSolvedAt: string;
    tags: { id: number; name: string; category: string }[];
  }

  export interface AttemptHistoryItem {
    seq: number;
    result: 'CORRECT' | 'WRONG' | 'HOLD';
    elapsedTime: number;
    tags: { id: number; name: string; category: string }[];
    memo: string | null;
    createdAt: string;
  }

  export interface AttemptHistoryDetail {
    problemId: string;
    latestResult: 'CORRECT' | 'WRONG' | 'HOLD';
    attemptCount: number;
    tags: { id: number; name: string; category: string }[];
    attempts: AttemptHistoryItem[];
  }
  ```

> 실제 파일 작성은 tdd-red 단계에서 한다.
> 참고: 같은 파일의 `Problem` interface도 실제 백엔드 계약과 어긋나 있으나(`title`/`number`/`difficulty` 등) 이 이슈 범위 밖이라 수정하지 않는다.
> 참고: `entrypoints/page/history/types.ts`(FE feature-local mock 타입)의 `tagIds: string[]` /
> `durationSeconds` / `recordedAt`은 위 타입과 이름·형태가 다르다. #91에서 FE가 매핑한다(ADR-5).

---

## 에러 코드 전체 목록

| Status | 조건 | 응답 바디 |
|--------|------|-----------|
| 400 | `problemId` / `elapsedTime` / `result` / `tagIds` 형식·필수 위반, 존재하지 않는 `tagId`, 요청 본문 타입 불일치·깨진 JSON | `{ "code": "INVALID_REQUEST", "message": "..." }` |
| 401 | 유효한 인증 토큰 없음 | `{ "code": "UNAUTHENTICATED", "message": "..." }` |
| 404 | `GET /api/attempts/{problemId}` — 본인이 시도한 적 없는 `problemId` | `{ "code": "ATTEMPT_NOT_FOUND", "message": "..." }` |

## 인증

- `/api/attempts`(`POST`/`GET` 모두)는 인증 필수다. `SecurityConfig`의
  `anyRequest().authenticated()`에 따라 자동 적용되므로 `SecurityConfig` 수정이 필요 없다
  (`/api/attempts/**`를 permitAll에 추가하지 않는다).
- 컨트롤러는 `@AuthenticationPrincipal Long userId`로 사용자 id를 받는다
  (develop `UserController.getMyInfo` 동일 패턴). `GET` 두 엔드포인트 모두 본인
  `userId`로만 조회하고, 다른 유저의 attempt는 응답에 포함하지 않는다.

## 의존

- **이슈 #40 / PR #41 (tag-catalog)** — `Tag` 엔티티·`TagRepository`가 develop에 있어야
  `@ManyToMany` 매핑과 `tagId` 실재 검증이 가능하다. tdd-red까지는 이 계약 기준으로
  선행 가능하나 tdd-green은 `feature/tag-catalog`의 develop 병합 이후 시작한다.
- **이슈 #88의 소비처는 이슈 #91(예진, 히스토리 FE 연동)** — `GET /api/attempts`,
  `GET /api/attempts/{problemId}`가 develop에 머지된 뒤 #91이 이 계약 기준으로 시작한다.
