# Issue 94: [기록] 기록에 연결된 태그 교체 API

## 시그니처

### 백엔드 (Java)

**DTO**

```java
public record ReplaceAttemptTagsRequest(List<Long> tagIds) {
}
```

**엔티티 — `Attempt`**

```java
public void replaceTags(List<Tag> newTags) {
    this.tags = new ArrayList<>(newTags);
}
```

**예외 — `AttemptErrorCode` / `AttemptException`** (`AuthErrorCode`/`AuthException`,
이슈 #93의 `TagErrorCode`/`TagException`과 동일한 모양)

```java
public enum AttemptErrorCode {
    ATTEMPT_NOT_FOUND(HttpStatus.NOT_FOUND, "기록을 찾을 수 없습니다"),
    MIN_TAG_REQUIRED(HttpStatus.CONFLICT, "기록에는 최소 1개의 태그가 필요합니다");
    // AuthErrorCode와 동일한 생성자/getter
}

public class AttemptException extends RuntimeException {
    private final AttemptErrorCode errorCode;
    public AttemptException(AttemptErrorCode errorCode) { super(errorCode.getMessage()); this.errorCode = errorCode; }
    public AttemptErrorCode getErrorCode() { return errorCode; }
}
```

`GlobalExceptionHandler`에 `@ExceptionHandler(AttemptException.class)` 핸들러 추가
(`handleTagException`과 동일 모양).

**서비스 — `AttemptService`** (기존 `resolveTags` 리팩터링 + `replaceTags` 신설)

```java
// 기존 private resolveTags(List<Long>) 내부 로직 중 "tagId 존재 검증" 부분만 분리
private List<Tag> findTagsByIds(List<Long> tagIds) {
    // null 원소 검사 + distinct + findAllById + 개수 불일치 검사 (기존 로직 이동)
}

private List<Tag> resolveTags(List<Long> tagIds) {
    if (tagIds == null || tagIds.isEmpty()) {
        throw new InvalidRequestException("태그를 1개 이상 선택해야 합니다.");
    }
    return findTagsByIds(tagIds);
}

public Attempt replaceTags(Long userId, Long attemptId, List<Long> tagIds) {
    Attempt attempt = attemptRepository.findById(attemptId)
        .filter(a -> a.getUserId().equals(userId))
        .orElseThrow(() -> new AttemptException(AttemptErrorCode.ATTEMPT_NOT_FOUND));
    if (tagIds == null || tagIds.isEmpty()) {
        throw new AttemptException(AttemptErrorCode.MIN_TAG_REQUIRED);
    }
    List<Tag> tags = findTagsByIds(tagIds);
    attempt.replaceTags(tags);
    return attempt;
}
```

**컨트롤러 — `AttemptController`**

```java
@PutMapping("/{id}/tags")
public ResponseEntity<AttemptResponse> replaceTags(
        @AuthenticationPrincipal Long userId,
        @PathVariable Long id,
        @RequestBody ReplaceAttemptTagsRequest request)
```

### 에러 케이스

- `attemptId`가 없거나 `userId`가 소유자와 다름 (구분 없음) →
  `AttemptException(ATTEMPT_NOT_FOUND)` → 404
- `tagIds`가 null이거나 빈 배열 → `AttemptException(MIN_TAG_REQUIRED)` → 409
- `tagIds`에 null 원소 또는 존재하지 않는 태그 id 포함 → `InvalidRequestException`
  (기존 `createAttempt`와 동일 메시지) → 400

---

## 테스트 시나리오

### 정상

- [정상] AttemptService.replaceTags — should replace attempt's tags and return updated attempt when valid tagIds given for the owner's attempt
- [정상] AttemptController.replaceTags — should return 200 with updated attempt body when replace succeeds
- [정상] AttemptServiceIntegrationTest — should persist replaced tags to the database (real JPA dirty-checking, @DataJpaTest) when replaceTags commits — ac-verifier 권고로 추가

### 경계

- [경계] AttemptService.replaceTags — should accept exactly one tagId (minimum valid size)
- [경계] AttemptService.replaceTags — should accept duplicate tagIds and link each distinct tag once (기존 createAttempt와 동일한 dedupe 동작 유지 확인)

### 예외

- [예외] AttemptService.replaceTags — should throw AttemptException(ATTEMPT_NOT_FOUND) when attempt id does not exist
- [예외] AttemptService.replaceTags — should throw AttemptException(ATTEMPT_NOT_FOUND) when attempt belongs to a different user
- [예외] AttemptController.replaceTags — should return 404 ATTEMPT_NOT_FOUND when replacing tags on another user's attempt (존재하지 않는 경우와 별개로 독립 검증) — ac-verifier 권고로 추가
- [예외] AttemptService.replaceTags — should throw AttemptException(MIN_TAG_REQUIRED) when tagIds is null
- [예외] AttemptService.replaceTags — should throw AttemptException(MIN_TAG_REQUIRED) when tagIds is empty
- [예외] AttemptService.replaceTags — should throw InvalidRequestException when tagIds contains a null element
- [예외] AttemptService.replaceTags — should throw InvalidRequestException and not replace when tagIds contains an id not in tag table
- [예외] AttemptController.replaceTags — should map AttemptException(ATTEMPT_NOT_FOUND) to 404 response body `{ code: "ATTEMPT_NOT_FOUND" }`
- [예외] AttemptController.replaceTags — should map AttemptException(MIN_TAG_REQUIRED) to 409 response body `{ code: "MIN_TAG_REQUIRED" }`
- [예외] AttemptController.replaceTags — should map InvalidRequestException to 400 response body `{ code: "INVALID_REQUEST" }`

---

## AC 커버리지

| AC | 커버 시나리오 |
|----|--------------|
| 본인 소유 기록에 유효한 tagIds → 200 + 갱신된 기록 | [정상] AttemptService.replaceTags / [정상] AttemptController.replaceTags |
| 결과 태그 0개(빈 tagIds) → 409 MIN_TAG_REQUIRED, 교체 안 함 | [예외] AttemptService.replaceTags(null) / [예외] AttemptService.replaceTags(empty) / [예외] AttemptController.replaceTags(min tag required) |
| 존재하지 않는 attempt id 또는 다른 사용자 소유 → 404 ATTEMPT_NOT_FOUND (구분 없음) | [예외] AttemptService.replaceTags(not found) / [예외] AttemptService.replaceTags(다른 사용자) / [예외] AttemptController.replaceTags(not found) |
| tagIds에 존재하지 않는 태그 id 포함 → 400 INVALID_REQUEST | [예외] AttemptService.replaceTags(null 원소) / [예외] AttemptService.replaceTags(미존재 id) / [예외] AttemptController.replaceTags(invalid request) |
