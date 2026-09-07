# tag-catalog 이슈 분해

FE/BE 역할 분리 워크플로우에 따라 이슈를 나눈다. 프론트 연동은 별도 이슈로 FE
담당자가 직접 기획/등록한다 (`docs/features/problem-identification/issues.md`의
Issue #6과 동일한 관례).

---

## Issue 1: [유형 태그] 유형 태그 조회/등록 API (백엔드)

### 설명

`Tag` 엔티티를 만들고 `GET /api/tags`(전체 목록 조회), `POST /api/tags`(커스텀 태그
upsert 생성) API를 구현한다. 초기 25개 태그(핵심 11 + 카테고리 14)는 `data.sql`로
시딩한다. `SecurityConfig.java`에 `/api/tags/**` permitAll 추가 및 CORS 설정도
함께 처리한다.

신규 파일:
- `Tag` 엔티티
- `TagRepository`
- `TagService`
- `TagController`
- `src/main/resources/data.sql` (초기 태그 시딩)

변경 파일:
- `SecurityConfig.java` (permitAll, CORS)
- `packages/shared-types/src/index.ts` (`Tag` interface를 `{id: number, name, category}`로 갱신)

### 완료 조건 (Acceptance Criteria)

- [ ] `GET /api/tags` 호출 시 핵심 태그 11개(`category: "CORE"`) + 카테고리 태그
      14개(`category`: 대분류명) 총 25개를 반환한다
- [ ] `POST /api/tags`에 새 이름을 보내면 `category: "CUSTOM"`인 새 태그를 생성하고
      `201 Created`를 반환한다
- [ ] `POST /api/tags`에 이미 존재하는 이름(대소문자/앞뒤 공백만 다른 경우 포함)을
      보내면 새로 생성하지 않고 기존 태그를 `200 OK`로 반환한다 (CORE/카테고리
      태그와도 매칭됨)
- [ ] `POST /api/tags`에 빈 문자열/공백만 있는 이름을 보내면 `400 Bad Request`
      (`{code: "INVALID_REQUEST", message}`)를 반환한다
- [ ] 두 API 모두 `Authorization` 헤더 없이 정상 동작한다 (인증 불필요)
- [ ] 브라우저 확장 프로그램(익스텐션 오리진)에서 호출 시 CORS 에러 없이 응답을
      받을 수 있다

### 시나리오

**시나리오 A — 전체 목록 조회**

**Given** 초기 시딩된 25개 태그가 DB에 있다
**When** `GET /api/tags`를 호출한다
**Then** 25개 태그가 `{id, name, category}` 배열로 반환된다

**시나리오 B — 새 커스텀 태그 등록**

**Given** `"이분 그래프"`라는 이름의 태그가 아직 없다
**When** `POST /api/tags`에 `{ "name": "이분 그래프" }`를 보낸다
**Then** 새 `Tag`(`category: "CUSTOM"`)가 생성되고 `201 Created`로 반환된다

**시나리오 C — 기존 태그 재사용 (정규화 매칭)**

**Given** `category: "CORE"`인 `"DFS"` 태그가 이미 존재한다
**When** `POST /api/tags`에 `{ "name": "dfs" }` 또는 `{ "name": " DFS " }`를 보낸다
**Then** 새로 생성되지 않고 기존 `"DFS"` 태그가 `200 OK`로 반환된다

**시나리오 D — 필수값 누락**

**Given** 아무 조건 없음
**When** `POST /api/tags`에 `{ "name": "" }` 또는 `{ "name": "   " }`를 보낸다
**Then** `400 Bad Request`와 `{code: "INVALID_REQUEST", message: "..."}`를 반환한다

---

## Issue 2: [유형 태그] 프론트 태그 카탈로그 연동 (프론트엔드)

> 별도 이슈로 FE 담당자가 직접 기획/등록. 참고용으로만 남겨둠.

### 설명

`lib/tag-catalog.ts`의 하드코딩된 배열을 `GET /api/tags` 호출로 대체하고,
`TagPicker`/`TagSelectScreen`/`TagFilterPanel`을 새 응답 구조(`id: number`)에 맞게
수정한다. 커스텀 태그 입력 시 `POST /api/tags`를 호출하도록 `tag-input.ts` 로직도
변경한다.

**의존: Issue 1** (`api-contract` 확정 후에는 mock 기준으로 병렬 진행 가능)
