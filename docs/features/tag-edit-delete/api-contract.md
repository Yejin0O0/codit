# tag-edit-delete API Contract

> 이 문서는 익스텐션↔백엔드 API의 단일 기준점이다.
> test-scenarios, tdd-red-backend, tdd-green-backend는 이 문서를 참조한다.
> 이슈 #93(태그 카탈로그 CRUD)과 이슈 #94(기록 태그 교체)의 계약을 함께 담는다.

## 엔드포인트 목록

| Method | Path | 역할 |
|--------|------|------|
| PUT    | /api/tags/{id} | 커스텀 태그 이름 수정 |
| DELETE | /api/tags/{id} | 커스텀 태그 삭제 |
| PUT    | /api/attempts/{id}/tags | 기록에 연결된 태그 목록 전체 교체 |

---

## 요청/응답 명세

### PUT /api/tags/{id} — 커스텀 태그 이름 수정

**Request**
```
PUT /api/tags/{id}
Content-Type: application/json

{ "name": "이분 그래프" }
```

**Response** 200 OK
```json
{ "id": 26, "name": "이분 그래프", "category": "CUSTOM" }
```

**Error**
| 조건 | Status | Body |
|------|--------|------|
| `name`이 없거나 공백만 있음 | 400 | `{ "code": "INVALID_REQUEST", "message": "name은 필수입니다." }` |
| 태그 id가 존재하지 않음 | 404 | `{ "code": "TAG_NOT_FOUND", "message": "태그를 찾을 수 없습니다" }` |
| `CORE`/카테고리 태그를 수정하려 함 | 403 | `{ "code": "TAG_NOT_EDITABLE", "message": "CORE/카테고리 태그는 수정하거나 삭제할 수 없습니다" }` |
| 정규화된 이름이 다른 태그와 겹침 | 409 | `{ "code": "TAG_NAME_CONFLICT", "message": "이미 존재하는 태그 이름입니다" }` |

### DELETE /api/tags/{id} — 커스텀 태그 삭제

**Request**
```
DELETE /api/tags/{id}
```
바디 없음.

**Response** 204 No Content — 바디 없음

**Error**
| 조건 | Status | Body |
|------|--------|------|
| 태그 id가 존재하지 않음 | 404 | `{ "code": "TAG_NOT_FOUND", "message": "태그를 찾을 수 없습니다" }` |
| `CORE`/카테고리 태그를 삭제하려 함 | 403 | `{ "code": "TAG_NOT_EDITABLE", "message": "CORE/카테고리 태그는 수정하거나 삭제할 수 없습니다" }` |
| 하나 이상의 기록에 연결돼 있음 | 409 | `{ "code": "TAG_IN_USE", "message": "이 태그는 기록에 사용 중입니다" }` |

### PUT /api/attempts/{id}/tags — 기록의 태그 전체 교체

**Request**
```
PUT /api/attempts/{id}/tags
Authorization: Bearer {accessToken}
Content-Type: application/json

{ "tagIds": [4, 6, 26] }
```

**Response** 200 OK — 기존 `AttemptResponse` 재사용
```json
{
  "id": 10,
  "problemId": "AZ8R8haaeYnHBITH",
  "elapsedTime": 342,
  "result": "CORRECT",
  "tags": [
    { "id": 4, "name": "구현", "category": "CORE" },
    { "id": 6, "name": "DFS", "category": "CORE" },
    { "id": 26, "name": "이분 그래프", "category": "CUSTOM" }
  ],
  "memo": null,
  "createdAt": "2026-09-13T05:00:00Z"
}
```

**Error**
| 조건 | Status | Body |
|------|--------|------|
| `tagIds`가 빈 배열이거나 결과가 0개 | 409 | `{ "code": "MIN_TAG_REQUIRED", "message": "기록에는 최소 1개의 태그가 필요합니다" }` |
| attempt id가 없거나 본인 소유가 아님 (구분 없음) | 404 | `{ "code": "ATTEMPT_NOT_FOUND", "message": "기록을 찾을 수 없습니다" }` |
| `tagIds`에 존재하지 않는 태그 id 포함 | 400 | `{ "code": "INVALID_REQUEST", "message": "존재하지 않는 태그가 포함되어 있습니다." }` |

---

## shared-types 변경 목록

`PUT /api/tags/{id}` 응답 바디는 기존 `Tag` interface(`{ id, name, category }`)와
동일해 변경이 필요 없다. 요청 바디(`{ name }`)는 `POST /api/tags`의
`CreateTagRequest`도 shared-types에 추가하지 않았던 기존 전례를 그대로 따라
추가하지 않는다.

### 신규 추가

- `packages/shared-types/src/index.ts`
  ```typescript
  /** PUT /api/attempts/{id}/tags 요청 본문. 전체 교체 방식 — 최종 선택된 tagIds 전체를 보낸다. */
  export interface ReplaceAttemptTagsRequest {
    tagIds: number[];
  }
  ```

`PUT /api/attempts/{id}/tags`의 응답은 기존 `AttemptResponse`를 그대로 재사용하므로
별도 타입 추가 없음.

---

## 에러 코드 전체 목록

| Status | 조건 | 응답 바디 |
|--------|------|-----------|
| 400 | `PUT /api/tags/{id}`의 `name` 누락/빈 값 | `{ "code": "INVALID_REQUEST", "message": "..." }` |
| 400 | `tagIds`에 존재하지 않는 태그 id 포함 | `{ "code": "INVALID_REQUEST", "message": "..." }` |
| 403 | `CORE`/카테고리 태그 수정/삭제 시도 | `{ "code": "TAG_NOT_EDITABLE", "message": "..." }` |
| 404 | 존재하지 않는 태그 id | `{ "code": "TAG_NOT_FOUND", "message": "..." }` |
| 404 | attempt id 없음 또는 본인 소유 아님 | `{ "code": "ATTEMPT_NOT_FOUND", "message": "..." }` |
| 409 | 수정 이름이 다른 태그와 충돌 | `{ "code": "TAG_NAME_CONFLICT", "message": "..." }` |
| 409 | 삭제하려는 태그가 기록에 사용 중 | `{ "code": "TAG_IN_USE", "message": "..." }` |
| 409 | 결과 태그가 0개가 되는 요청 | `{ "code": "MIN_TAG_REQUIRED", "message": "..." }` |

## 인증

`PUT/DELETE /api/tags/{id}`는 `/api/tags/**`가 이미 `permitAll`이라 추가 인증
설정 불필요. `PUT /api/attempts/{id}/tags`는 `@AuthenticationPrincipal Long userId`
— 기존 `POST /api/attempts`와 동일한 JWT 인증 필요.
