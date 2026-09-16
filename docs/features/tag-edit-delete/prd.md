# tag-edit-delete PRD

## 1. 개요

`tag-catalog`(이슈 #40)가 Out of Scope로 남긴 태그 수정/삭제를 구현한다. 서로 다른
두 리소스에 대한 백엔드 API를 함께 다룬다: ① 커스텀 태그 카탈로그 CRUD(`Tag` 리소스,
이름 수정·삭제), ② 기록에 연결된 태그 교체(`Attempt` 리소스, `attempt_tag` 조인
테이블). 프론트엔드 연동은 별도 FE 이슈로 분리한다.

## 2. 사용자 스토리

- API 소비자로서, 잘못 입력했거나 더 이상 안 쓰는 커스텀 태그의 이름을 고쳐서
  카탈로그를 깔끔하게 유지하고 싶다.
- API 소비자로서, 어떤 기록에도 쓰이지 않는 커스텀 태그를 카탈로그에서 지우고
  싶다.
- API 소비자로서, 기록을 남긴 후에 태그를 잘못 골랐거나 추가로 붙이고 싶을 때
  해당 기록의 태그 목록을 수정하고 싶다.

## 3. 기술 결정

### ADR-1. 도메인별 Exception + ErrorCode enum 페어로 에러를 처리한다

**Context** — 이번 기능은 하나의 도메인 안에서도 상태 코드가 다른 여러 에러
케이스(`TAG_NOT_FOUND` 404, `TAG_NOT_EDITABLE` 403, `TAG_NAME_CONFLICT` 409,
`TAG_IN_USE` 409, `ATTEMPT_NOT_FOUND` 404, `MIN_TAG_REQUIRED` 409)를 반환해야
한다. 기존 `InvalidRequestException`은 항상 400 하나로 고정돼 있어 그대로 못 쓴다.

**Decision** — `AuthException`+`AuthErrorCode`와 동일한 모양으로 두 쌍을 새로
만든다: `TagException`+`TagErrorCode`(`TAG_NOT_FOUND`, `TAG_NOT_EDITABLE`,
`TAG_NAME_CONFLICT`, `TAG_IN_USE`), `AttemptException`+`AttemptErrorCode`
(`ATTEMPT_NOT_FOUND`, `MIN_TAG_REQUIRED`). 각 enum 상수는 `AuthErrorCode`처럼
`HttpStatus`와 메시지를 갖는다. `GlobalExceptionHandler`에 `@ExceptionHandler
(TagException.class)`, `@ExceptionHandler(AttemptException.class)` 두 메서드를
추가한다. 빈 이름(400)만은 기존 `InvalidRequestException`을 그대로 재사용해
`POST /api/tags`와 에러 코드(`INVALID_REQUEST`)를 일치시킨다.

**Alternatives**
- **범용 `ApiException` + 전역 공유 `ErrorCode` enum 하나** — 거부. 프로젝트에
  전례 없는 패턴이고, 모든 기능이 파일 하나를 계속 늘려가며 공유하면 다른 기능과
  동시 작업 시 병합 충돌 지점이 된다.
- **에러 케이스마다 개별 Exception 클래스 6개** — 거부. `AuthException`이 이미
  "예외 클래스 1개 + enum"으로 다중 상태코드를 다루는 관례를 세워뒀는데, 이걸
  따르지 않고 클래스를 늘리면 일관성이 떨어지고 핸들러도 6개 필요해진다.

**Consequences**
- (+) `AuthException` 리뷰어라면 바로 이해 가능한 익숙한 모양.
- (+) `Tag`/`Attempt` 각자 자기 enum 파일만 가져서, 다른 기능 개발자와 파일
  충돌이 안 생긴다.
- (−) 도메인이 늘어날 때마다 `Exception`+`ErrorCode` 페어가 계속 늘어난다
  (공유 파일 대비 파일 수 증가). 현재 규모에선 감당 가능한 트레이드오프로 판단.

### ADR-2. 엔티티 변경은 캡슐화된 도메인 메서드로만 허용한다 (Setter 없음)

**Context** — `Tag`(이름), `Attempt`(태그 목록)를 기존 값에서 새 값으로 바꿔야
하는데, 두 엔티티 모두 현재 Lombok `@Setter` 없이 `@Getter`+생성자만 노출한다.

**Decision** — `RefreshToken.rotate(newToken, newExpiresAt)`와 동일한 패턴으로,
`Tag.rename(String name, String normalizedName)`, `Attempt.replaceTags(List<Tag>
newTags)` 메서드를 엔티티에 추가한다. Service는 이 메서드만 호출하고 필드에
직접 접근하지 않는다.

**Alternatives**
- **Lombok `@Setter` 노출** — 거부. `Tag`/`Attempt`/`RefreshToken` 모두 지금까지
  setter 없이 생성자+도메인 메서드로만 상태를 바꿔왔는데, 이번 기능만 setter를
  열면 "언제 setter를 써도 되는지" 기준이 흐려지고 다른 필드(`category`,
  `userId` 등)까지 실수로 바뀔 여지가 생긴다.
- **삭제 후 재생성** (기존 row를 지우고 새 값으로 새 row insert) — 거부.
  `Tag`는 id가 다른 테이블(`attempt_tag`)의 FK로 참조되므로 재생성하면 참조가
  끊긴다. `Attempt`도 `id` 안정성이 깨져 프론트가 같은 기록을 추적할 수 없다.

**Consequences**
- (+) 캡슐화 유지, 검증 로직(정규화 등)을 엔티티 메서드 안에 가둘 수 있음.
- (+) 기존 관례(`RefreshToken.rotate`)와 100% 일치.
- (−) 필드가 늘어날 때마다 전용 메서드를 하나씩 추가해야 해서 범용 setter보다
  코드량이 약간 많다.

### ADR-3. 좁은 하위 리소스 엔드포인트로 설계한다

**Context** — 태그 카탈로그 수정/삭제와 기록의 태그 교체를 어떤 엔드포인트
모양으로 노출할지 정해야 한다.

**Decision**
- `PUT /api/tags/{id}` — `{ "name": "..." }`, 이름 변경
- `DELETE /api/tags/{id}` — 카탈로그에서 삭제
- `PUT /api/attempts/{id}/tags` — `{ "tagIds": number[] }`, 해당 기록의 태그
  목록을 통째로 교체 (부분 add/remove가 아닌 전체 치환)

in-use 체크는 `AttemptRepository`에 `boolean existsByTagsContaining(Tag tag)`
쿼리 메서드를 추가해 처리한다(`Attempt.tags`가 `@ManyToMany`이므로 Spring Data
파생 쿼리로 바로 지원됨).

**Alternatives**
- **`PATCH /api/attempts/{id}`로 범용화** (memo/result 등 다른 필드까지 함께
  바꿀 수 있는 하나의 엔드포인트) — 거부. 지금 요구사항은 태그 교체뿐인데
  범용 업데이트 엔드포인트를 미리 설계하면 스펙에 안 쓰는 필드가 끼어들고,
  "이번 요청에서 어떤 필드가 실제로 바뀌는지"에 대한 부분 업데이트 규칙(PATCH
  semantics)까지 새로 정해야 해서 범위가 커진다.
- **부분 add/remove 엔드포인트** (`POST /api/attempts/{id}/tags`로 추가,
  `DELETE /api/attempts/{id}/tags/{tagId}`로 제거) — 거부. 최소 1개 필수
  불변조건 검사가 "빼는 시점"에만 필요해 로직이 갈라지고, 프론트가 태그
  선택 UI(다중 선택 체크박스 형태)를 그대로 반영하기엔 전체 교체가 더 단순하다.

**Consequences**
- (+) 엔드포인트가 각자 하나의 리소스/동작만 책임져 스펙이 명확함.
- (+) 프론트 태그 선택 UI(최종 선택된 tagIds 배열)를 그대로 요청 바디에
  실어 보내면 되므로 FE 구현이 단순해짐.
- (−) 태그를 1개만 추가/제거하고 싶어도 클라이언트가 항상 전체 배열을
  다시 계산해서 보내야 한다 (다만 이미 `POST /api/attempts` 생성 시에도
  전체 `tagIds` 배열을 보내는 동일 패턴이라 프론트 입장에서 새로운 개념은
  아님).

## 4. Out of Scope

- 프론트엔드 연동 (UI 진입점, 컴포넌트 수정) — 별도 FE 이슈
- `CORE`/카테고리 태그 수정/삭제, 관리자 태그 관리 화면
- 태그 병합(merge) 기능 — 이름 중복 시 자동 병합하지 않고 차단만 한다. 후속
  이슈로 남김 (`tag-catalog` PRD가 이미 예고한 "관리자 태그 병합 기능")
- 태그 이름 길이 제한 등 추가 검증 (필요 시 후속 이슈)
- 페이지네이션
- 소프트 삭제 (완전 삭제만 지원)
- "기록당 태그 최소 1개" 정책 자체의 변경 (`attempt-recording`에서 확정된 기존
  불변 조건을 그대로 따름)

## 5. 용어 정의

| 용어 | 의미 |
|---|---|
| 커스텀 태그 | 사용자가 `POST /api/tags`로 생성한 태그. `category: "CUSTOM"`. 이번
기능의 수정/삭제 대상 |
| 태그 카탈로그 CRUD | 커스텀 태그 자체의 이름 수정(`PUT`) 및 삭제(`DELETE`).
`Tag` 엔티티에 대한 조작 |
| 기록 태그 수정 | 특정 `Attempt`에 연결된 태그 목록을 교체하는 조작.
`attempt_tag` 조인 테이블에 대한 조작이며 `Tag` 엔티티 자체는 건드리지 않음 |
| 사용 중(in use) | 커스텀 태그가 하나 이상의 `Attempt`와 `attempt_tag`로 연결돼
있는 상태. 삭제 차단 조건 |
| 병합(merge) | 이름이 겹치는 두 태그를 하나로 합치고 관련 기록을 재연결하는
동작. 이번 기능에서는 지원하지 않음 (Out of Scope) |
