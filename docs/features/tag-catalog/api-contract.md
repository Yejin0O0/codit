# tag-catalog API Contract

> 이 문서는 익스텐션↔백엔드 API의 단일 기준점이다.
> test-scenarios, tdd-red-backend, tdd-green-backend는 이 문서를 참조한다.

## 엔드포인트 목록

| Method | Path | 역할 |
|--------|------|------|
| GET    | /api/tags | 전체 태그 목록 조회 |
| POST   | /api/tags | 커스텀 태그 upsert 생성 |

---

## 요청/응답 명세

### GET /api/tags — 전체 태그 목록 조회

**Request**
```
GET /api/tags
```
쿼리 파라미터 없음.

**Response** 200 OK
```json
[
  { "id": 1, "name": "구현", "category": "CORE" },
  { "id": 6, "name": "DFS", "category": "CORE" },
  { "id": 12, "name": "연결 리스트", "category": "자료구조" }
]
```

### POST /api/tags — 커스텀 태그 upsert 생성

**Request**
```
POST /api/tags
Content-Type: application/json

{ "name": "이분 그래프" }
```

**Response** 201 Created (신규 생성 — 이전에 없던 이름)
```json
{ "id": 26, "name": "이분 그래프", "category": "CUSTOM" }
```

**Response** 200 OK (기존 태그 재사용 — trim + 대소문자 무시로 매칭. CORE/카테고리
태그와도 매칭됨. 예: `"dfs"`, `" DFS "` → 기존 `"DFS"` 태그 반환)
```json
{ "id": 6, "name": "DFS", "category": "CORE" }
```

**Error**
| 조건 | Status | Body |
|------|--------|------|
| `name`이 없거나 빈 문자열/공백만 있음 | 400 | `{ "code": "INVALID_REQUEST", "message": "name은 필수입니다." }` |

동시 생성 요청으로 인한 DB unique 제약 위반은 클라이언트에 에러로 노출하지 않는다.
Service가 내부적으로 재조회해 기존 태그를 반환한다 (ADR-1). 별도 409 응답 없음.

---

## shared-types 변경 목록

### 수정

- `packages/shared-types/src/index.ts` — `Tag` interface를 백엔드 계약에 맞게 갱신
  ```typescript
  // Before
  export interface Tag {
    id: string;
    name: string;
  }

  // After
  export interface Tag {
    id: number;
    name: string;
    category: string;
  }
  ```

> 참고: 같은 파일의 `Problem`/`Attempt` interface도 실제 백엔드 계약과 어긋나 있으나
> (예: `Problem`에 없는 `title`/`number`/`difficulty` 필드), 이 이슈 범위 밖이라
> 수정하지 않는다.

---

## 에러 코드 전체 목록

| Status | 조건 | 응답 바디 |
|--------|------|-----------|
| 400 | `POST /api/tags`의 `name` 누락/빈 값 | `{ "code": "INVALID_REQUEST", "message": "..." }` |

## 인증

두 엔드포인트 모두 인증 불필요 (`SecurityConfig.java`에 `/api/tags/**` permitAll 추가 필요).
