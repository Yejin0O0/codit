# 문제 식별 API 명세서 — `POST /api/problems`

| 항목 | 내용 |
| --- | --- |
| 담당 | 지은 |
| 관련 FRS | FR-001 (문제 식별) |
| 네이밍 컨벤션 | camelCase |
| 버전 | v1.1 |

> **v1.1 변경 요약**: 이슈 #5 구현(`api-contract.md`, `session-log-2026-09-02.md`) 결과를 반영해 v1.0에서 수정함.
> - `title` 필드 삭제 (이번 이슈에서 DOM 파싱 미구현 확정 — "팀 확정 필요 항목 #2"의 답)
> - `url` 필드 신규 추가 (필수)
> - 200/201 응답 스키마를 동일하게 통일 (`createdAt` 항상 포함) — "팀 확정 필요 항목 #1"의 답
> - 400 에러 응답 바디를 `{ code, message }` 형식으로 구체화
> - 인증 불필요 여부, URL 정규화 책임 소재를 명시적으로 확정
>
> 상세 근거는 3장 및 하단 "변경 이력" 참고.

---

## 목차

1. 명세
2. 팀 확정 필요 항목
3. 설명 및 설계 고민
4. 변경 이력

---

## 1. 명세

### `POST /api/problems`

문제 식별 및 등록 (Upsert)

SWEA 문제 페이지 진입 시 URL에서 파싱한 `contestProbId`(=`problemId`)로 문제를 조회하고, 존재하지 않으면 새로 생성한다. **인증 불필요** — `Problem`은 특정 사용자에 속하지 않는 공개 마스터 데이터이기 때문이다 (사용자별로 "누가 언제 풀었는지"는 별도 `Attempt` 이슈가 담당).

#### Request

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `problemId` | string | ✅ | SWEA URL의 `contestProbId` 값 |
| `url` | string | ✅ | 문제 상세 페이지 URL. 진입 경로(스터디 박스 경유/일반 목록 경유 등)와 무관하게 `contestProbId` 기준으로 정규화된 URL을 **프론트(Issue 2)가 조립해서 전송**한다. 백엔드는 받은 값을 그대로 저장할 뿐 가공하지 않는다 |

```json
{
  "problemId": "AZ8R8haaeYnHBITH",
  "url": "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=AZ8R8haaeYnHBITH"
}
```

> ⚠️ v1.0의 `title` 필드는 제외했다. DOM에서 문제 제목을 파싱하는 로직을 이번 이슈 범위에 넣지 않기로 확정했고(Out of Scope), 파싱 로직 없이는 항상 `null`이라 필드로서 의미가 없어 아예 뺐다. 필요해지면 별도 이슈로 다시 논의한다.

#### Responses

| 코드 | 상황 | 본문 |
| --- | --- | --- |
| `200` | 기존 문제 조회 성공 | `id`, `problemId`, `url`, `createdAt` |
| `201` | 신규 문제 생성 성공 | `id`, `problemId`, `url`, `createdAt` |
| `400` | 필수값 누락 (`problemId` 또는 `url` 없음) | `{ code: "INVALID_REQUEST", message }` |

```json
// 200
{ "id": 12, "problemId": "AZ8R8haaeYnHBITH", "url": "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=AZ8R8haaeYnHBITH", "createdAt": "2026-08-26T09:00:00Z" }

// 201
{ "id": 13, "problemId": "AZ8R8haaeYnHBITH", "url": "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=AZ8R8haaeYnHBITH", "createdAt": "2026-08-26T10:00:00Z" }

// 400
{ "code": "INVALID_REQUEST", "message": "problemId와 url은 필수입니다." }
```

> ⚠️ v1.0에서는 200과 201의 응답 스키마가 다르게(`title` vs `createdAt`) 설계돼 있었다. 실제 구현에서는 `title` 필드 자체가 빠지면서 **200과 201이 완전히 동일한 `ProblemResponse` 구조(`id`, `problemId`, `url`, `createdAt`)를 반환**하도록 단순화했다. `createdAt`은 "최초 생성 시각"이라 조회든 신규 생성이든 항상 의미 있는 값이므로, 상태 코드만으로 신규/기존을 구분하고 바디 파싱을 분기할 필요가 없게 만든 것이다.

#### Swagger YAML

```yaml
/api/problems:
  post:
    summary: 문제 식별 및 등록 (Upsert)
    description: >
      SWEA 문제 페이지 진입 시 URL에서 파싱한 contestProbId로 문제를 조회하고,
      존재하지 않으면 새로 생성한다. 인증 불필요.
    tags: [Problem]
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [problemId, url]
            properties:
              problemId:
                type: string
                description: SWEA URL의 contestProbId 값
                example: "AZ8R8haaeYnHBITH"
              url:
                type: string
                description: >
                  contestProbId 기준으로 정규화된 문제 상세 페이지 URL.
                  프론트(익스텐션)가 조립해서 전송한다.
                example: "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=AZ8R8haaeYnHBITH"
    responses:
      "200":
        description: 기존 문제 조회 성공
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProblemResponse'
      "201":
        description: 신규 문제 생성 성공
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProblemResponse'
      "400":
        description: 필수값 누락 (problemId 또는 url 없음)
        content:
          application/json:
            schema:
              type: object
              properties:
                code: { type: string, example: "INVALID_REQUEST" }
                message: { type: string, example: "problemId와 url은 필수입니다." }

components:
  schemas:
    ProblemResponse:
      type: object
      properties:
        id: { type: integer, example: 12 }
        problemId: { type: string, example: "AZ8R8haaeYnHBITH" }
        url: { type: string, example: "https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=AZ8R8haaeYnHBITH" }
        createdAt: { type: string, format: date-time }
```

### 전체 흐름

```
사용자가 SWEA 문제 페이지 접속
  → Content Script가 contestProbId 파싱
  → contestProbId 기준으로 정규화된 문제 상세 페이지 URL 조립 (프론트 책임)
  → POST /api/problems { problemId, url } 호출 (인증 헤더 불필요)
      ├─ DB에 있으면 → 200 (조회, 저장 재실행 없음)
      └─ DB에 없으면 → 201 (생성)
  → 반환된 문제 id를 이후 태그/결과/Attempt 저장 시 연결
```

---

## 2. 팀 확정 필요 항목

| # | 항목 | 상태 | 내용 |
| --- | --- | --- | --- |
| 1 | 200/201 응답 구분 활용 여부 | ✅ 결정 완료 | 상태 코드는 구분하되(200/201), 응답 바디 스키마는 동일하게 통일(`id`/`problemId`/`url`/`createdAt`). 프론트는 상태 코드만으로 신규/기존을 판단하면 되고, 바디 형태를 분기해서 파싱할 필요가 없다 |
| 2 | `title` 파싱 필요 여부 | ✅ 결정 완료 | 이번 이슈 범위에서 제외(Out of Scope). DOM에서 문제 제목을 파싱하는 로직은 구현하지 않는다. 향후 필요해지면 별도 이슈로 재논의 |
| 3 | URL 설계 컨벤션 확정 | ✅ 결정 완료 | A안(POST+body) 유지 확정. 근거는 3.5절 그대로 — 리소스가 늘어나 CRUD 성격이 강해지는 시점에 팀 전체를 B안으로 리팩터링할지 재논의 |
| 4 | `url` 필드 정규화 책임 | ✅ 결정 완료(신규) | 프론트(Issue 2)가 `contestProbId` 기준으로 정규화된 URL을 조립해서 전송한다. 백엔드는 SWEA URL 패턴을 알 필요 없이 받은 값을 그대로 저장만 한다 |
| 5 | 인증 필요 여부 | ✅ 결정 완료(신규) | 인증 불필요. `Problem`은 사용자에 속하지 않는 공개 마스터 데이터. 사용자별 풀이/방문 기록(누가 언제 풀었는지)은 별도 `Attempt` 이슈가 담당한다 |

---

## 3. 설명 및 설계 고민

### 3.1 이 API가 하는 일

SWEA 문제 페이지에 진입하면 익스텐션이 URL에서 `contestProbId`를 파싱하고, 이를 기준으로 정규화한 `url`과 함께 서버로 보낸다. 서버는 이 값으로:

- 이미 아는 문제면 → **조회**해서 돌려줌
- 처음 보는 문제면 → **새로 생성**해서 돌려줌

이걸 "Upsert(Update + Insert)" 또는 "find-or-create" 패턴이라고 한다. Spring 코드로 보면 이거다.

```java
Problem problem = problemRepository.findByProblemId(problemId)
    .orElseGet(() -> problemRepository.save(new Problem(problemId, url)));
```

**POST 한 번으로 조회와 생성이 둘 다 가능한 이유**는, 메서드 하나 안에 두 로직이 다 들어있기 때문이다. 실제 구현에서는 필수값 검증(`problemId`/`url`이 null이거나 blank면 예외)까지 포함해서 Service 계층에 캡슐화했다.

```java
@Service
@RequiredArgsConstructor
public class ProblemService {

    private final ProblemRepository problemRepository;

    public ProblemUpsertResult upsertProblem(String problemId, String url) {
        if (problemId == null || problemId.isBlank() || url == null || url.isBlank()) {
            throw new InvalidRequestException("problemId와 url은 필수입니다.");
        }
        return problemRepository.findByProblemId(problemId)
            //   ↑ 먼저 "찾아본다" (조회, GET이 하는 일과 동일)
            .map(existing -> new ProblemUpsertResult(existing, false))
            //   ↑ 찾았으면 → 그냥 있는 거 반환, 새로 만들지 않음 (created=false → 컨트롤러가 200 매핑)
            .orElseGet(() -> new ProblemUpsertResult(
                problemRepository.save(new Problem(problemId, url)), true));
                //   ↑ 못 찾았으면 그때서야 새로 만듦 (created=true → 컨트롤러가 201 매핑)
    }
}
```

컨트롤러는 이 `created` 플래그만 보고 상태 코드를 정한다.

```java
@PostMapping
public ResponseEntity<ProblemResponse> identifyProblem(@RequestBody IdentifyProblemRequest request) {
    ProblemUpsertResult result = problemService.upsertProblem(request.problemId(), request.url());
    HttpStatus status = result.created() ? HttpStatus.CREATED : HttpStatus.OK;
    return ResponseEntity.status(status).body(toResponse(result.problem()));
}
```

참고로 순수 조회 전용 GET API였다면 없을 때 그냥 `404`를 반환하고 끝났을 것이다. 여기서는 없으면 알아서 만들어버리는 "편의 기능"까지 포함하고 있어서 이 방식이 필요하다.

### 3.2 왜 GET이 아니라 POST인가

단순 조회면 GET을 쓰겠지만, 이 API는 **없으면 만든다는 부수효과**가 있다. GET은 "서버 상태를 바꾸지 않는다"는 게 원칙이라, 생성 가능성이 있는 동작은 POST로 처리한다.

### 3.3 requestBody와 `@RequestBody`가 값을 꺼내는 방식

```yaml
requestBody:
  content:
    application/json:
      schema:
        properties:
          problemId: { type: string }
          url: { type: string }
```

이 스키마는 클라이언트가 보내는 JSON의 "설계도"다. Spring에서 이 값을 실제로 받는 과정은 다음과 같다.

**1) DTO를 만든다** (JSON 필드명과 자바 필드명을 일치시킴). 실제 구현에서는 클래스 대신 **record**를 써서 getter 대신 컴포넌트 접근자(`problemId()`, `url()`)를 그대로 쓴다.

```java
public record IdentifyProblemRequest(String problemId, String url) {}
```

**2) 컨트롤러 파라미터에 `@RequestBody`를 붙인다**

```java
@PostMapping
public ResponseEntity<ProblemResponse> identifyProblem(@RequestBody IdentifyProblemRequest request) {
    String problemId = request.problemId();  // 여기서 꺼냄 (record 접근자)
    String url = request.url();
}
```

**3) 내부 동작**: 요청이 오면 Spring 내장 JSON 변환기(Jackson)가 JSON의 `"problemId"`, `"url"` 키를 `IdentifyProblemRequest`의 동일한 이름 필드에 자동 매핑한다. 이후 `request.problemId()`처럼 접근자로 값을 꺼내 쓰면 된다.

### 3.4 응답이 상태 코드로만 나뉘는 이유

같은 요청이어도 **서버 내부 상태(이미 있던 문제인지 아닌지)**에 따라 상태 코드가 달라진다.

- **200**: 이미 저장된 문제를 그대로 돌려줌 (저장 재실행 없음)
- **201**: 방금 새로 만들어진 레코드임을 상태 코드로 명확히 함
- **400**: `problemId` 또는 `url` 없이 요청이 오면 `{ code: "INVALID_REQUEST", message }` 형태로 반환

> 💡 v1.0에서는 200/201의 **바디 스키마**로 신규/기존을 구분하려 했지만(`title` vs `createdAt`), 실제로는 `title`이 빠지고 `createdAt`이 항상 의미 있는 값(최초 생성 시각)이 되면서 굳이 바디를 분기할 이유가 없어졌다. **상태 코드 하나로 충분히 구분되므로 바디는 항상 동일한 스키마를 쓴다** — 프론트 입장에서도 응답 파싱 로직이 하나로 단순해진다.

### 3.5 설계 고민 — URL에 id를 넣을지 말지 (A안 vs B안)

`contestProbId`처럼 클라이언트가 이미 알고 있는 식별자를 다룰 때, REST 설계상 두 가지 선택지가 있었다.

**A안 (채택) — POST + body**

```
POST /api/problems
{ "problemId": "AZ8R8haaeYnHBITH", "url": "https://..." }
```

**B안 (미채택) — PUT + path variable**

```
PUT /api/problems/AZ8R8haaeYnHBITH
{ "url": "https://..." }
```

Spring 코드 차이:

```java
// A안 (채택)
@PostMapping
public ResponseEntity<ProblemResponse> identifyProblem(@RequestBody IdentifyProblemRequest request) {
    return problemRepository.findByProblemId(request.problemId())...
}

// B안 (미채택)
@PutMapping("/{contestProbId}")
public ResponseEntity<ProblemResponse> upsertProblem(@PathVariable String contestProbId,
                                                       @RequestBody(required = false) UrlOnlyRequest request) {
    return problemRepository.findByProblemId(contestProbId)...
}
```

조회/생성 로직 자체는 완전히 동일하고, `problemId`라는 값이 body에 있느냐 URL에 있느냐만 다르다.

**이론적으로는 B안이 더 RESTful하다.** `problemId`는 클라이언트가 이미 알고 있는 식별자(주소 개념)라서, URL에 넣고 PUT을 쓰는 게 REST 원칙엔 더 정확하다. `url`처럼 내용물 성격의 값만 body에 두는 게 이상적인 구분이다.

**그럼에도 A안(POST+body)으로 확정한 이유:**

1. **이미 확정된 `/api/attempts`가 이 스타일이다.**

    ```yaml
    POST /api/attempts
    { "problemId": "AZ8R8haaeYnHBITH", "elapsedTime": 342, ... }
    ```

    `problemId`가 있는데도 body에 넣는 방식이다. 프론트가 "id도 다 body에 넣으면 된다"는 한 가지 패턴만 기억하면 되도록 맞췄다. 이번 구현에서 `url`까지 body에 추가하면서도(`problemId`, `url` 둘 다 body) 이 패턴은 그대로 유지됐다 — 새 필드가 늘어도 "식별자와 내용물 모두 body"라는 규칙이 흔들리지 않는다.

2. **Auth API 명세서도 같은 패턴을 쓴다 (결정적 근거).**

    ```yaml
    POST /api/auth/{provider}/callback
    { "code": "...", "redirectUri": "...", "deviceId": "..." }
    ```

    여기서 `provider`(GOOGLE/GITHUB, 고정 카테고리 2개)만 path variable로 쓰고, `deviceId`(실제 레코드를 찾아 연동하는 식별자, `contestProbId`와 성격이 같음)는 body에 넣었다. 로그인 콜백 자체도 "있으면 조회, 없으면 생성"하는 upsert인데 `PUT`이 아니라 `POST`를 쓴다. 팀 전체에서 `PUT`을 쓰는 곳이 한 군데도 없고, **"실제 레코드를 찾는 식별자는 body, 고정 카테고리 값만 path variable"**이라는 암묵적 규칙이 이미 자리 잡혀 있다.

    > 참고로 `/api/users/me`, `/api/auth/logout`, `/api/auth/token/refresh`도 모두 path variable 없이 body 또는 파라미터 없는 형태다. 팀 전체가 "path variable을 아예 안 쓴다"는 게 아니라, **"고정된 카테고리/타입 구분자는 URL에, DB 레코드를 찾는 식별자는 body에"** 넣는다는 기준을 따르고 있다.

3. **MVP는 "배포 후 개발, 최소 동작 버전 우선" 전략이다.**
   이론적 정확성보다 팀 전체가 동일한 패턴으로 빠르게 맞춰가는 실용성이 지금 단계에선 더 중요하다.

**결론**: A안 유지. B안으로 바꾸면 기능은 똑같이 동작하지만, 팀 전체 API 중 `PUT`을 쓰는 유일한 예외가 되고 "식별자는 body에 넣는다"는 관례를 깨게 된다. 나중에 `/api/problems`에 조회(`GET /api/problems/{id}`)·삭제 등 CRUD가 늘어나 리소스 성격이 강해지는 시점이 오면, 그때 팀 전체를 B 스타일로 리팩터링하는 걸 재논의하면 된다.

---

## 4. 변경 이력

| 버전 | 일자 | 변경 내용 |
| --- | --- | --- |
| v1.0 | 2026-08-26 | 지은 최초 작성. `title`(선택) 필드 포함, `url` 필드 없음, 200/201 응답 스키마 분기 |
| v1.1 | 2026-09-03 | 이슈 #5 구현 반영 — `title` 삭제(Out of Scope 확정), `url` 필수 추가, 200/201 응답 스키마 동일화, 400 에러 바디 형식(`{code, message}`) 명시, 인증 불필요·URL 정규화 책임(프론트) 명시. 근거: `docs/features/problem-identification/api-contract.md`, `session-log-2026-09-02.md` |

> 이 문서는 팀 공유용 API 명세서(원본 담당: 지은)이고, `docs/features/problem-identification/api-contract.md`는 TDD 파이프라인(`test-scenarios`/`tdd-red`/`tdd-green`)이 참조하는 내부 단일 기준점이다. 두 문서의 `POST /api/problems` 계약은 동일해야 하며, 이번 v1.1로 서로 일치시켰다.
