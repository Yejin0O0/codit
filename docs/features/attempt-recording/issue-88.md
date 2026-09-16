# Issue 88: feat: [히스토리] GET /api/attempts 백엔드 구현

> Source of Truth: GitHub Issue #88, `docs/features/attempt-recording/prd.md`(ADR-5),
> `docs/features/attempt-recording/api-contract.md`. 소비처: 이슈 #91(예진, 히스토리 FE 연동).

---

## 시그니처

### 백엔드 (Java)

#### 예외 — 지은 PR #96(`feat: [기록] 기록에 연결된 태그 교체 API`)과 동일 클래스를 재사용한다

```java
// exception/AttemptErrorCode.java
public enum AttemptErrorCode {
    ATTEMPT_NOT_FOUND(HttpStatus.NOT_FOUND, "기록을 찾을 수 없습니다"),
    MIN_TAG_REQUIRED(HttpStatus.CONFLICT, "기록에는 최소 1개의 태그가 필요합니다");
    // getHttpStatus(), getMessage()
}

// exception/AttemptException.java
public class AttemptException extends RuntimeException {
    public AttemptException(AttemptErrorCode errorCode);
    public AttemptErrorCode getErrorCode();
}
```

`GlobalExceptionHandler`에 `@ExceptionHandler(AttemptException.class)` 추가
(`e.getErrorCode().getHttpStatus()` + `{ code: e.getErrorCode().name(), message: e.getMessage() }`).

> PR #96이 develop에 먼저 머지되면 이 두 파일은 이미 존재하므로 새로 만들지 않고 그대로 쓴다.
> 이 이슈가 먼저 머지되면 PR #96 쪽에서 동일 파일을 재사용하게 된다.

#### `repository/AttemptRepository.java` — 조회 메서드 추가

```java
public interface AttemptRepository extends JpaRepository<Attempt, Long> {

    @Query("SELECT DISTINCT a FROM Attempt a LEFT JOIN FETCH a.tags "
         + "WHERE a.userId = :userId ORDER BY a.createdAt ASC")
    List<Attempt> findAllByUserIdWithTags(@Param("userId") Long userId);

    @Query("SELECT DISTINCT a FROM Attempt a LEFT JOIN FETCH a.tags "
         + "WHERE a.userId = :userId AND a.problemId = :problemId ORDER BY a.createdAt ASC")
    List<Attempt> findAllByUserIdAndProblemIdWithTags(
            @Param("userId") Long userId, @Param("problemId") String problemId);
}
```

`@ManyToMany tags`가 기본 LAZY라 `LEFT JOIN FETCH`로 N+1을 방지한다. 둘 다 `createdAt` 오름차순 —
집계·`seq` 계산이 서비스에서 순서에 의존한다.

#### `service/` — 신규 record 3개

```java
// AttemptHistorySummary.java — GET /api/attempts 의 한 행(문제 1개)
public record AttemptHistorySummary(
        String problemId,
        AttemptResult latestResult,
        int attemptCount,
        int latestElapsedTime,
        Instant latestSolvedAt,
        List<Tag> tags) {
}

// AttemptHistoryEntry.java — 상세의 시도 1건 + 그 문제 안에서의 순번(1부터)
public record AttemptHistoryEntry(int seq, Attempt attempt) {
}

// AttemptHistoryDetail.java — GET /api/attempts/{problemId} 의 본문
public record AttemptHistoryDetail(
        String problemId,
        AttemptResult latestResult,
        int attemptCount,
        List<Tag> tags,
        List<AttemptHistoryEntry> attempts) {
}
```

#### `service/AttemptService.java` — 메서드 추가 (기존 클래스 확장, `TagService` 패턴)

```java
/** 로그인 유저의 문제별 풀이 이력을 집계해 반환한다. latestSolvedAt 내림차순. */
public List<AttemptHistorySummary> getHistory(Long userId);

/**
 * 특정 문제의 회차별 시도 상세를 반환한다. attempts 는 seq 내림차순(최신순).
 * 해당 유저가 그 problemId 로 시도한 기록이 하나도 없으면 AttemptException(ATTEMPT_NOT_FOUND).
 */
public AttemptHistoryDetail getHistoryDetail(Long userId, String problemId);
```

집계 규칙(ADR-5 Product Rule):
- `latestResult`/`latestElapsedTime`/`latestSolvedAt` = 그 problemId 그룹 중 `createdAt` 최대인 attempt 기준.
- `tags` = 그 그룹 모든 attempt의 태그 합집합(`Tag.id` 기준 unique).
- `attemptCount` = 그룹 크기.
- `getHistory`의 정렬은 `latestSolvedAt` 내림차순.
- `getHistoryDetail`의 `attempts`는 `seq` 내림차순(가장 최근이 배열 첫 번째).

#### `controller/AttemptController.java` — 엔드포인트 추가 (기존 클래스 확장)

```java
@GetMapping
public ResponseEntity<List<AttemptHistoryListItemResponse>> getHistory(
        @AuthenticationPrincipal Long userId);

@GetMapping("/{problemId}")
public ResponseEntity<AttemptHistoryDetailResponse> getHistoryDetail(
        @AuthenticationPrincipal Long userId,
        @PathVariable String problemId);
```

#### `controller/dto/` — 신규 record 3개

```java
public record AttemptHistoryListItemResponse(
        String problemId,
        AttemptResult latestResult,
        int attemptCount,
        int latestElapsedTime,
        Instant latestSolvedAt,
        List<TagResponse> tags) {
}

public record AttemptHistoryItemResponse(
        int seq,
        AttemptResult result,
        int elapsedTime,
        List<TagResponse> tags,
        String memo,
        Instant createdAt) {
}

public record AttemptHistoryDetailResponse(
        String problemId,
        AttemptResult latestResult,
        int attemptCount,
        List<TagResponse> tags,
        List<AttemptHistoryItemResponse> attempts) {
}
```

### 에러 케이스

| 조건 | 예외 |
|---|---|
| 인증 없음/위조/만료 | `JwtAuthenticationFilter` 자동 401 `{ code: "UNAUTHENTICATED" }` (이 이슈의 코드 아님) |
| `GET /api/attempts` — 기록 없음 | 예외 아님. `200 []` |
| `GET /api/attempts/{problemId}` — 본인이 그 problemId로 시도한 적 없음 | `AttemptException(ATTEMPT_NOT_FOUND)` → 404 |
| `GET /api/attempts/{problemId}` — 다른 유저의 problemId(그 유저는 시도했지만 나는 안 함) | 위와 동일 취급 — `userId` 필터링된 조회라 "없음"과 구분하지 않는다(정보 노출 방지) |

---

## 테스트 시나리오

### 정상

- [정상] `AttemptService.getHistory` — should return one summary per distinct problemId when user has attempts across multiple problems
- [정상] `AttemptService.getHistory` — should set latestResult/latestElapsedTime/latestSolvedAt from the most recent attempt (highest createdAt) for that problem
- [정상] `AttemptService.getHistory` — should set attemptCount to the number of attempts for that problem
- [정상] `AttemptService.getHistory` — should union tags across all attempts of the same problem without duplicates
- [정상] `AttemptService.getHistory` — should sort summaries by latestSolvedAt descending
- [정상] `AttemptService.getHistory` — should return an empty list when the user has no attempts
- [정상] `AttemptService.getHistoryDetail` — should assign seq starting at 1 in chronological (createdAt ascending) order
- [정상] `AttemptService.getHistoryDetail` — should return attempts sorted by seq descending (most recent first)
- [정상] `AttemptService.getHistoryDetail` — should aggregate latestResult/attemptCount/tags for that problem the same way as getHistory
- [정상] `AttemptService.getHistoryDetail` — should include memo and tags per individual attempt entry
- [정상] `AttemptController GET /api/attempts` — should return 200 with the list of history summaries when authenticated
- [정상] `AttemptController GET /api/attempts` — should return 200 with an empty array when the service returns no summaries
- [정상] `AttemptController GET /api/attempts` — should serialize each item's tags as objects with id, name, category
- [정상] `AttemptController GET /api/attempts/{problemId}` — should return 200 with the detail body including the attempts array when authenticated
- [정상] `AttemptController GET /api/attempts/{problemId}` — should pass the JWT-derived userId and the path problemId to the service

### 경계

- [경계] `AttemptService.getHistory` — should return a single summary with attemptCount 1 when the user has exactly one attempt for a problem
- [경계] `AttemptService.getHistory` — should not include another user's attempts in the summary
- [경계] `AttemptService.getHistoryDetail` — should return seq 1 for a problem with exactly one attempt

### 예외

- [예외] `AttemptService.getHistoryDetail` — should throw AttemptException(ATTEMPT_NOT_FOUND) when the user has no attempts for the given problemId
- [예외] `AttemptService.getHistoryDetail` — should throw AttemptException(ATTEMPT_NOT_FOUND) when the problemId belongs only to another user's attempts
- [예외] `AttemptController GET /api/attempts` — should return 401 when the request has no authentication
- [예외] `AttemptController GET /api/attempts/{problemId}` — should return 404 with code ATTEMPT_NOT_FOUND when the service throws AttemptException(ATTEMPT_NOT_FOUND)
- [예외] `AttemptController GET /api/attempts/{problemId}` — should return 401 when the request has no authentication

---

## AC 커버리지

| AC | 커버 시나리오 |
| --- | --- |
| AC-1 (목록 집계 — 문제당 1행, latestResult/attemptCount/latestElapsedTime/latestSolvedAt/tags 정확) | [정상] getHistory 문제당 1행 / latestResult 등 최신 attempt 기준 / attemptCount / [정상] Controller 200 with list / serialize tags |
| AC-2 (목록 정렬 — latestSolvedAt 내림차순) | [정상] getHistory sort by latestSolvedAt descending |
| AC-3 (기록 없음 → 200 빈 배열) | [정상] getHistory empty list / [정상] Controller 200 empty array |
| AC-4 (태그 합집합 — 문제의 모든 attempt 태그, 중복 제거) | [정상] getHistory union tags without duplicates |
| AC-5 (상세 — 회차별 시도, seq 부여·내림차순 정렬, memo·tags 포함) | [정상] getHistoryDetail seq 부여(오름차순) / attempts 내림차순 정렬 / aggregate 필드 / memo·tags per entry / [경계] seq 1 (단일 시도) / [정상] Controller 200 detail body |
| AC-6 (없는/타인 problemId → 404 ATTEMPT_NOT_FOUND) | [예외] getHistoryDetail throw(기록 없음) / throw(타인 problemId) / [예외] Controller 404 ATTEMPT_NOT_FOUND |
| AC-7 (인증 필요 — 미인증 401, 본인 데이터만 조회) | [경계] getHistory 타인 attempt 미포함 / [정상] Controller userId·problemId 전달 / [예외] Controller 401 (목록) / [예외] Controller 401 (상세) |
