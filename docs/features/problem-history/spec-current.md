# Problem History — AS-BUILT Current Spec

**Status: AS-BUILT / Retrospective.** PR #10 (`0fda5f6`, `team/develop` 머지)까지의
실제 구현·테스트·리뷰 결과만 기록한다. 새 요구사항을 만들어내지 않는다.

이 문서는 [`issue-9.md`](./issue-9.md) 를 **대체하지 않는다.** `issue-9.md` 는 시그니처·
시나리오·AC·TDD·리팩터·AC검증 로그를 담은 원본이고, 이 문서는 현재 코드 기준의
AS-BUILT 요약이다. UI 는 [`ui-design.md`](./ui-design.md) 참조.

History Filtering 은 별도 Feature 로 만들지 않는다 — Problem History 내부 Capability 다.

---

## 사용자 목적

Codit Extension Page 에서, 지금까지 푼 문제의 풀이 이력을 목록으로 보고 결과·태그로
걸러 보며, 문제별 상세(회차별 시도 타임라인)를 확인한다.

---

## 현재 구현된 동작

**모두 mock 데이터** 기반. 실제 API 없음. 로딩은 `setTimeout` 지연으로 흉내낸다.

### Capability: Navigation State (`HistoryView`)

- `HistoryView` 가 `view: 'list' | 'detail'`, `selectedProblemId`, `resultFilter`,
  `selectedTagIds` 를 소유한다. `<section aria-label="내 문제풀이">`.
- `useProblemHistory` — `loading` → (지연) → `ready`. mock `MOCK_PROBLEMS` 노출
  (props 로 주입 가능, 테스트용).
- ProblemCard 클릭 → `view: 'detail'` + `selectedProblemId`.
- 상세에서 "목록으로" → `view: 'list'`. **필터 상태(`resultFilter`/`selectedTagIds`)는
  유지된다.**
- Router 라이브러리 없음. 화면 전환은 단일 상태.

### Capability: List (`ProblemListView` + `ProblemListContent`)

- 헤더 "내 문제풀이" + `ResultFilterToggleGroup` + `TagFilterPanel` + 조건부
  "필터 해제" 버튼(필터 활성 && filtered-empty 아님).
- 본문(`ProblemListContent`, early return):
  - `status === 'loading'` → `ListSkeleton`.
  - 원본 `problems` 가 비었으면 → `EmptyState variant="empty"`.
  - 필터 결과가 비었으면 → `EmptyState variant="filtered-empty"` + "필터 해제" 액션.
  - 그 외 → `ProblemCard` 목록.
- `ProblemCard` — `#{problemId}` + `ResultBadge` + 제목(조건부) + 메타(`풀이 N회 ·
  mm:ss · 날짜(조건부)`) + `TagChipList`. **native `<button>`** 이 카드 전체를 감싼다.

### Capability: Filtering (`filterProblems`)

- `filterProblems(problems, { result, tagIds })`:
  - result 매치: `result === 'ALL' || problem.latestResult === result`.
  - tag 매치: `tagIds.length === 0 || tagIds.some(id => problem.tagIds.includes(id))`
    → **여러 태그는 OR**.
  - 최종: result 매치 **AND** tag 매치.
  - 입력 배열을 변경하지 않는다.
- `resultFilter` = `'ALL' | 'CORRECT' | 'WRONG' | 'HOLD'` (`ResultFilterToggleGroup`,
  같은 탭 재클릭 시 해제되지 않음).
- `selectedTagIds` = 핵심 + 모든 카테고리 그룹의 단일 전역 선택 집합
  (`TagFilterPanel` → `TagToggleGroup`, 그룹 간 병합).
- "필터 해제" → `resultFilter = 'ALL'`, `selectedTagIds = []`.

### Capability: Detail (`ProblemDetailView`)

- `useProblemDetail(problemId, { resolveDetail, loadDelayMs })` — `loading` → `ready`.
- `loading` → `DetailSkeleton`. `detail === null` → `EmptyState variant="not-found"`
  + "목록으로". 그 외 → `ProblemSummary` + `AttemptTimeline`.
- "← 목록으로" back link (`Button variant="ghost"`).

### Capability: Attempt Timeline (`AttemptTimeline` + `AttemptItem`)

- 입력 `attempts` 배열을 **복사한 뒤 `seq` 내림차순 정렬** (원본 불변).
- `AttemptItem` — 회차(`seq`) · 소요 시간 · 날짜(조건부) · tag chip(조건부) · 메모(조건부).

### Extension Page auth 분기 (`entrypoints/page/App.tsx`)

- `ExtensionPageApp({ initialAuthed })` — `useState(initialAuthed ?? false)` (mock).
- `isAuthed` → `<ExtensionPageShell maxWidth={720} header={<PageHeader userName=MOCK_USER/>}>`
  안에 `<HistoryView />`.
- 미인증 → `maxWidth={400}` + `<PageHeader />`(userName 없음) + "로그인 화면 자리"
  placeholder ("로그인 화면은 이후 이슈에서 구현됩니다").
- `MOCK_USER = 'you@example.com'`. **실제 auth 로직 없음.**

---

## 현재 상태 / 데이터 모델

`entrypoints/page/history/types.ts` (Tag 타입은 `@/lib/tag-catalog` 재노출):

```ts
type AttemptResult = 'CORRECT' | 'WRONG' | 'HOLD';
type ResultFilter  = 'ALL' | AttemptResult;

interface ProblemAttempt {
  seq: number; result: AttemptResult; durationSeconds: number;
  tagIds: string[]; memo?: string; recordedAt?: string;
}
interface ProblemHistoryListItem {
  problemId: string; title?: string; latestResult: AttemptResult;
  attemptCount: number; latestDurationSeconds: number;
  latestSolvedAt?: string; tagIds: string[];
}
interface ProblemHistoryDetail {
  problemId: string; title?: string; latestResult: AttemptResult;
  attemptCount: number; tagIds: string[]; attempts: ProblemAttempt[];
}
```

Product Rule (mock `mock-data.ts` 가 유지, integrity 테스트가 강제):

- 1 Problem : N Attempts.
- `latestResult` / `latestDurationSeconds` = 최대 `seq` Attempt 기준.
- Problem `tagIds` = 모든 Attempt `tagIds` 의 unique union.
- `attemptCount` = `attempts.length`.
- `MOCK_DETAIL_LIST` = 3문제 (`1859` CORRECT/3회, `2178` WRONG/1회, `1012` HOLD/2회).
  `MOCK_PROBLEMS` 는 `toListItem` 으로 파생, `MOCK_DETAILS` 는 `Object.fromEntries`.
- `resolveMockDetail(problemId)` = `MOCK_DETAILS[problemId] ?? null`.

`packages/shared-types` 는 수정하지 않았다 (History 는 feature-local view model).

---

## 주요 Production 코드

| 영역 | 파일 |
|---|---|
| Navigation / 로드 | `history/history-view.tsx`, `history/use-problem-history.ts`, `history/use-problem-detail.ts` |
| List | `history/problem-list-view.tsx` (`ProblemListContent` 내부), `history/problem-card.tsx`, `history/skeletons.tsx`, `history/empty-state.tsx` |
| Filtering | `history/filter-problems.ts`, `history/result-filter-toggle-group.tsx`, `history/tag-filter-panel.tsx` |
| Detail | `history/problem-detail-view.tsx`, `history/problem-summary.tsx`, `history/attempt-timeline.tsx`, `history/attempt-item.tsx` |
| 데이터/타입 | `history/mock-data.ts` (태그 카탈로그 재노출), `history/types.ts` (Tag 타입 재노출), `history/test-fixtures.ts` |
| 공용 조합 | `components/codit/{result-badge,tag-chip-list}.tsx`, `components/ui/skeleton.tsx` |
| Extension Page | `entrypoints/page/App.tsx` (auth 분기) |

---

## 현재 Test 가 보장하는 동작 (47 + page/App 6)

| 파일 (it 수) | 보장 요지 |
|---|---|
| `filter-problems.test.ts` (7) | result ALL → 전체 · latestResult 매치만 남김 · 선택 태그 중 하나라도 union 에 있으면 남김(OR) · result ∧ tag(AND) · 빈 입력 []·전부 매치 시 전체 · 매치 없으면 [] · 입력 불변 |
| `mock-data.test.ts` (2) | `MOCK_PROBLEMS`↔`MOCK_DETAILS` 상호 일관(Product Rule) · 알려진 problemId resolve, 모르는 것 null |
| `history-view.test.tsx` (3) | 클릭한 문제 상세로 전환 후 목록 복귀 · 상세→목록 후 `resultFilter`/`selectedTagIds` 유지 · "필터 해제" 로 result 탭·tag 선택 초기화 + 전체 목록 복원 |
| `problem-list-view.test.tsx` (6) | ready + 필터 비어있지 않음 → ProblemCard 목록 · loading → ListSkeleton(카드 X) · 원본 [] → empty · 필터 매치 0 + 원본 있음 → filtered-empty + "필터 해제" · ALL + 태그 없음 → 필터 해제 컨트롤 숨김 · "필터 해제" 클릭 → `onClearFilters` |
| `problem-card.test.tsx` (7) | problemId/풀이 횟수/mm:ss 항상 · title/날짜/태그 chip 조건부 · click/Enter/Space 각각 `onSelect` 1회 · 키보드 포커스 가능 · title/날짜/태그 undefined 시 생략 |
| `problem-detail-view.test.tsx` (3) | resolve 후 `ProblemSummary`+`AttemptTimeline` · loading 시 상세 스켈레톤 · null resolve 시 not-found |
| `attempt-timeline.test.tsx` (3) | `seq` 내림차순 렌더 · 길이 1 · 정렬 시 입력 배열 불변 |
| `attempt-item.test.tsx` (4) | seq/소요시간/날짜/tag chip/memo 표시 · memo/recordedAt/tagIds undefined·빈 배열 시 생략 |
| `empty-state.test.tsx` (3) | "empty" 안내 문구 · "filtered-empty" 액션 버튼 + `onClick` · "not-found" 액션 버튼 |
| `result-filter-toggle-group.test.tsx` (2) | 전체/정답/오답/보류 표시 + 선택값 `onChange` · 같은 탭 재선택 시 현재 값 유지 |
| `tag-filter-panel.test.tsx` (2) | 새 토글 태그를 `selectedTagIds` 에 병합(다른 그룹 유지) · 해제한 태그만 제거 |
| `use-problem-history.test.ts` (3) | loading→ready + 주입 problems 노출 · 옵션 없으면 `MOCK_PROBLEMS` · 주입 [] 이면 빈 배열 ready |
| `use-problem-detail.test.ts` (1) | ready 후 주입 resolver 로 알려진 problemId detail resolve |
| `problem-summary.test.tsx` (1) | problemId/총 풀이 횟수/union tag chip 표시 |
| `page/App.test.tsx` (6) | `initialAuthed=false` → 로그인 placeholder · 인증 분기 → `HistoryView`(`aria-label="내 문제풀이"`) · 생략 시 기본 placeholder · 비인증 max-width 400 + userName 없는 PageHeader · 인증 max-width 720 + mock userName · 두 분기 같은 document URL(router 없음) |

---

## Resolved Review Feedback

| Commit | 피드백 | 확정 |
|---|---|---|
| `3c15608` `refactor: simplify problem history list rendering` | `ProblemListView` 본문의 4중 중첩 삼항이 가독성 저하 | 본문을 `ProblemListContent` 내부 컴포넌트로 분리, early return. 3개 이상 상태 분기 중첩 시 early return |

### REVIEWED — NO CHANGE

| 항목 | 결론 |
|---|---|
| `ProblemCard` 가 `<button>` 안에 `<div>`(Card) — HTML 스펙상 phrasing content 위반 | **변경하지 않음** (RESOLVED 아님, 현재 결정). native `<button>` 이 click/Enter/Space 활성화를 견고하게 제공하고, 내부에 interactive descendant 가 없다. 대안(`role="button"` div + 수동 keydown, `Card asChild`)은 키보드 a11y 견고성 저하·공유 primitive blast radius 면에서 손해. 대상 브라우저에서 렌더·스크린리더 announce 정상. |

---

## Regression Constraints

1. **List 렌더 구조** — 3개 이상 상태 분기는 `ProblemListContent` 처럼 early return
   으로 표현한다. 중첩 삼항으로 되돌리지 않는다.
2. **태그 카탈로그** — History 는 `@/lib/tag-catalog` 재노출만 한다. 물리 복제 금지
   ([Decision](../../decisions/tag-catalog-single-source-of-truth.md)).
3. **필터 계약** — tag 다중 = OR, result + tag = AND. 목록 복귀 시 필터 유지.
4. **Attempt 정렬** — `seq` 내림차순, 원본 배열 불변.
5. **feature-local 타입** — `packages/shared-types` 를 History mock 에 맞춰 수정하지
   않는다. `history/types.ts` 가 view model SoT.
6. **`ProblemCard` native `<button>` 구조** — REVIEWED — NO CHANGE. `role="button"`
   div 등으로 바꾸지 않는다.
7. **Router 미도입** — 화면 전환은 단일 상태(`view`).

---

## Known Gaps

- 전부 mock — 실제 `GET /api/problems` / `GET /api/attempts` 연동 없음. 로딩은
  `setTimeout` 흉내.
- 인증이 mock — `entrypoints/page/App.tsx` 는 `initialAuthed` prop 만 보고, 실제
  로그인/세션 판정 없음. 미인증 분기는 placeholder.
- API error state 없음 (mock 이라 실패 경로가 없음).
- result enum 이 `CORRECT | WRONG | HOLD` — `packages/shared-types` 의 `Attempt.result`
  (`CORRECT | WRONG | TIMEOUT | COMPILE_ERROR`) 및 백엔드 API draft(`GIVE_UP`)와
  불일치. `docs/handoff/frontend-handoff.md` §8-B.
- `Tag` payload 형식(tagId[] vs name[]) 미확정. handoff §8-C.

---

## Follow-up

- **API Integration** — `POST /api/problems` / `GET /api/tags` / `GET /api/attempts`
  연동. 계약 mismatch(result enum, tag payload, normalizedUrl)는
  `docs/handoff/frontend-handoff.md` §8. 계약 확정 후 진행.
- **Auth 연동** — 다른 FE 담당자 범위(Social Login only). `entrypoints/page/App.tsx`
  의 `isAuthed` 를 실제 인증 상태와 연결. 그때 `App.tsx` 는 공유 integration boundary.

---

## Deferred

- Attempt 저장·편집 UI.
- 문제 제목/난이도 표시 (shared-types 정렬 후).
- 검색 / 정렬 / 페이지네이션.

---

## 관련 Commit

`4e09ede`(핵심 구현 — Problem History Mock UI) · `3c15608`(list rendering) ·
`6971b55`(태그 카탈로그 SoT) · `ca6b713`(Extension Page foundation — 컨테이너) ·
`321f54c`(lint) · `5702ef4`(테스트 설명 한국어).
