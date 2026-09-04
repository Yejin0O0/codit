# Issue 37: [timer-persistence] 위젯에 실제 문제 제목 표시

## 시그니처

> **설계 변경(중요)**: 같은 문제가 `problemDetail.do`와 `solvingProblem.do`에서
> 제목 텍스트 자체가 다르게 나올 수 있음을 실측으로 확인(같은 문제, 다른 표시
> 텍스트). "매번 DOM에서 새로 읽기"는 페이지 전환 시 제목이 바뀌어 보이는
> 문제를 일으킨다. **처음 읽은 제목을 `problemId` 기준으로 캐싱해 같은 문제인
> 동안은 고정**하고, 다른 문제로 바뀌면(다른 `problemId` = 캐시 미스) 자동으로
> 다시 읽는다. `#16`의 `TimerSession` 스키마는 건드리지 않고 완전히 별도
> 저장소로 분리(안 B — 이미 리뷰 대기 중인 PR #33 무변경 원칙).

### 프론트엔드 (TypeScript)

```ts
// content/problem/resolve-problem-title.ts (신규, 순수 DOM 파서 — 변경 없음)
export function resolveProblemTitle(doc: Document): string | null;
```

- `doc.querySelector('p.problem_title')` → 없으면 `null`
- 있으면 직계 텍스트 노드만 골라 이어붙이고 trim (중첩된 배지 `<span class="badge
  badge-a">`는 element 노드라 자동 제외)
- 결과가 빈 문자열이면 `null`

```ts
// content/problem/problem-title-store.ts (신규, adapter)
export async function readProblemTitle(problemId: string): Promise<string | null>;
export async function writeProblemTitle(problemId: string, title: string): Promise<void>;
```

- storage key: `` `session:problem-title:${problemId}` `` (`#16`의 `timer-session:`
  prefix 관습과 동일한 `session:` area, 별도 namespace)
- `chrome.storage.session` 재사용 — Timer Session과 같은 생명주기(세션 범위)가
  자연스러움: 브라우저 재시작 시 같이 사라짐
- 읽기/쓰기 실패는 기존 `store.ts` 관습과 동일하게 fail-soft(`console.warn`, throw 안 함)

```ts
// entrypoints/content/mount.tsx
function performMount(problemId: string): void {
    // 1. 캐시 확인 → 있으면 그대로 사용(다시 안 읽음, 페이지 전환에도 안정적)
    // 2. 없으면 resolveProblemTitle(document)로 읽고, 있으면 캐시에 1회 저장
    // 3. 그래도 없으면 undefined — TimerScreen이 problemId로 폴백
}
```

- `problemId`가 바뀌면(다른 문제) 캐시 키도 바뀌므로 자동으로 다시 읽음 — 별도 처리 불필요

```ts
// entrypoints/content/App.tsx / screens/TimerScreen.tsx
interface AppProps {
    problemTitle?: string | null;
}
interface TimerScreenProps {
    problemTitle?: string | null;
}
```

### 에러 케이스

- `resolveProblemTitle`은 예외를 던지지 않음(순수 DOM 조회) — try/catch 불필요
- `readProblemTitle`/`writeProblemTitle` storage 접근 실패 → `console.warn` 후
  `null`/no-op, throw 안 함 — 실패해도 위젯 동작에 영향 없음(표시만 안 됨)

### 결정 사항

- **TimerScreen 표시 형식(안 A, 기존 결정 유지)**: 제목 있으면 제목만 표시,
  없으면 기존처럼 "문제 #{ID}"로 폴백
- **제목 저장 방식(안 B)**: `TimerSession` 스키마 무변경, 별도
  `problem-title-store.ts`로 분리 + `problemId` 키 캐싱

---

## 테스트 시나리오

### resolveProblemTitle

**정상**
- `[정상] resolveProblemTitle` — `p.problem_title`의 텍스트만 반환한다(중첩된 배지 span 값은 제외)
- `[정상] resolveProblemTitle` — 앞뒤 공백을 trim해서 반환한다

**경계**: 해당 없음 — 실제 DOM 구조상 텍스트 노드 1개 + 배지 span 1개로 단순한 구조.

**예외**
- `[예외] resolveProblemTitle` — `p.problem_title`이 없으면 `null`
- `[예외] resolveProblemTitle` — 텍스트가 공백뿐이면 `null`

### problem-title-store.ts

**정상**
- `[정상] writeProblemTitle` — 저장하면 storage에 값이 들어간다
- `[정상] readProblemTitle` — 저장된 값이 있으면 그대로 반환한다

**경계**
- `[경계] readProblemTitle` — 저장값이 없으면 `null`, `console.warn` 호출 안 됨

**예외**
- `[예외] readProblemTitle` — storage 접근이 throw → `console.warn` + `null`
- `[예외] writeProblemTitle` — storage 접근이 throw → `console.warn`, throw 안 함

### mount.tsx 통합 (캐싱)

**정상**
- `[정상] mountCoditWidget` — 캐시된 제목이 있으면 DOM을 다시 읽지 않고 그 값을 그대로 쓴다(`resolveProblemTitle` 호출 안 됨 — spy로 확인)
- `[정상] mountCoditWidget` — 캐시가 없고 DOM에 제목이 있으면 읽어서 캐시에 저장하고 그 값을 쓴다
- `[정상] mountCoditWidget` — 다른 `problemId`로 mount하면(캐시 미스) 새로 읽는다(문제가 바뀌면 갱신됨을 확인)

**경계**: 해당 없음

**예외**: 없음 — storage 예외는 `problem-title-store.ts` 자체 테스트로 커버, mount 레벨에서는 fail-soft로 흡수(별도 검증 불필요)

### TimerScreen (표시)

**정상**
- `[정상] TimerScreen` — `problemTitle`이 있으면 제목만 표시하고 "문제 #{ID}" 텍스트는 없다

**경계**: `TimerScreen` — `problemTitle`이 없으면 기존처럼 "문제 #{ID}"로 폴백 표시(기존 `App.test.tsx` 테스트가 이미 커버, 신규 작성 불필요 — 회귀 확인용)

**예외**: 없음(표시 로직뿐)

> E2E는 `#16`/`#17`과 동일하게 Green 이후 이 이슈에 바로 추가 예정(별도 이슈 분리
> 안 함) — mock 페이지 두 개(제목이 다른 두 "페이지 타입")를 오가며 같은
> problemId면 처음 읽은 제목이 유지되는지 실제 Chrome에서 검증한다.

---

## AC 커버리지

| AC | 커버 시나리오 |
|---|---|
| 배지 값(D3/D4) 미포함, 순수 텍스트만 | `[정상] resolveProblemTitle` (배지 제외) |
| problemDetail.do·solvingProblem.do 둘 다 같은 셀렉터로 동작 | 단일 셀렉터 구조로 자동 충족(페이지 분기 없음) |
| `p.problem_title` 없으면 null, ID로 폴백 표시 | `[예외] resolveProblemTitle`, `[경계] TimerScreen` 폴백 |
| 공백뿐이면 null | `[예외] resolveProblemTitle` (공백) |
| **같은 문제면 처음 읽은 제목을 유지하고 다시 안 읽는다** | `[정상] mountCoditWidget` (캐시 우선 사용) |
| **다른 문제로 바뀌면 제목을 다시 읽는다** | `[정상] mountCoditWidget` (캐시 미스 시 갱신) |
| storage 예외 시 조용히 무시 | `[예외] readProblemTitle`/`writeProblemTitle` |
| 기존 테스트 회귀 없음 | 기존 `mount.test.tsx`/`App.test.tsx` 그대로 통과 |

---

## Green 완료

263/263 통과(기존 250개 회귀 없음), typecheck/lint 클린. `resolve-problem-title.ts`,
`problem-title-store.ts` 신규 + `mount.tsx`/`App.tsx`/`TimerScreen.tsx` 통합 완료.
