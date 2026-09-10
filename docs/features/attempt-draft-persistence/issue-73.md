# Issue 73: [결과 기록] 완료 후 폼(결과·메모·태그) 새로고침/탭 유실 방지 + 동시 탭 mount 레이스 수정

> 도메인: 완료 후 결과 기록 흐름의 **입력 초안(AttemptDraft)** 영속화.
> `timer-persistence`의 `TimerSession`(순수 measurement)과는 별개 스토어.
> 관련: `docs/features/timer-persistence/prd.md` (ADR-2/ADR-3/ADR-5), `pr10-review-resolved-principles`

---

## 시그니처

### 프론트엔드 (TypeScript)

#### 신규 — `entrypoints/content/attempt-draft/types.ts`

```ts
export const ATTEMPT_DRAFT_VERSION = 1 as const;

/**
 * 완료 후 결과 기록 흐름의 입력 초안. 새로고침·탭 이동을 견딘다.
 * "저장" 도달 시 타이머 세션과 함께 제거된다.
 */
export interface AttemptDraft {
    version: typeof ATTEMPT_DRAFT_VERSION;
    problemId: string;
    /** 'timer'(완료 전)·'success'(저장 후)는 저장하지 않는다. */
    screen: 'result' | 'memo' | 'tags';
    result: ResultType | null;
    memo: string;
    memoOpen: boolean;
    selectedTagIds: string[];
    customTags: Tag[];
}
```

`ResultType` = `../screens`, `Tag` = `../mockData` 에서 import.

#### 신규 — `entrypoints/content/attempt-draft/store.ts`

`timer-session/store.ts` 관습(검증 후 무효면 `null`, 예외는 삼켜 `console.warn` 1줄, throw 안 함) 미러.

```ts
/** chrome.storage.session key. 타이머 세션과 동일 버킷·수명(새로고침 견딤, 브라우저 종료 시 clear). */
// `session:attempt-draft:${problemId}`

export function isValidAttemptDraft(value: unknown): value is AttemptDraft;
export async function readAttemptDraft(problemId: string): Promise<AttemptDraft | null>;
export async function writeAttemptDraft(problemId: string, draft: AttemptDraft): Promise<void>;
export async function removeAttemptDraft(problemId: string): Promise<void>;
```

**`isValidAttemptDraft` 검증 규칙**

- `version === ATTEMPT_DRAFT_VERSION`, `problemId` 는 비어있지 않은 문자열
- `screen ∈ {'result','memo','tags'}`
- `result ∈ {'CORRECT','WRONG','HOLD', null}`
- **`screen ∈ {'memo','tags'}` 이면 `result !== null`** — 아니면 무효(`null` 반환).
  손상 draft 가 `App` 의 `result !== null` 가드에서 timer 화면으로 튕기는 것 방지.
- `memo` 문자열 · `memoOpen` boolean · `selectedTagIds` 는 문자열 배열
- `customTags` 는 배열이며 각 원소가 `{ id: string, name: string }` 최소 shape (`TagOption`)

#### 신규 — `entrypoints/content/timer-session/store.ts` 에 추가

```ts
/**
 * 같은 problemId 에 대한 read-then-write 를 탭 간 직렬화한다 (Web Locks, same-origin 공유).
 * navigator.locks 미지원 환경에서는 fn 을 그대로 실행한다 (fail-soft).
 */
export async function withProblemLock<T>(problemId: string, fn: () => Promise<T>): Promise<T>;
// lock name: `codit:timer-session:${problemId}`
```

#### 변경 — `entrypoints/content/App.tsx`

```ts
interface AppProps {
    // ...기존...
    /** mount.tsx 가 복원한 결과 기록 초안. 생략 시 fresh 흐름. */
    initialDraft?: AttemptDraft;
}

function initialScreen(initialSession?: TimerSession, initialDraft?: AttemptDraft): Screen {
    if (initialDraft) return initialDraft.screen;            // 복원 우선
    if (initialSession?.status === 'stopped') return 'result';
    return 'timer';
}
```

- `result` / `memo` / `memoOpen` / `selectedTagIds` / `customTags` `useState` 초기값을 `initialDraft` 에서 채운다 (없으면 현행 기본값).
- **persist effect**: `screen ∈ {'result','memo','tags'}` 일 때
  `[result, memo, memoOpen, selectedTagIds, customTags, screen]` 변경 시
  `void writeAttemptDraft(problemId, { version, problemId, screen, result, memo, memoOpen, selectedTagIds, customTags })`.
  debounce 없음 (session storage 는 in-memory).
- `handleSave`: 기존 `void removeTimerSession(problemId)` 옆에 `void removeAttemptDraft(problemId)` 추가.
- `screen === 'timer'` 또는 `'success'` 일 때는 write 하지 않는다.

#### 변경 — `entrypoints/content/mount.tsx`

```ts
const [storedSession, storedDraft] = await Promise.all([
    // 세션 생성/복원은 withProblemLock 안에서:
    //   withProblemLock(problemId, async () => {
    //       const stored = await readTimerSession(problemId);
    //       if (stored) return stored;
    //       const fresh = deriveInitialState(problemId, null, Date.now());
    //       await writeTimerSession(problemId, fresh);
    //       return fresh;
    //   })
    readAttemptDraft(problemId),
]);
// <App ... initialSession={session} initialDraft={storedDraft ?? undefined} />
```

#### 테스트 인프라 — `vitest.setup.ts`

`navigator.locks` 미구현(jsdom) 대응 스텁:

```ts
if (!('locks' in navigator)) {
    Object.defineProperty(navigator, 'locks', {
        configurable: true,
        value: { request: (_name: string, cb: () => unknown) => cb() },
    });
}
```

### 에러 케이스

| 조건 | 기대 동작 |
| --- | --- |
| `storage.getItem` 예외 (read) | `console.warn` 1줄, `null` 반환. 흐름 계속 |
| `storage.setItem` 예외 (write) | `console.warn` 1줄, throw 안 함. 화면 흐름 정상 진행 |
| `storage.removeItem` 예외 (remove) | `console.warn` 1줄, throw 안 함. success 화면 정상 표시 |
| 저장된 draft 가 손상(스키마 불일치 / `memo|tags` + `result=null`) | `readAttemptDraft` → `null`. `App` 은 fresh 흐름으로 시작 |
| `navigator.locks` 미지원 | `withProblemLock` 이 `fn()` 을 직접 실행 (락 없이) |

---

## 테스트 시나리오

### 정상

- [정상] isValidAttemptDraft — should return true when a well-formed draft is given
- [정상] isValidAttemptDraft — should accept screen 'result' with result null
- [정상] readAttemptDraft — should return the same draft after writeAttemptDraft
- [정상] readAttemptDraft — should return null when nothing is stored
- [정상] removeAttemptDraft — should make subsequent readAttemptDraft return null
- [정상] withProblemLock — should invoke navigator.locks.request with the problem-scoped lock name and return fn result
- [정상] withProblemLock — should call fn directly and return its result when navigator.locks is unavailable
- [정상] mount — should pass a stored draft to App as initialDraft so it opens on that screen
- [정상] mount — should create the timer session inside withProblemLock
- [정상] mount — should not re-write the timer session when one already exists (inside the lock)
- [정상] App — should open on the memo screen with the stored memo text when initialDraft screen is 'memo'
- [정상] App — should open on the tags screen with the stored tag selected when initialDraft screen is 'tags'
- [정상] App — should open on the result screen with the stored result selected when initialDraft screen is 'result'
- [정상] App — should show the textarea immediately on the CORRECT memo screen when initialDraft.memoOpen is true (ac-verifier 보강)
- [정상] App — should restore customTags from initialDraft into the tag pool
- [정상] App — should behave as before (session-derived screen) when initialDraft is absent
- [정상] App — should call writeAttemptDraft with the chosen result after picking a result
- [정상] App — should call writeAttemptDraft with the typed memo immediately (no debounce)
- [정상] App — should call writeAttemptDraft with screen 'tags' when moving from memo to tags
- [정상] App — should call removeAttemptDraft(problemId) when "저장" is clicked
- [정상] App — should call both removeTimerSession and removeAttemptDraft on the same "저장" event (ac-verifier 보강)

### 경계

- [경계] isValidAttemptDraft — should accept screen 'memo' when result is 'WRONG'
- [경계] readAttemptDraft — should return null when a corrupt value (memo screen, result null) is stored
- [경계] App — should not call writeAttemptDraft while on the timer screen (완료 전)

### 예외

- [예외] isValidAttemptDraft — should reject when version does not match
- [예외] isValidAttemptDraft — should reject when screen is 'memo' and result is null
- [예외] isValidAttemptDraft — should reject when screen is 'tags' and result is null
- [예외] isValidAttemptDraft — should reject when screen is 'timer' or 'success'
- [예외] isValidAttemptDraft — should reject when value is not an object / is null
- [예외] isValidAttemptDraft — should reject when selectedTagIds is not an array of strings
- [예외] isValidAttemptDraft — should reject when result is not an allowed value
- [예외] readAttemptDraft — should return null and warn when storage.getItem throws
- [예외] writeAttemptDraft — should not throw when storage.setItem throws
- [예외] removeAttemptDraft — should not throw when storage.removeItem throws
- [예외] withProblemLock — should propagate the error when fn throws
- [예외] App — should keep the screen flow working when writeAttemptDraft rejects
- [예외] App — should still show the success screen when removeAttemptDraft rejects

### 회귀 (기존 동작 보존)

- [회귀] App — should still restore a running session to the timer screen at the elapsed time (initialDraft 없음)
- [회귀] App — should still restore a stopped session directly to the result screen with frozen elapsed time
- [회귀] mount — should still mount and create a session when no draft and no session exist

---

## AC 커버리지

| AC | 커버 시나리오 |
| --- | --- |
| AC-1 완료 후 진행 상태(결과/메모/태그/화면)가 새로고침해도 유지 | [정상] readAttemptDraft 왕복 / [정상] App initialDraft(memo·tags·result) 복원 3종 / [정상] App writeAttemptDraft(result·memo·screen 전환) 3종 / [정상] App customTags 복원 |
| AC-2 새로고침 시 마지막 화면으로 정확히 복귀 (메모/태그 포함) | [정상] App — memo 화면 복원 / [정상] App — tags 화면 복원 / [정상] App — result 화면 복원 |
| AC-3 "저장" 완료 시 진행 상태 storage 가 타이머 세션과 함께 정리 | [정상] App — "저장" 클릭 시 removeAttemptDraft(problemId) 호출 / [정상] removeAttemptDraft 후 read null / [예외] removeAttemptDraft reject 시 success 정상 |
| AC-4 여러 탭 동시 최초 오픈 시 startedAt 레이스 없이 일관 | [정상] withProblemLock — 락 이름으로 request 호출 / [정상] mount — 세션 생성이 withProblemLock 안에서 / [정상] mount — 기존 세션 있으면 재 write 안 함 / [정상] withProblemLock — locks 미지원 폴백 / [예외] withProblemLock — 에러 전파 |
| AC-5 기존 타이머 세션 복원 동작 회귀 없음 | [회귀] App — running 세션 → 타이머 화면 / [회귀] App — stopped 세션 → 결과 화면 / [회귀] mount — draft·세션 없을 때 기존 mount / [정상] App — initialDraft 없으면 기존 동작 |
| AC-6 typecheck·lint·test·build green | CI 게이트 — 별도 시나리오 없음 |

## E2E (`e2e/attempt-draft-persistence.spec.ts`)

실제 `page.reload()` → content script 재실행 → `chrome.storage.session` 왕복 전 경로 검증.

| 시나리오 | AC |
| --- | --- |
| 결과·메모 입력 후 새로고침 → 메모 화면 + 내용 유지 | AC-1, AC-2 |
| 태그 선택 후 새로고침 → 태그 화면 + 선택 유지 | AC-2 |
| "저장" 후 새로고침 → 초안 정리되어 타이머 화면으로 새로 시작 | AC-3 |

부수 수정: `mount.tsx` 가 `#codit-root` 를 `visibility:hidden` 으로 생성 —
세션/초안/위치 읽기 전 top-right 기본값으로 깜빡이는 것 방지(`useWidgetPosition` 이 위치 확정 후 해제).
withProblemLock 도입으로 mount 가 살짝 늦어지며 드러난 기존 flaky(`widget-drag-move`)도 함께 해소.

### Out of Scope (이슈 명시 — 시나리오 없음)

- 손상 세션 발견 시 사용자 안내(토스트 등)
- 탭 간 실시간 push 동기화 (`storage.watch` / `onChanged`) — 새로고침 시 재읽기까지만
- `viewState`(펼침/접힘) 저장
- 화면 레이아웃 변경
