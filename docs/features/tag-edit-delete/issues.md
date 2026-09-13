# tag-edit-delete 이슈 분해

의존성: Issue 1과 Issue 2는 서로 다른 리소스(`Tag` vs `Attempt`)와 서로 다른
예외 enum(`TagErrorCode` vs `AttemptErrorCode`)을 다루므로 독립적으로 진행
가능하다 (순서 무관, 병행 가능).

GitHub 등록:
- Issue 1 → [#93](https://github.com/Yejin0O0/codit/issues/93)
- Issue 2 → [#94](https://github.com/Yejin0O0/codit/issues/94)

---

## Issue 1: [태그] 커스텀 태그 카탈로그 수정/삭제 API

### 설명

`PUT /api/tags/{id}`(이름 수정), `DELETE /api/tags/{id}`(삭제) 두 엔드포인트를
구현한다. `CUSTOM` 태그만 대상이며, `CORE`/카테고리 태그는 거부한다. 신규 파일:
`TagException`, `TagErrorCode`, `UpdateTagRequest`(DTO). 수정 파일: `Tag`(엔티티에
`rename` 메서드 추가), `TagController`, `TagService`, `AttemptRepository`(in-use
체크 쿼리 추가 — `Tag`가 `attempts` 역참조를 갖지 않아 `TagRepository`가 아닌
`AttemptRepository` 쪽에 추가), `GlobalExceptionHandler`.

### 완료 조건 (Acceptance Criteria)

- [x] `PUT /api/tags/{id}`로 커스텀 태그 이름을 정상 수정하면 `200 OK` + 갱신된
      태그를 반환한다
- [x] 수정하려는 이름이 trim+대소문자 무시 기준으로 다른 태그와 겹치면
      `409 TAG_NAME_CONFLICT`를 반환하고 수정하지 않는다
- [x] `CORE`/카테고리 태그를 수정하거나 삭제하려 하면 `403 TAG_NOT_EDITABLE`을
      반환한다
- [x] 기록에 연결되지 않은 커스텀 태그를 삭제하면 `204 No Content`를 반환한다
- [x] 기록에 하나 이상 연결된 커스텀 태그를 삭제하려 하면 `409 TAG_IN_USE`를
      반환하고 삭제하지 않는다
- [x] 존재하지 않는 태그 id로 수정/삭제 요청 시 `404 TAG_NOT_FOUND`를 반환한다
- [x] 이름이 없거나 공백만 있으면 `400 INVALID_REQUEST`를 반환한다 (기존
      `POST /api/tags`와 동일 에러 코드)

### 시나리오

**시나리오 A — 커스텀 태그 이름 정상 수정**
**Given** 커스텀 태그 `{ id: 26, name: "이분그래프", category: "CUSTOM" }`가 있다
**When** `PUT /api/tags/26`에 `{ "name": "이분 그래프" }`를 요청한다
**Then** `200 OK`와 갱신된 태그를 반환한다

**시나리오 B — 이름 수정이 기존 태그와 충돌**
**Given** 커스텀 태그 `"이분그래프"`(id 26)와 CORE 태그 `"DFS"`(id 6)가 있다
**When** `PUT /api/tags/26`에 `{ "name": "dfs" }`를 요청한다
**Then** 수정하지 않고 `409 TAG_NAME_CONFLICT`를 반환한다

**시나리오 C — CORE/카테고리 태그는 수정/삭제 대상이 아님**
**Given** `category: "CORE"`인 태그(id 6, `"DFS"`)가 있다
**When** `PUT /api/tags/6` 또는 `DELETE /api/tags/6`을 요청한다
**Then** `403 TAG_NOT_EDITABLE`을 반환한다

**시나리오 D — 기록에 안 쓰인 커스텀 태그 삭제**
**Given** 커스텀 태그 26이 어떤 `Attempt`에도 연결돼 있지 않다
**When** `DELETE /api/tags/26`을 요청한다
**Then** 삭제하고 `204 No Content`를 반환한다

**시나리오 E — 기록에 쓰인 커스텀 태그 삭제 시도**
**Given** 커스텀 태그 26이 기록 3개에 연결돼 있다
**When** `DELETE /api/tags/26`을 요청한다
**Then** 삭제하지 않고 `409 TAG_IN_USE`를 반환한다

**시나리오 F — 존재하지 않는 태그 id**
**Given** id 999인 태그가 없다
**When** `PUT /api/tags/999` 또는 `DELETE /api/tags/999`를 요청한다
**Then** `404 TAG_NOT_FOUND`를 반환한다

---

## Issue 2: [기록] 기록에 연결된 태그 교체 API

### 설명

`PUT /api/attempts/{id}/tags`(`{ "tagIds": number[] }`)로 특정 기록의 태그
목록을 전체 교체한다. 요청자 본인 소유 기록만 수정 가능하며, 결과 태그가
0개가 되는 요청은 거부한다. 신규 파일: `AttemptException`, `AttemptErrorCode`,
`ReplaceAttemptTagsRequest`(DTO). 수정 파일: `Attempt`(엔티티에 `replaceTags`
메서드 추가), `AttemptController`, `AttemptService`, `GlobalExceptionHandler`.

### 완료 조건 (Acceptance Criteria)

- [ ] 본인 소유 기록에 `PUT /api/attempts/{id}/tags`로 유효한 `tagIds`를
      보내면 `200 OK` + 갱신된 기록(태그 포함)을 반환한다
- [ ] 결과적으로 태그가 0개가 되는 요청(`tagIds: []`)은 `409
      MIN_TAG_REQUIRED`를 반환하고 교체하지 않는다
- [ ] 존재하지 않는 attempt id, 또는 다른 사용자 소유 attempt에 대한 요청은
      구분 없이 `404 ATTEMPT_NOT_FOUND`를 반환한다
- [ ] 존재하지 않는 tagId가 `tagIds`에 포함되면 기존 `POST /api/attempts`와
      동일하게 `400 INVALID_REQUEST`를 반환한다

### 시나리오

**시나리오 G — 기록의 태그를 정상적으로 교체**
**Given** 사용자 본인의 기록(attempt id 10)에 태그 `[4, 6]`이 연결돼 있다
**When** `PUT /api/attempts/10/tags`에 `{ "tagIds": [4, 6, 26] }`를 요청한다
**Then** 연결을 갱신하고 `200 OK`를 반환한다

**시나리오 H — 기록에서 마지막 태그 제거 시도**
**Given** 사용자 본인의 기록(attempt id 10)에 태그 `[6]` 하나만 남아있다
**When** `PUT /api/attempts/10/tags`에 `{ "tagIds": [] }`를 요청한다
**Then** 거부하고 `409 MIN_TAG_REQUIRED`를 반환한다

**시나리오 I — 다른 사용자의 기록 수정 시도**
**Given** 기록(attempt id 10)이 사용자 A 소유다
**When** 사용자 B가 `PUT /api/attempts/10/tags`를 요청한다
**Then** `404 ATTEMPT_NOT_FOUND`를 반환한다
