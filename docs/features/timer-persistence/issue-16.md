# Issue 16: [timer-persistence] 새로고침 후 Timer Session continuity

## 시그니처

### 프론트엔드 (TypeScript)

```ts
// content/timer-session/types.ts
export const TIMER_SESSION_VERSION = 1 as const;

export interface TimerSession {
    version: typeof TIMER_SESSION_VERSION;
    problemId: string;
    startedAt: number;
    status: 'running' | 'stopped';
    stoppedAt: number | null;
}
```

```ts
// content/timer-session/store.ts (adapter, chrome.storage.session)
export function isValidTimerSession(value: unknown, now: number): value is TimerSession;
export async function readTimerSession(problemId: string): Promise<TimerSession | null>;
export async function writeTimerSession(problemId: string, session: TimerSession): Promise<void>;
export async function removeTimerSession(problemId: string): Promise<void>;
```

- storage key: `` `session:timer-session:${problemId}` `` (wxt `session:` area + ADR-2 prefix)
- `isValidTimerSession(value, now)` — 구조 검증(version/타입) + `now` 기준 미래 시각·
  `stoppedAt < startedAt` 검증을 한 함수에서 처리 (결정 1: 안 A)
- `readTimerSession` — **저장소 접근 자체가 throw** 하면 `console.warn` 후 `null`
  (결정 2: 안 B — 접근 실패와 "정상적으로 저장값 없음"을 로그로 구분). 값이 있지만
  `isValidTimerSession` 이 거부하는 경우(손상/스키마 불일치)는 기존 `widget-position-
  storage.ts` 관습대로 조용히 `null`(warn 없음) — 손상은 "언젠가 있을 수 있는 정상
  경로"로 취급.
- `writeTimerSession` 실패 시 `console.warn` 1줄, throw 하지 않음(기존 fail-soft 패턴).

```ts
// content/timer-session/session.ts (순수 규칙)
export function deriveInitialState(
    problemId: string,
    stored: TimerSession | null,
    now: number,
): TimerSession;
export function markCompleted(session: TimerSession, now: number): TimerSession;
```

```ts
// entrypoints/content/useTimer.ts — 입력 추가만
export function useTimer(init?: { startedAt: number; stoppedAt: number | null }): {
    elapsedSeconds: number;
    stop: () => void;
};
```

- `init` 없음(기존 6개 테스트) → 지금 동작 그대로.
- `init.stoppedAt !== null` → interval 시작 안 함, `elapsedSeconds` 고정값으로 초기화,
  `running = false`.
- `init.stoppedAt === null` → `startedAtRef = init.startedAt` 로 시작(실제 경과 시간부터
  이어짐).

```ts
// entrypoints/content/App.tsx
interface AppProps {
    problemId: string;
    containerEl?: HTMLElement | null;
    initialSession?: TimerSession; // 없으면 기존과 동일한 fresh 세션으로 동작
}
```

- `useTimer(initialSession ? { startedAt, stoppedAt } : undefined)`
- `screen` 초기값: `initialSession?.status === 'stopped' ? 'result' : 'timer'`
- `handleComplete`: 기존 로직에 `void writeTimerSession(problemId, markCompleted(initialSession, Date.now()))` 추가(fire-and-forget)
- `handleSave`(태그 화면의 인라인 `onSave`를 named 함수로): `void removeTimerSession(problemId)` 추가

```ts
// entrypoints/content/mount.tsx — 시그니처 불변
export function mountCoditWidget(href: string = window.location.href): boolean;
```

컨테이너·Shadow Root 생성은 동기 유지(`mount.test.tsx` 3개 회귀 없음). `SessionStore`
조회 → `<App>` render만 내부적으로 비동기.

```ts
// entrypoints/background.ts
export default defineBackground(() => {
    chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' }).catch(() => {});
    // 기존 console.log 유지
});
```

새 export 없음 — 별도 유닛 테스트 대상 아님.

### 에러 케이스

- storage 접근 throw(read) → `console.warn` + `null` → `deriveInitialState` 가 새 세션 생성
- storage 접근 throw(write) → `console.warn`, 세션은 메모리(React state)로 계속 동작
- 저장값 손상/스키마 불일치/`startedAt` 미래/`stoppedAt < startedAt` → 조용히 `null` → 새 세션
- background access-level 아직 미설정 → read/write 모두 위 throw 경로로 흡수(별도 처리 없음)

### 결정 사항

- 결정 1: `isValidTimerSession(value, now)` 단일 함수 (안 A)
- 결정 2: read 접근 실패만 `console.warn`, "저장값 없음"은 무음 (안 B)

---

## 테스트 시나리오

### store.ts (`isValidTimerSession` / `readTimerSession` / `writeTimerSession` / `removeTimerSession`)

**정상**
- `[정상] isValidTimerSession` — 정상 TimerSession 객체는 유효하다
- `[정상] readTimerSession` — 저장된 유효 세션이 있으면 그대로 반환한다
- `[정상] writeTimerSession` — 저장하면 storage에 값이 들어간다
- `[정상] removeTimerSession` — 저장된 값을 지운다
- `[정상] readTimerSession` — 서로 다른 problemId는 독립된 키로 저장·조회된다 (AC-4/5 근거)

**경계**
- `[경계] isValidTimerSession` — `stoppedAt === startedAt`(0초 경과)은 유효하다
- `[경계] readTimerSession` — 저장값이 아예 없으면(최초 방문) `null`, `console.warn` 호출 안 됨

**예외**
- `[예외] isValidTimerSession` — `version` 불일치는 무효
- `[예외] isValidTimerSession` — `startedAt`이 `now`보다 미래면 무효
- `[예외] isValidTimerSession` — `stoppedAt < startedAt`이면 무효
- `[예외] readTimerSession` — storage 접근이 throw → `console.warn` 호출 + `null`
- `[예외] writeTimerSession` — storage 접근이 throw → `console.warn` 호출, throw 안 함(메모리 유지)

### session.ts (`deriveInitialState` / `markCompleted`)

**정상**
- `[정상] deriveInitialState` — `stored` 있으면 그대로 반환
- `[정상] deriveInitialState` — `stored` 없으면 새 세션(`running`, `stoppedAt: null`, `startedAt: now`) 생성
- `[정상] markCompleted` — `status: 'stopped'`, `stoppedAt: now`로 갱신, 나머지 필드 유지

**경계**
- `[경계] markCompleted` — 순수 함수 성질 확인(같은 입력엔 같은 형태 출력, 원본 객체 불변)

**예외**: 해당 없음 — 순수 함수, 입력은 이미 store에서 검증된 형태로만 들어옴.

### useTimer.ts (추가분)

**정상**
- `[정상] useTimer(진행 중 세션)` — 0초가 아니라 실제 경과 시간부터 이어진다
- `[정상] useTimer(완료된 세션)` — `elapsedSeconds`가 고정값으로 초기화되고 interval이 없어 시간이 지나도 안 바뀐다
- `[정상] useTimer(init 없음)` — 기존 동작 그대로(기존 6개 테스트가 이미 커버, 신규 작성 불필요)

**경계**
- `[경계] useTimer(완료된 세션, stoppedAt === startedAt)` — `elapsedSeconds` 0 고정

**예외**: 해당 없음.

### mount.tsx (추가분, 통합 테스트)

**정상**
- `[정상] mountCoditWidget` — 세션 없으면 새로 생성해 저장하고 그 값으로 App이 뜬다
- `[정상] mountCoditWidget` — 저장된 세션 있으면 그 값으로 App이 뜨고, 재생성(write) 안 함

**경계**: 해당 없음 — 개별 모듈 테스트가 이미 경계 커버. 기존 `mount.test.tsx` 3개는 그대로 회귀 없이 유지.

**예외**
- `[예외] mountCoditWidget` — SessionStore 읽기 실패해도 위젯은 정상 mount, 새 세션으로 시작(SWEA 방해 없음)

### App.tsx (추가분)

**정상**
- `[정상] App(진행 중 세션)` — 타이머 화면에서 경과 시간부터 이어서 표시
- `[정상] App(완료된 세션)` — 결과 선택 화면으로 바로 진입, 경과 시간 고정 표시
- `[정상] App` — "완료" 클릭 시 `writeTimerSession`이 `markCompleted` 결과로 호출됨
- `[정상] App` — success 화면 진입 시 `removeTimerSession` 호출됨
- `[정상] App` — 세션 복원 후에도 안내 문구·배지 DOM이 없다 (AC-12)

**경계**
- `[경계] App(initialSession 생략)` — 기존 동작과 동일(기존 47개 테스트가 이미 커버, 회귀 없음)

**예외**
- `[예외] App` — `writeTimerSession`/`removeTimerSession`이 실패(reject)해도 화면 흐름은 정상 진행(에러 노출 없음)

---

## AC 커버리지

| AC | 커버 시나리오 |
|---|---|
| 새로고침 중 실제 경과시간부터 이어짐 | `[정상] useTimer(진행 중 세션)`, `[정상] App(진행 중 세션)` |
| 완료 후 새로고침 → 결과 화면, 고정 시간 | `[정상] useTimer(완료된 세션)`, `[정상] App(완료된 세션)` |
| success 도달 → 세션 삭제 | `[정상] App` success → removeTimerSession |
| 다른 문제로 이동 → 새 세션, 기존 보존 | `[정상] readTimerSession` 독립 키 |
| 같은 문제 다른 탭 → 이어서 표시 | `[정상] readTimerSession` 독립 키(동일 problemId 재조회) + ADR-4(추가 코드 불필요, storage 전역성만) |
| 손상/미래/모순 값 → 무시, 새 세션 | `[예외] isValidTimerSession` 3종 |
| storage 예외/access level 미설정 → 조용히 무시 | `[예외] readTimerSession`, `[예외] writeTimerSession`, `[예외] mountCoditWidget`, `[예외] App` |
| write는 3지점에서만 | `[정상] App` 완료/success 호출 시나리오로 간접 검증(그 외 지점에서 write 안 함은 코드 구조로 보장) |
| useTimer 기존 회귀 없음 | `[정상] useTimer(init 없음)` — 기존 6개 그대로 |
| background는 access level만 | 코드 확인(리뷰 시점, Vitest 대상 아님) |
| manifest storage만 추가 | 코드 확인 — 이미 #21에서 추가되어 있어 변경 불필요 |
| 안내 문구·배지 없음 | `[정상] App` 안내 문구 없음 |

---

## Green 완료

27개 시나리오 전부 Green(237/237, 기존 210개 포함 회귀 없음). typecheck/lint/build 통과.

- `timer-session/{types,store,session}.ts` 구현 완료
- `useTimer.ts` — `init` 입력 추가, 기존 6개 테스트 무변경 통과
- `App.tsx` — `initialSession` 반영, `handleComplete`/`handleSave`에 write/remove 배선
- `mount.tsx` — `SessionStore` 조회 → `<App>` render 오케스트레이션. React 스케줄러
  타이밍 이슈로 `flushSync` 추가(테스트가 마이크로태스크 1틱만 기다리는데 React 19의
  `createRoot().render()`가 `setImmediate` 기반이라 타이밍이 어긋났음 — `flushSync`로
  동기 완료 보장)
- `background.ts` — `browser.storage.session.setAccessLevel(...)` 추가(idempotent, catch로 무시)

## ac-verifier 검증

12개 AC 중 11개 충족, AC-5(다중 탭)는 아키텍처(storage 전역성)로 보장되나 명시적
테스트 없음(이슈 문서에서 이미 "추가 코드 불필요"로 판단 — 문제 아님). 갭 1건
발견: `removeTimerSession` 실패 시 App 흐름 테스트 누락 → 추가 완료
(`App.test.tsx` "[예외] removeTimerSession 이 실패해도 success 화면은 정상
표시된다"). 238/238 통과.

## E2E (별도 이슈 대신 이 이슈에 바로 추가)

기획 단계엔 없었지만, e2e-infra(#26~#28)에서 만든 인프라(`e2e/fixtures/extension.ts`)를
그대로 재사용해 실제 브라우저 검증을 추가했다. 새 이슈로 분리하지 않고 이 이슈 브랜치에
바로 포함.

- `e2e/timer-persistence.spec.ts` — 타이머 진행 중 실제로 몇 초 기다린 뒤(`expect`
  polling, `waitForTimeout` 미사용) 새로고침해도 0초로 리셋되지 않고 이어지는지 실제
  Chrome에서 검증(AC-1 핵심 플로우). 다중 탭 시나리오(AC-5, ac-verifier가 "아키텍처로만
  보장, 테스트 없음"으로 지적했던 부분)도 실제 탭 두 개로 검증 — 탭 A가 세션을
  생성한 뒤 탭 B가 같은 세션을 이어받고, 탭 A를 새로고침해도 유지됨을 확인.
- 전체 E2E 12/12 통과(기존 widget-drag-move 10개 + 신규 2개), 회귀 없음. AC-5 갭 해소.
