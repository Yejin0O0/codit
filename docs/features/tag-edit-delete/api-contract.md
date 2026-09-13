# tag-edit-delete API Contract

> 이 문서는 익스텐션↔백엔드 API의 단일 기준점이다.
> test-scenarios, tdd-red-backend, tdd-green-backend는 이 문서를 참조한다.

## 엔드포인트 목록

| Method | Path | 역할 |
|--------|------|------|
| PUT    | /api/tags/{id} | 커스텀 태그 이름 수정 |
| DELETE | /api/tags/{id} | 커스텀 태그 삭제 |

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

---

## shared-types 변경 목록

없음. 응답 바디가 기존 `Tag` interface(`{ id, name, category }`)와 동일해 변경이
필요 없다. 요청 바디(`{ name }`)는 `POST /api/tags`의 `CreateTagRequest`도
shared-types에 추가하지 않았던 기존 전례를 그대로 따라 추가하지 않는다.

---

## 에러 코드 전체 목록

| Status | 조건 | 응답 바디 |
|--------|------|-----------|
| 400 | `PUT /api/tags/{id}`의 `name` 누락/빈 값 | `{ "code": "INVALID_REQUEST", "message": "..." }` |
| 403 | `CORE`/카테고리 태그 수정/삭제 시도 | `{ "code": "TAG_NOT_EDITABLE", "message": "..." }` |
| 404 | 존재하지 않는 태그 id | `{ "code": "TAG_NOT_FOUND", "message": "..." }` |
| 409 | 수정 이름이 다른 태그와 충돌 | `{ "code": "TAG_NAME_CONFLICT", "message": "..." }` |
| 409 | 삭제하려는 태그가 기록에 사용 중 | `{ "code": "TAG_IN_USE", "message": "..." }` |

## 인증

두 엔드포인트 모두 `/api/tags/**`가 이미 `permitAll`이라 추가 인증 설정 불필요.
