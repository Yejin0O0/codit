# problem-identification PRD

## 1. 개요

사용자가 SWEA 문제 페이지에 접속한 뒤 익스텐션 아이콘을 클릭하면, 페이지 URL의 `contestProbId` 쿼리 파라미터를 파싱해 백엔드에 저장하는 기능. 이 식별 결과(problem_id)는 이후 타이머·태그·풀이 기록(Attempt) 기능이 연결되는 기준점이 된다.

## 2. 사용자 스토리

- SWEA에서 문제를 푸는 사용자로서, 문제 페이지에서 익스텐션 아이콘을 클릭하면 현재 보고 있는 문제가 자동으로 식별되어 저장되기를 원한다. 그래야 나중에 이 문제에 대한 풀이 기록·태그·통계를 이어서 쌓을 수 있다.
- 문제 페이지가 아닌 곳에서 아이콘을 클릭했을 때는, 에러가 아니라 "문제 페이지가 아닙니다"라는 명확한 안내를 받고 싶다.
- 저장이 실패했을 때는 조용히 데이터가 사라지지 않고, 실패했다는 걸 알고 재시도할 수 있기를 원한다.

## 3. 기술 결정

### ADR-1. `Problem`/`ProblemIdentification` 테이블 분리

**Context** — 문제 식별 시 저장할 데이터를 어떤 테이블 구조로 모델링할지 정해야 한다. 향후 태그·Attempt 기능이 "어떤 문제인가"를 참조해야 하므로, 지금 만드는 구조가 이후 확장에 영향을 준다.

**Decision** — `problem`(마스터: `contest_prob_id` unique, `url`)과 `problem_identification`(로그: `problem_id` FK, `user_id`, `identified_at`) 두 테이블로 분리한다. 식별 요청이 오면 `problem`에 해당 `contest_prob_id`가 없으면 생성(upsert)하고, `problem_identification`에 새 레코드를 남긴다.

**Alternatives**
- 단일 테이블에 모두 저장(`problem_identification`에 url 등 전부 포함): 나중에 `title`·`difficulty`·태그 등 문제 마스터 데이터가 필요해지면 정규화 마이그레이션이 불가피해 거부.
- `problem`에 사용자 식별 정보(user_id, identified_at)를 컬럼으로 직접 추가: 한 문제를 여러 사용자가 각자 식별하는 1:N 관계를 표현할 수 없어 거부.

**Consequences** — 장점: 정규화된 구조로 이후 태그·Attempt가 `problem` FK를 그대로 참조 가능. 단점: 테이블이 2개라 조회 시 조인이 필요해지고, 현재 MVP 범위만 보면 다소 과해 보일 수 있음 — 다만 `shared-types`에 이미 `Problem`/`Attempt` 개념이 정의돼 있어 정당화됨.

---

### ADR-2. `CurrentUserProvider` 인터페이스로 사용자 식별 추상화

**Context** — 인증(JWT 발급·검증) 담당 팀원의 작업(#2, #3, #4)이 아직 완료되지 않았다. 이 이슈는 그 작업을 기다리지 않고 진행해야 하며, 나중에 실제 인증이 붙을 때 재작업을 최소화해야 한다.

**Decision** — `CurrentUserProvider` 인터페이스(`Long getCurrentUserId(HttpServletRequest request)`)를 정의한다. 지금은 `Authorization: Bearer <accessToken>` 헤더의 JWT를 서명 검증 없이 payload만 디코드해 `sub` 클레임(Long)을 반환하는 더미 구현체를 Spring Bean으로 등록해 사용한다. #2/#3/#4 완료 후에는 실제 서명 검증을 수행하는 구현체로 Bean만 교체한다.

**Alternatives**
- Spring Security를 이 이슈에서 함께 완전히 구현: 인증 담당 팀원의 작업 범위와 중복되고, `SecurityConfig`를 동시에 건드려 병합 충돌 위험이 커서 거부.
- JWT 없이 평문 헤더로 user_id 직접 전달: `api-contract.md`에 이미 `Bearer` 토큰 방식이 확정돼 있어 계약 위반이므로 거부.

**Consequences** — 장점: 인증 이슈 완료를 기다리지 않고 병렬 개발 가능, 교체 범위가 구현체 1개로 국한. 단점: 더미 구현체가 살아있는 동안은 서명 미검증 상태라 보안 취약 — PR과 이슈에 "#2/#3/#4 완료 후 구현체 교체 필요"를 명시하고, `security-review` 단계에서 반드시 이 사실을 알려진 위험으로 기록해야 한다.

---

### ADR-3. 저장 실패 시 에러 메시지 + 수동 재시도 버튼

**Context** — 문제 식별 API 호출이 실패(네트워크 오류, 서버 오류, JWT 만료 등)할 수 있는데, Codit의 핵심 가치가 정확한 풀이 통계이므로 저장 실패가 사용자 모르게 넘어가면 안 된다.

**Decision** — 팝업에 에러 메시지와 수동 재시도 버튼을 표시한다.

**Alternatives**
- 조용한 실패(아무 표시 없음): 데이터 유실을 사용자가 인지 못 해 핵심 가치를 훼손하므로 거부.
- 백그라운드 자동 재시도 + 지속 실패 시 배지 알림: 재시도 큐와 background↔popup 상태 동기화가 필요해 이번 이슈 범위로는 과함. 향후 개선사항 후보로 `docs/improvements.md`에 남김.

**Consequences** — 장점: 구현이 단순하면서도 사용자가 실패를 인지하고 즉시 대응 가능. 단점: 툴바 클릭형 팝업 특성상 사용자가 재시도 없이 닫아버리면 여전히 유실 가능 — 완전한 해결책은 아니므로 향후 방안 3 도입을 검토할 수 있음.

## 4. Out of Scope

- 문제 제목(`title`)·난이도(`difficulty`) 자동 수집
- 태그 저장/선택 기능 (다음 이슈)
- 대시보드 연동
- 인증(JWT) 발급·검증 시스템 자체 구현 — 별도 이슈(#2 Google, #3 GitHub, #4 Refresh+로그아웃)에 의존. 이번 이슈는 서명 미검증 더미 `CurrentUserProvider`로 구현하고, 위 이슈 완료 후 구현체를 교체한다
- 응답 시간·데이터 크기 등 성능 기준 (추후 결정)
- 백엔드 저장 자동 재시도(백그라운드 큐)

## 5. 용어 정의

| 용어 | 정의 |
|---|---|
| 문제 식별(Problem Identification) | SWEA 문제 페이지 URL의 `contestProbId` 쿼리 파라미터를 파싱해 사용자가 보고 있는 문제를 인식하는 동작 |
| `contestProbId` | SWEA 문제 페이지 URL에 포함된 쿼리 파라미터. 문제를 고유하게 식별하는 값 |
| Attempt(진행 중) | 아직 제출되지 않은, 현재 풀이 중인 시도. `chrome.storage`에 `problem_id` 기준으로 임시 보관되며, 새로고침/재방문 시 중복 식별을 막는 데 쓰인다 |
| 식별 시각(identifiedAt) | 문제가 식별되어 백엔드에 저장된 시점의 타임스탬프 |
