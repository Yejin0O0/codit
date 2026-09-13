# Issue 93: [태그] 커스텀 태그 카탈로그 수정/삭제 API

## 시그니처

### 백엔드 (Java)

**DTO**

```java
public record UpdateTagRequest(String name) {
}
```

**엔티티 — `Tag`**

```java
public void rename(String name, String normalizedName) {
    this.name = name;
    this.normalizedName = normalizedName;
}
```

**예외 — `TagErrorCode` / `TagException`** (`AuthErrorCode`/`AuthException`과 동일한 모양)

```java
public enum TagErrorCode {
    TAG_NOT_FOUND(HttpStatus.NOT_FOUND, "태그를 찾을 수 없습니다"),
    TAG_NOT_EDITABLE(HttpStatus.FORBIDDEN, "CORE/카테고리 태그는 수정하거나 삭제할 수 없습니다"),
    TAG_NAME_CONFLICT(HttpStatus.CONFLICT, "이미 존재하는 태그 이름입니다"),
    TAG_IN_USE(HttpStatus.CONFLICT, "이 태그는 기록에 사용 중입니다");

    private final HttpStatus httpStatus;
    private final String message;
    // AuthErrorCode와 동일한 생성자/getter
}

public class TagException extends RuntimeException {
    private final TagErrorCode errorCode;
    public TagException(TagErrorCode errorCode) { super(errorCode.getMessage()); this.errorCode = errorCode; }
    public TagErrorCode getErrorCode() { return errorCode; }
}
```

`GlobalExceptionHandler`에 `handleAuthException`과 동일한 모양의
`@ExceptionHandler(TagException.class)` 핸들러를 추가한다.

**리포지토리 — `AttemptRepository`** (⚠️ 이슈 본문에는 `TagRepository`로 잘못
적혀 있었으나, `Tag`가 `attempts`로의 역참조를 갖지 않아 실제로는
`AttemptRepository`에 추가한다. ADR-3 참고)

```java
public interface AttemptRepository extends JpaRepository<Attempt, Long> {
    boolean existsByTagsContaining(Tag tag);
}
```

`TagService`는 이 메서드를 쓰기 위해 `AttemptRepository`를 새로 주입받는다
(`AttemptService`가 반대 방향으로 `TagRepository`를 주입받는 기존 관례와 대칭).

**컨트롤러 — `TagController`**

```java
@PutMapping("/{id}")
public ResponseEntity<TagResponse> updateTag(@PathVariable Long id, @RequestBody UpdateTagRequest request)

@DeleteMapping("/{id}")
public ResponseEntity<Void> deleteTag(@PathVariable Long id)
```

**서비스 — `TagService`**

```java
public Tag renameTag(Long id, String name)
public void deleteTag(Long id)
```

### 에러 케이스

공통 선행 체크 (`renameTag`, `deleteTag` 둘 다):
1. `tagRepository.findById(id)`가 비어있으면 → `TagException(TAG_NOT_FOUND)`
2. 조회된 태그의 `category`가 `"CUSTOM"`이 아니면 → `TagException(TAG_NOT_EDITABLE)`

`renameTag` 전용:
- `name`이 null이거나 blank면 → `InvalidRequestException` (기존 `POST /api/tags`와
  동일 코드 `INVALID_REQUEST`)
- 정규화된 이름이 **자기 자신이 아닌** 다른 태그와 겹치면 →
  `TagException(TAG_NAME_CONFLICT)`

`deleteTag` 전용:
- `attemptRepository.existsByTagsContaining(tag)`가 `true`면 →
  `TagException(TAG_IN_USE)` (고정 메시지, 사용 중인 기록 개수는 포함하지 않음 —
  결정 포인트 안 A 채택)

---

## 테스트 시나리오

### 정상

- [정상] TagService.renameTag — should rename tag and return updated tag when a valid new name is given for a CUSTOM tag
- [정상] TagController.updateTag — should return 200 with updated tag body when rename succeeds
- [정상] TagService.deleteTag — should delete tag when it is CUSTOM and not referenced by any attempt
- [정상] TagController.deleteTag — should return 204 with empty body when deletion succeeds

### 경계

- [경계] TagService.renameTag — should succeed (no conflict) when the new name normalizes to the tag's own current normalizedName
- [경계] TagService.renameTag — should trim and lowercase the new name before comparing against other tags' normalizedName

### 예외

- [예외] TagService.renameTag — should throw TagException(TAG_NOT_FOUND) when tag id does not exist
- [예외] TagService.deleteTag — should throw TagException(TAG_NOT_FOUND) when tag id does not exist
- [예외] TagService.renameTag — should throw TagException(TAG_NOT_EDITABLE) when target tag's category is not CUSTOM
- [예외] TagService.deleteTag — should throw TagException(TAG_NOT_EDITABLE) when target tag's category is not CUSTOM
- [예외] TagService.renameTag — should throw InvalidRequestException when name is null or blank
- [예외] TagService.renameTag — should throw TagException(TAG_NAME_CONFLICT) when normalized new name matches a different existing tag
- [예외] TagService.deleteTag — should throw TagException(TAG_IN_USE) when attemptRepository.existsByTagsContaining returns true
- [예외] TagController.updateTag — should map TagException(TAG_NOT_FOUND) to 404 response body `{ code: "TAG_NOT_FOUND" }`
- [예외] TagController.updateTag — should map TagException(TAG_NOT_EDITABLE) to 403 response body `{ code: "TAG_NOT_EDITABLE" }`
- [예외] TagController.updateTag — should map TagException(TAG_NAME_CONFLICT) to 409 response body `{ code: "TAG_NAME_CONFLICT" }`
- [예외] TagController.updateTag — should map InvalidRequestException to 400 response body `{ code: "INVALID_REQUEST" }`
- [예외] TagController.deleteTag — should map TagException(TAG_NOT_EDITABLE) to 403 response body `{ code: "TAG_NOT_EDITABLE" }`
- [예외] TagController.deleteTag — should map TagException(TAG_IN_USE) to 409 response body `{ code: "TAG_IN_USE" }`
- [예외] TagController.deleteTag — should map TagException(TAG_NOT_FOUND) to 404 response body `{ code: "TAG_NOT_FOUND" }`

---

## AC 커버리지

| AC | 커버 시나리오 |
|----|--------------|
| 정상 수정 시 200 + 갱신된 태그 | [정상] TagService.renameTag / [정상] TagController.updateTag |
| 이름 충돌 시 409 TAG_NAME_CONFLICT | [예외] TagService.renameTag(conflict) / [예외] TagController.updateTag(conflict) |
| CORE/카테고리 태그 수정·삭제 시 403 TAG_NOT_EDITABLE | [예외] TagService.renameTag(not editable) / [예외] TagService.deleteTag(not editable) / [예외] TagController.updateTag(not editable) / [예외] TagController.deleteTag(not editable) |
| 미사용 커스텀 태그 삭제 시 204 | [정상] TagService.deleteTag / [정상] TagController.deleteTag |
| 사용 중인 커스텀 태그 삭제 시도 시 409 TAG_IN_USE | [예외] TagService.deleteTag(in use) / [예외] TagController.deleteTag(in use) |
| 존재하지 않는 태그 id 시 404 TAG_NOT_FOUND | [예외] TagService.renameTag(not found) / [예외] TagService.deleteTag(not found) / [예외] TagController.updateTag(not found) / [예외] TagController.deleteTag(not found) |
| 이름 없음/공백 시 400 INVALID_REQUEST | [예외] TagService.renameTag(blank name) / [예외] TagController.updateTag(blank name) |
