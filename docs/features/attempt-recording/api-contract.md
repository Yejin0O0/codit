# attempt-recording API Contract

> 이 문서는 익스텐션↔백엔드 API의 단일 기준점이다.
> test-scenarios, tdd-red-backend, tdd-green-backend는 이 문서를 참조한다.

## 엔드포인트 목록

| Method | Path | 역할 |
|--------|------|------|
| POST   | `/api/attempts` | 풀이 결과(결과·메모·태그·소요시간) 저장 |

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
  ```

> 실제 파일 작성은 tdd-red 단계에서 한다.
> 참고: 같은 파일의 `Problem` interface도 실제 백엔드 계약과 어긋나 있으나(`title`/`number`/`difficulty` 등) 이 이슈 범위 밖이라 수정하지 않는다.

---

## 에러 코드 전체 목록

| Status | 조건 | 응답 바디 |
|--------|------|-----------|
| 400 | `problemId` / `elapsedTime` / `result` / `tagIds` 형식·필수 위반, 존재하지 않는 `tagId`, 요청 본문 타입 불일치·깨진 JSON | `{ "code": "INVALID_REQUEST", "message": "..." }` |
| 401 | 유효한 인증 토큰 없음 | `{ "code": "UNAUTHENTICATED", "message": "..." }` |

## 인증

- `POST /api/attempts`는 인증 필수다. `SecurityConfig`의 `anyRequest().authenticated()`에
  따라 자동 적용되므로 `SecurityConfig` 수정이 필요 없다 (`/api/attempts/**`를 permitAll에
  추가하지 않는다).
- 컨트롤러는 `@AuthenticationPrincipal Long userId`로 사용자 id를 받는다
  (develop `UserController.getMyInfo` 동일 패턴).

## 의존

- **이슈 #40 / PR #41 (tag-catalog)** — `Tag` 엔티티·`TagRepository`가 develop에 있어야
  `@ManyToMany` 매핑과 `tagId` 실재 검증이 가능하다. tdd-red까지는 이 계약 기준으로
  선행 가능하나 tdd-green은 `feature/tag-catalog`의 develop 병합 이후 시작한다.
