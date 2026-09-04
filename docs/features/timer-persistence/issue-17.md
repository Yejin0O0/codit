# Issue 17: [timer-persistence] SWEA 문제 페이지 간 continuity (solvingProblem.do 지원)

## 시그니처

### 프론트엔드 (TypeScript)

```ts
// content/problem/resolve-problem-id.ts (신규)
export function resolveProblemId(doc: Document, href: string): string | null;
```

- `parseContestProbId(href)` 우선 → 없으면 `doc.querySelector('#contestProbId')`의
  `value` → 없으면 `doc.querySelector('input[name="contestProbId"]')`의 `value` →
  전부 없거나 빈 문자열이면 `null`

```ts
// entrypoints/content/mount.tsx — 시그니처 불변, 내부 구조만 변경
export function mountCoditWidget(href: string = window.location.href): boolean;
```

- 기존 5단계(container/Shadow/CSS/App div/render+timer-session)를 내부 helper
  `performMount(problemId: string): void`로 추출 — `#16`의 timer-session
  오케스트레이션은 그대로, `problemId`를 얻는 경로만 바뀜
- `resolveProblemId(document, href)`가 즉시 값을 주면 바로 `performMount` 후 `true`
- 못 얻으면 `MutationObserver`로 관찰 시작하고 `false` 반환 — "지금은 안 뜸, 나중에
  관찰돼서 뜰 수도 있음"으로 계약이 넓어짐(AC가 요구하는 새 동작, 기존 테스트 무회귀)
- observer 콜백에서 `resolveProblemId` 재시도 → 성공하면 즉시 disconnect 후
  `performMount`. 이미 `#codit-root`가 있으면(경합 방지) disconnect만 하고 종료
- `pagehide` 시에도 disconnect
- 고정 timeout 없음 — 영원히 안 나타나면 계속 관찰만 함(위젯 미표시, SWEA 방해 없음)

### 에러 케이스

- `resolveProblemId`는 예외를 던지지 않음(순수 문자열/DOM 조회) — try/catch 불필요

### 결정 사항

- **MutationObserver 관찰 범위**: `document.body` 전체(`{ childList: true, subtree:
  true }`) — 실측 결과 `input#contestProbId > form#mainForm > body`로, hidden
  input을 감싼 유일한 안정적 조상(`form#mainForm`)이 페이지 콘텐츠 대부분(코드
  에디터 포함 추정)을 감싸고 있어 좁혀도 실효성이 없음을 확인. 콜백은 가볍게
  유지(querySelector 몇 개)하고 성공 즉시 disconnect.

---

## 테스트 시나리오

### resolveProblemId

**정상**
- `[정상] resolveProblemId` — URL에 `contestProbId`가 있으면 DOM은 보지 않고 그 값을 반환한다
- `[정상] resolveProblemId` — URL에 없고 `#contestProbId`가 있으면 그 값을 반환한다
- `[정상] resolveProblemId` — URL·`#contestProbId` 둘 다 없고 `input[name="contestProbId"]`가 있으면 그 값을 반환한다

**경계**
- `[경계] resolveProblemId` — `#contestProbId`는 존재하지만 `value`가 빈 문자열이면 다음 fallback(`input[name=]`)으로 넘어간다

**예외**
- `[예외] resolveProblemId` — URL·DOM 전부 없으면 `null`
- `[예외] resolveProblemId` — `#contestProbId`가 input이 아닌 요소(`value` 없음)면 무시하고 다음 fallback으로 넘어간다

### mountCoditWidget (통합)

**정상**
- `[정상] mountCoditWidget` — URL엔 없고 hidden input엔 있으면(solvingProblem.do 패턴) 즉시 위젯이 뜬다
- `[정상] mountCoditWidget` — hidden input이 로드 초기엔 없다가 나중에 DOM에 추가되면 그 시점에 위젯이 mount되고 observer가 disconnect된다

**경계**
- `[경계] mountCoditWidget` — 관찰 중 다른 경로로 `#codit-root`가 먼저 생기면 observer는 추가 mount 없이 조용히 disconnect한다

**예외**
- `[예외] mountCoditWidget` — 끝내 식별 안 되면 위젯이 뜨지 않고 SWEA DOM에 변화가 없다
- `[예외] mountCoditWidget` — `pagehide` 발생 시 observer가 disconnect되어 이후 DOM 변화에 반응하지 않는다

> 다중 탭 공유(AC)는 `#16`의 storage 설계(problemId 기반 키)로 이미 자동 충족 — 추가 코드 불필요.
> 모의 테스트 등 범위 밖 경로는 URL·DOM 둘 다 없는 예외 케이스로 자연히 커버 — 별도 분기 불필요.

---

## AC 커버리지

| AC | 커버 시나리오 |
|---|---|
| `resolveProblemId` URL 우선, DOM fallback, 둘 다 없으면 null | `[정상]` 3종 + `[예외]` 2종 |
| solvingProblem.do에서 위젯이 뜬다 | `[정상] mountCoditWidget` (URL엔 없고 hidden input엔 있음) |
| 같은 `contestProbId`면 페이지 이동해도 세션 이어짐 | `#16` storage 설계로 자동 충족(코드 추가 없음) |
| hidden input 지연 등장 시 관찰 후 mount | `[정상] mountCoditWidget` (지연 등장) |
| 로그인/식별 불가 페이지 → 미표시, SWEA 무수정 | `[예외] mountCoditWidget` (끝내 식별 안 됨) |
| 여러 탭 공유 | `#16` 인프라로 자동 충족 |
| 범위 밖 SWEA 경로 미표시 | URL·DOM 없음 예외 케이스로 자연 커버 |
| 기존 테스트 회귀 없음 | `parse-contest-problem-id.test.ts` 7개, 기존 `mount.test.tsx` 9개 그대로 통과 |

---

## Green 완료

249/249 통과(기존 238개 회귀 없음), typecheck/lint 클린. `resolve-problem-id.ts`,
`mount.tsx` 커버리지 100%.

## ac-verifier 검증

5개 AC 영역 전부 코드 수준에서 충족 확인. 갭 1건: 지연 등장으로 mount된 뒤
observer가 실제로 disconnect되어 추가 DOM 변화에 재반응하지 않는지 검증하는
테스트가 없었음 → 추가 완료(`mount.test.tsx` "[경계] 지연 등장으로 mount된 뒤
observer가 disconnect되어 추가 DOM 변화에도 root가 하나만 유지된다").

## E2E (별도 이슈 대신 이 이슈에 바로 추가)

`e2e/timer-persistence.spec.ts`에 2개 시나리오 추가 — `e2e/fixtures/mock-solving-
problem.html`(hidden input 포함, URL엔 contestProbId 없음) 신규.

- `[정상]` problemDetail.do에서 진행 중이던 타이머가 solvingProblem.do로 실제
  페이지 이동해도 이어짐(AC-5, 시나리오 D)
- `[정상]` hidden input이 나중에 나타나도(동적 삽입) 관찰 후 위젯이 뜸(AC-3,
  MutationObserver 지연 등장 경로를 실제 Chrome에서 검증)

전체 E2E 14/14 통과(기존 12개 + 신규 2개), 회귀 없음.
