# tag-edit-delete API Contract — Issue 94

> 이 문서는 익스텐션↔백엔드 API의 단일 기준점이다.
> test-scenarios, tdd-red-backend, tdd-green-backend는 이 문서를 참조한다.
> 이슈 #93(태그 카탈로그 CRUD)의 계약은 별도 브랜치(`feat/태그-카탈로그-수정-삭제-api`)에
> 있으며, 이 문서는 이슈 #94(기록 태그 교체) 전용이다. 두 계약은 `feature/tag-edit-delete`
> 병합 시 합쳐진다.

## 엔드포인트 목록

| Method | Path | 역할 |
|--------|------|------|
| PUT    | /api/attempts/{id}/tags | 기록에 연결된 태그 목록 전체 교체 |

---

## 요청/응답 명세

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

### 신규 추가

- `packages/shared-types/src/index.ts`
  ```typescript
  /** PUT /api/attempts/{id}/tags 요청 본문. 전체 교체 방식 — 최종 선택된 tagIds 전체를 보낸다. */
  export interface ReplaceAttemptTagsRequest {
    tagIds: number[];
  }
  ```

응답은 기존 `AttemptResponse`를 그대로 재사용하므로 별도 타입 추가 없음.

---

## 에러 코드 전체 목록

| Status | 조건 | 응답 바디 |
|--------|------|-----------|
| 400 | `tagIds`에 존재하지 않는 태그 id 포함 | `{ "code": "INVALID_REQUEST", "message": "..." }` |
| 404 | attempt id 없음 또는 본인 소유 아님 | `{ "code": "ATTEMPT_NOT_FOUND", "message": "..." }` |
| 409 | 결과 태그가 0개가 되는 요청 | `{ "code": "MIN_TAG_REQUIRED", "message": "..." }` |

## 인증

`@AuthenticationPrincipal Long userId` — 기존 `POST /api/attempts`와 동일한 JWT 인증 필요.
