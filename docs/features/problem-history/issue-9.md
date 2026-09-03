# Issue 9: [FE] Problem History Mock UI

> Source of Truth: GitHub Issue #9, `docs/features/problem-history/ui-design.md`,
> `docs/ui/ui-architecture.md`, `docs/ui/design-system.md`, #7 Extension Page Foundation.
> **사용 안 함**: `docs/features/auth/ui-design.md` (email/password 기반 구설계 — Social Login only 결정과 불일치).
> test-scenarios 스킬 산출물 — 시그니처 + 테스트 시나리오 + AC 커버리지.

---

## 범위 · 경계

### In Scope

- History UI: `HistoryView` / Problem List / `ProblemCard` / Result filter / Tag filter / Empty state / Problem Detail / Attempt timeline·item / `ResultBadge`
- 목록 ↔ 상세 전환, 필터 상태 (list/detail 전환에도 유지)
- feature-local mock data + view-model 타입
- `isAuthed = true` 분기에 `<HistoryView />` 연결 (App.tsx 최소 변경)
- 신규 primitive: `components/ui/skeleton.tsx`
- 승격 조합: `components/codit/result-badge.tsx`, `components/codit/tag-chip-list.tsx`

### Out of Scope

- 실제 API / backend / persistence / `chrome.storage`
- Timer ↔ History 실제 데이터 연결, SWEA problem detection 연결
- Auth 구현 / Social Login / Login UI / SignUp UI / Auth API / JWT / OAuth / logout / 실제 인증 상태 판정
- #7 Foundation 재설계
- `packages/shared-types` 수정 / API Contract 변경
- toolbar / manifest / `chrome` API 진입점
- 대시보드 통계·차트, 태그별 취약도·복습 화면, 자동 추천, 재도전, Attempt 수정·삭제, 검색
- 페이지네이션 / 무한 스크롤 / 정렬 옵션 UI
- 태그 필터 AND(교집합) 모드 (OR 고정)
- Promise 기반 API layer / repository / service / storage abstraction (로딩은 로컬 `setTimeout` delay만)

### Integration Boundary (`entrypoints/page/App.tsx`)

Auth UI는 다른 FE 담당자가 구현 → App.tsx는 공동 수정 표면. #9 변경은 `HistoryView` import + `isAuthed=true` 분기 연결로 최소화. Auth state / Social Login 코드 미추가.

### 후속 정리 대상 (#9 범위 아님)

- Timer / History **tag catalog 공통 SoT 승격** — 현재는 History feature-local mock catalog로 timer taxonomy를 물리 복제. 실제 API/storage contract 연결 전 공통화.
- `packages/shared-types` `Attempt.result`(`CORRECT/WRONG/TIMEOUT/COMPILE_ERROR`) ↔ History `CORRECT/WRONG/HOLD` **FE-BE contract alignment**.
- Timer `content/screens.ts`의 `ResultType` union ↔ History `AttemptResult` 중복 — 실제 연결 시 정리.
- `docs/features/auth/ui-design.md` deprecate / Social Login 재설계 (Auth 담당자, `fe-ui-design`).

---

## 시그니처

> 반환 타입 주석은 설명용. 실제 구현은 기존 패턴대로 implicit 반환 + `cn()` className 병합.
> **의존 방향**: `domain/view-model (history/types.ts) → UI component` 허용. 역방향(`components/codit/*` → `history/types.ts`) 금지.

### `entrypoints/page/history/types.ts` — feature-local view-model (SoT)

> `components/codit/**` 을 import 하지 않는다. `AttemptResult` 와 마찬가지로 `TagOption` / `TagCategory` 도 여기가 SoT.
> `TagToggleGroup` 등에는 **구조적으로 호환되는 값**을 전달한다 (nominal import 없음).

```ts
export interface TagOption {
    id: string;
    name: string;
}
export interface TagCategory {
    title: string;
    tags: TagOption[];
}

export type AttemptResult = 'CORRECT' | 'WRONG' | 'HOLD';
export type ResultFilter = 'ALL' | AttemptResult;

export const RESULT_LABELS: Record<AttemptResult, string>;        // 정답 / 오답 / 보류
export const RESULT_FILTER_LABELS: Record<ResultFilter, string>;  // 전체 / 정답 / 오답 / 보류

export interface ProblemAttempt {
    seq: number;
    result: AttemptResult;
    durationSeconds: number;
    tagIds: string[];
    memo?: string;
    recordedAt?: string;
}
export interface ProblemHistoryListItem {
    problemId: string;
    title?: string;
    latestResult: AttemptResult;       // 가장 최근(가장 큰 seq) Attempt의 result
    attemptCount: number;
    latestDurationSeconds: number;
    latestSolvedAt?: string;
    tagIds: string[];                   // 전체 Attempt tagIds의 union
}
export interface ProblemHistoryDetail {
    problemId: string;
    title?: string;
    latestResult: AttemptResult;
    attemptCount: number;
    tagIds: string[];                   // union
    attempts: ProblemAttempt[];         // 순서 무관 — AttemptTimeline이 정렬
}
```

### `components/ui/skeleton.tsx` (신규 primitive)

```ts
function Skeleton(props: React.ComponentProps<'div'>): React.JSX.Element;
export { Skeleton };
```

**계약**: `data-slot="skeleton"` · 전달 `className` 병합 · `...props` spread. 시각(pulse 애니메이션)은 shadcn 표준 스타일을 따르되 **정확한 class 문자열을 unit contract로 고정하지 않는다** (AC verifier / 브라우저 검증).

### `components/codit/result-badge.tsx` (신규, EXTEND ← Badge — domain 타입 미소유)

```ts
type ResultBadgeResult = 'CORRECT' | 'WRONG' | 'HOLD';  // UI-local, history/types.ts 미import

interface ResultBadgeProps {
    result: ResultBadgeResult;
    className?: string;
}
export function ResultBadge(props: ResultBadgeProps): React.JSX.Element;
// 내부 상수: LABELS(정답/오답/보류) + TONE(border/bg/text: --success / --destructive / --warning)
```

**unit 계약**: `CORRECT → 정답` / `WRONG → 오답` / `HOLD → 보류` 라벨 · `className` 병합. semantic color(Tailwind class 문자열)는 unit 고정 대상이 아님 — AC verifier / 브라우저 UI 검증.

### `components/codit/tag-chip-list.tsx` (신규, thin — history/types.ts 미의존)

```ts
interface TagChipOption {
    id: string;
    name: string;
}
interface TagChipListProps {
    tagIds: string[];
    catalog: TagChipOption[];
    className?: string;
}
export function TagChipList(props: TagChipListProps): React.JSX.Element | null;
// catalog에 없는 id는 생략. 남는 chip이 0이면 null 반환.
```

### `entrypoints/page/history/empty-state.tsx` (신규, CUSTOM)

```ts
interface EmptyStateProps {
    variant: 'empty' | 'filtered-empty' | 'not-found';
    action?: { label: string; onClick: () => void };
}
export function EmptyState(props: EmptyStateProps): React.JSX.Element;
// variant별 고정 문구 내부 상수. action 있으면 <Button variant="ghost">.
//   empty          : "아직 기록된 문제풀이가 없어요" + 안내
//   filtered-empty : "조건에 맞는 문제가 없어요" + action(필터 해제)
//   not-found      : "이 문제의 풀이 기록을 찾을 수 없어요" + action(목록으로)
```

### `entrypoints/page/history/filter-problems.ts` (신규, 순수 함수)

```ts
export function filterProblems(
    problems: ProblemHistoryListItem[],
    filters: { result: ResultFilter; tagIds: string[] },
): ProblemHistoryListItem[];
// resultMatch = filters.result === 'ALL' || p.latestResult === filters.result
// tagMatch    = filters.tagIds.length === 0 || filters.tagIds.some(t => p.tagIds.includes(t))   (OR)
// keep if resultMatch && tagMatch                                                               (AND)
// 입력 배열 mutate 안 함
```

### `entrypoints/page/history/use-problem-history.ts` (신규 훅)

```ts
type LoadStatus = 'loading' | 'ready';

interface UseProblemHistoryOptions {
    problems?: ProblemHistoryListItem[];   // 미지정 시 MOCK_PROBLEMS
    loadDelayMs?: number;                  // 미지정 시 MOCK_LOAD_DELAY_MS
}
export function useProblemHistory(options?: UseProblemHistoryOptions): {
    status: LoadStatus;
    problems: ProblemHistoryListItem[];
};
// useState('loading') + useEffect(setTimeout → 'ready'), cleanup clearTimeout. Promise/API layer 없음.
```

### `entrypoints/page/history/use-problem-detail.ts` (신규 훅)

```ts
interface UseProblemDetailOptions {
    resolveDetail?: (problemId: string) => ProblemHistoryDetail | null;  // 미지정 시 resolveMockDetail
    loadDelayMs?: number;
}
export function useProblemDetail(
    problemId: string,
    options?: UseProblemDetailOptions,
): {
    status: LoadStatus;
    detail: ProblemHistoryDetail | null;   // resolver가 못 찾으면 null (방어적 empty)
};
```

### `entrypoints/page/history/history-view.tsx` (신규, 오케스트레이터)

```ts
interface HistoryViewProps {
    problems?: ProblemHistoryListItem[];                                  // → useProblemHistory
    resolveDetail?: (problemId: string) => ProblemHistoryDetail | null;   // → ProblemDetailView → useProblemDetail
    loadDelayMs?: number;                                                 // → 두 훅
}
export function HistoryView(props?: HistoryViewProps): React.JSX.Element;
```

- root `<section aria-label="내 문제풀이">`
- 내부 상태: `view: 'list' | 'detail'`, `selectedProblemId: string | null`, `resultFilter: ResultFilter`(기본 `'ALL'`), `selectedTagIds: string[]`(기본 `[]`)
- **`selectedTagIds`는 모든 태그 그룹(핵심 + 더보기 카테고리별)의 단일 Source of Truth.** 특정 그룹의 토글 결과가 다른 그룹의 선택을 삭제하면 안 된다.
- `ProblemCard` 클릭 → `selectedProblemId` + `view='detail'` / `BackLink` → `view='list'` (**필터 상태 유지**)
- `useProblemHistory({ problems, loadDelayMs })` 사용, `mock-data`의 `TAG_CATALOG`/`CORE_TAGS`/`TAG_CATEGORIES` 하위 전달

### `entrypoints/page/history/problem-list-view.tsx` (신규)

```ts
interface ProblemListViewProps {
    status: 'loading' | 'ready';
    problems: ProblemHistoryListItem[];       // 필터 전 원본
    resultFilter: ResultFilter;
    selectedTagIds: string[];
    coreTags: TagOption[];
    categories: TagCategory[];
    tagCatalog: TagOption[];                  // id→name lookup (ProblemCard chip)
    onResultFilterChange: (next: ResultFilter) => void;
    onSelectedTagIdsChange: (next: string[]) => void;
    onClearFilters: () => void;
    onSelectProblem: (problemId: string) => void;
}
```

분기:
- `status === 'loading'` → `<ListSkeleton />`
- 원본 `problems.length === 0` → `EmptyState('empty')`
- `filterProblems(...)` 결과 0건 & 원본 ≥ 1 → `EmptyState('filtered-empty')` + [필터 해제]
- else → `<ProblemCard>` 목록
- `ClearFiltersButton`(인라인 `Button variant="ghost"`): `resultFilter !== 'ALL' || selectedTagIds.length > 0` 일 때만 렌더

### `entrypoints/page/history/result-filter-toggle-group.tsx` (신규, EXTEND ← ToggleGroup single)

```ts
interface ResultFilterToggleGroupProps {
    value: ResultFilter;
    onChange: (next: ResultFilter) => void;
}
// options: ALL / CORRECT / WRONG / HOLD (RESULT_FILTER_LABELS). 탭 자체 중립색.
// ToggleGroup type="single" — 빈 값(deselect) 무시하고 항상 하나 선택 유지.
```

### `entrypoints/page/history/tag-filter-panel.tsx` (신규, EXTEND ← Collapsible + TagToggleGroup)

```ts
interface TagFilterPanelProps {
    coreTags: TagOption[];
    categories: TagCategory[];
    selectedTagIds: string[];                        // 전역 선택 (모든 그룹의 SoT)
    onSelectedTagIdsChange: (next: string[]) => void; // 병합된 전역 목록을 돌려준다
}
// Collapsible 트리거 + 선택 요약 chip / 펼침: TagToggleGroup(coreTags) + 중첩 Collapsible "더보기"(categories별 TagToggleGroup)
// 직접입력 없음. 닫아도 선택 유지.
// 각 내부 TagToggleGroup 은 자신의 item 만 반영하고 다른 그룹 선택은 보존한다 (기존 tag-toggle-group.tsx 병합 로직).
// → 핵심에서 BFS 선택 + 더보기에서 DP 선택 시 selectedTagIds = [BFS, DP]. BFS 해제 시 [DP] 유지.
```

### `entrypoints/page/history/problem-card.tsx` (신규, EXTEND ← Card)

```ts
interface ProblemCardProps {
    problem: ProblemHistoryListItem;
    tagCatalog: TagOption[];
    onSelect: () => void;
}
// 활성화: click / Enter / Space → onSelect (한 번만, 중복 호출 없음). 키보드 포커스 가능.
//   native <button> 래핑 우선. Card 구조상 role="button" + tabIndex=0 사용 시에도 Enter/Space 핸들 + focusable.
// 항상: "#{problemId}" · <ResultBadge result={problem.latestResult} /> · "풀이 {attemptCount}회" · formatDuration(latestDurationSeconds)
// 조건부: title / latestSolvedAt(메타 라인) / <TagChipList tagIds={problem.tagIds} catalog={tagCatalog} />
```

### `entrypoints/page/history/problem-detail-view.tsx` (신규)

```ts
interface ProblemDetailViewProps {
    problemId: string;
    tagCatalog: TagOption[];
    resolveDetail?: (problemId: string) => ProblemHistoryDetail | null;
    loadDelayMs?: number;
    onBack: () => void;
}
```

- `useProblemDetail(problemId, { resolveDetail, loadDelayMs })`
- `status === 'loading'` → `<DetailSkeleton />`
- `detail === null` → `EmptyState('not-found')` (+ [목록으로] → `onBack`)
- else → BackLink(인라인 `Button variant="ghost"` "← 목록으로" → `onBack`) + `<ProblemSummary />` + `<AttemptTimeline />`

### `entrypoints/page/history/problem-summary.tsx` (신규)

```ts
interface ProblemSummaryProps {
    detail: Pick<ProblemHistoryDetail, 'problemId' | 'title' | 'latestResult' | 'attemptCount' | 'tagIds'>;
    tagCatalog: TagOption[];
}
// "문제 #{problemId}" + title(조건부) · <ResultBadge result={latestResult} /> · "총 풀이 횟수 {attemptCount}회" · <TagChipList tagIds={detail.tagIds} catalog={tagCatalog} />
```

### `entrypoints/page/history/attempt-timeline.tsx` + `attempt-item.tsx` (신규, CUSTOM)

```ts
interface AttemptTimelineProps {
    attempts: ProblemAttempt[];      // 정렬 무관
    tagCatalog: TagOption[];
}
// const ordered = [...attempts].sort((a, b) => b.seq - a.seq);  ← props 배열 mutate 금지

interface AttemptItemProps {
    attempt: ProblemAttempt;
    tagCatalog: TagOption[];
}
// "{seq}회차" · <ResultBadge result={attempt.result} /> · formatDuration(attempt.durationSeconds)
// 조건부: recordedAt(우측 날짜) / <TagChipList tagIds={attempt.tagIds} catalog={tagCatalog} /> (개별 tagIds) / "메모 {memo}"
// 구분선: border-t 유틸 (Separator 컴포넌트 추가 안 함)
```

### `entrypoints/page/history/skeletons.tsx` (신규)

```ts
export function ListSkeleton(): React.JSX.Element;    // <Skeleton> 카드형 × 3
export function DetailSkeleton(): React.JSX.Element;  // <Skeleton> 요약 + attempt × 2
```

### `entrypoints/page/history/mock-data.ts` (신규)

```ts
export const MOCK_LOAD_DELAY_MS: number;               // 400
export const CORE_TAGS: TagOption[];                   // timer 핵심 11종 복제
export const TAG_CATEGORIES: TagCategory[];            // timer "더보기" 카테고리 복제 (전체)
export const TAG_CATALOG: TagOption[];                 // CORE_TAGS + 모든 category.tags flat (id→name lookup)
export const MOCK_PROBLEMS: ProblemHistoryListItem[];  // title·date·tags 유/무, latestResult 3종, attemptCount 다양
export const MOCK_DETAILS: Record<string, ProblemHistoryDetail>;  // 회차별 result 변화(오답→정답 등), memo/recordedAt/tags 유/무
export function resolveMockDetail(problemId: string): ProblemHistoryDetail | null;
```

**Contract integrity (테스트로 강제)** — `MOCK_DETAILS`가 존재하는 각 Problem에 대해:
- `list.attemptCount === detail.attempts.length`
- `list.latestResult === (가장 큰 seq Attempt).result`
- `list.latestDurationSeconds === (가장 큰 seq Attempt).durationSeconds`
- `Set(list.tagIds) === Set(detail.tagIds)` (순서 무관)
- `Set(detail.tagIds) === (모든 attempt.tagIds의 중복 없는 union)`
- `latestSolvedAt` / `recordedAt`은 optional — 추가 도메인 규칙 없음. 배열 **순서**는 계약이 아님.
- 목적: mock 데이터가 Product Rule("1 Problem : N Attempts / latest result / tag union")을 위반하지 않게 고정.

### `entrypoints/page/App.tsx` 수정 (최소)

```diff
+ import { HistoryView } from './history/history-view';
  ...
  if (isAuthed) {
      return (
          <ExtensionPageShell maxWidth={HISTORY_MAX_WIDTH} header={<PageHeader userName={MOCK_USER} />}>
-             <section aria-label="문제풀이 기록 화면 자리">
-                 <p className="text-muted-foreground text-sm">문제풀이 기록 화면은 이후 이슈에서 구현됩니다.</p>
-             </section>
+             <HistoryView />
          </ExtensionPageShell>
      );
  }
```

유지: `HISTORY_MAX_WIDTH`(720) / `AUTH_MAX_WIDTH` / `MOCK_USER` / `initialAuthed=false` 분기 / `ExtensionPageShell` 구조. Auth state / Social Login 코드 미추가.
#7 `App.test.tsx`: `'문제풀이 기록 화면 자리'` 참조 2건(`initialAuthed=true` placeholder, `both branches same URL`) → `HistoryView`(`aria-label="내 문제풀이"`) 렌더 검증으로 갱신. `maxWidth 720` + `MOCK_USER` + `initialAuthed=false` 검증 유지.

### 에러 케이스

| 조건 | 동작 |
|---|---|
| 리스트 로딩 중 | `ListSkeleton` ×3, `ProblemCard` 미렌더 |
| mock 데이터 0건 | `EmptyState('empty')` |
| 필터 매칭 0건 (원본 ≥1) | `EmptyState('filtered-empty')` + [필터 해제] |
| 필터 비활성(`'ALL'` & tags 0) | `ClearFiltersButton` 미렌더 |
| Detail 로딩 중 | `DetailSkeleton` |
| `resolveDetail` → `null` (알 수 없는 id) | `EmptyState('not-found')` + [목록으로] |
| 정렬 안 된 `attempts` | `AttemptTimeline` 내부 복사 후 `seq` 내림차순 (원본 불변) |
| `title` / `recordedAt` / `latestSolvedAt` 없음 | 해당 줄/영역 생략 |
| `tagIds` 0개 | `TagChipList` → `null`, 영역 생략 |
| `tagCatalog`에 없는 `tagId` | 해당 chip 생략, 크래시 없음 |
| view 전환 (list↔detail) | `resultFilter`·`selectedTagIds` 유지 |
| `filterProblems` 입력 배열 | mutate 안 함 |

---

## 테스트 시나리오

> 단위 시나리오는 **public behavior / 컴포넌트 계약** 중심. Tailwind class 문자열·픽셀 위치·전체 className snapshot을 계약으로 고정하지 않는다.

### 정상 (30)

- [정상] filterProblems — should return all problems when result is 'ALL' and tagIds is empty
- [정상] filterProblems — should keep only problems whose latestResult equals the selected result
- [정상] filterProblems — should keep a problem when any selected tag is in its union tagIds (OR)
- [정상] filterProblems — should combine result and tag filters with AND
- [정상] useProblemHistory — should expose status 'loading' then 'ready' with the injected problems
- [정상] useProblemHistory — should use MOCK_PROBLEMS when no problems option is given
- [정상] useProblemDetail — should resolve the detail for a known problemId via the injected resolver
- [정상] ResultBadge — should render label 정답 / 오답 / 보류 for CORRECT / WRONG / HOLD
- [정상] ResultBadge — should merge className onto the badge
- [정상] TagChipList — should render a chip per known tagId using the catalog name
- [정상] Skeleton — should render with data-slot="skeleton" and merge className
- [정상] EmptyState — should render the variant text and call action.onClick when the action button is clicked
- [정상] ResultFilterToggleGroup — should render 전체/정답/오답/보류 and call onChange with the picked ResultFilter
- [정상] TagFilterPanel — should merge a newly toggled tag into selectedTagIds while keeping other groups' selections (core + 더보기 both retained)
- [정상] TagFilterPanel — should drop only the deselected tag and keep the other group's selection
- [정상] ProblemCard — should always render problemId, ResultBadge(latestResult), attempt count, and mm:ss duration
- [정상] ProblemCard — should render title, date, and tag chips when the data is present
- [정상] ProblemCard — should call onSelect once on click
- [정상] ProblemCard — should call onSelect once on Enter key
- [정상] ProblemCard — should call onSelect once on Space key
- [정상] ProblemCard — should expose a keyboard-focusable activation target
- [정상] ProblemSummary — should render problemId, ResultBadge, total attempt count, and union tag chips
- [정상] AttemptItem — should render 회차 label, ResultBadge(result), duration, date, tag chips, and memo when present
- [정상] AttemptTimeline — should render AttemptItems ordered by seq descending
- [정상] ProblemListView — should render a ProblemCard list when status is 'ready' and filtered result is non-empty
- [정상] ProblemDetailView — should render ProblemSummary + AttemptTimeline when the detail resolves
- [정상] HistoryView — should switch to detail view with the clicked problemId and back to list via BackLink
- [정상] HistoryView — should keep resultFilter and selectedTagIds after returning from detail to list
- [정상] mock-data — MOCK_PROBLEMS and MOCK_DETAILS should be mutually consistent (attemptCount, latestResult/duration from the highest-seq attempt, list.tagIds ↔ detail.tagIds ↔ union of all attempt.tagIds as sets)
- [정상] App(ExtensionPageApp) — should render HistoryView (aria-label "내 문제풀이") inside ExtensionPageShell max-width 720 with PageHeader showing the mock userName, in the authenticated branch

### 경계 (6)

- [경계] filterProblems — should return an empty array when problems is empty
- [경계] filterProblems — should return an empty array when a selected tag matches no problem's union tagIds
- [경계] useProblemHistory — should expose an empty problems array (and reach 'ready') when injected problems is []
- [경계] AttemptTimeline — should render a single AttemptItem when attempts has length 1
- [경계] ResultFilterToggleGroup — should keep the current value when the same tab is re-selected (no deselect to empty)
- [경계] TagChipList — should render null when tagIds is empty

### 예외 (17)

- [예외] filterProblems — should not mutate the input problems array
- [예외] AttemptTimeline — should not mutate the input attempts array when sorting (renders a copied, sorted list)
- [예외] ProblemCard — should omit the title line when problem.title is undefined
- [예외] ProblemCard — should omit the date from the meta line when latestSolvedAt is undefined
- [예외] ProblemCard — should omit the tag chip row when tagIds is empty
- [예외] AttemptItem — should omit the memo line when memo is undefined
- [예외] AttemptItem — should omit the right-side date when recordedAt is undefined
- [예외] AttemptItem — should omit the tag chip row when the attempt's tagIds is empty
- [예외] TagChipList — should skip a tagId that is not in the catalog without crashing
- [예외] ProblemListView — should render ListSkeleton (not ProblemCards) when status is 'loading'
- [예외] ProblemListView — should render EmptyState('empty') when the source problems array is empty
- [예외] ProblemListView — should render EmptyState('filtered-empty') + 필터 해제 button when filters match nothing but source has items
- [예외] ProblemListView — should hide ClearFiltersButton when resultFilter is 'ALL' and no tag is selected
- [예외] ProblemListView — should reset resultFilter to 'ALL' and clear tags when 필터 해제 is clicked
- [예외] ProblemDetailView — should render DetailSkeleton while status is 'loading'
- [예외] ProblemDetailView — should render EmptyState('not-found') + 목록으로 when the detail resolves to null
- [예외] App(ExtensionPageApp) — should still render the login placeholder (aria-label "로그인 화면 자리") in the unauthenticated branch (unchanged by #9)

### 빌드·통합 · AC 독립검증 (non-unit — create-pr / AC verifier)

> 다음은 Vitest unit test로 "파일이 수정되지 않았다"를 증명하지 않는다. AC verifier / `git diff` / `package.json` diff / source review / 실제 브라우저로 독립 검증한다.

**[통합]** (런타임 · 빌드)
- **Production entrypoint 검증** — `wxt build` 후 실제 `page.html`이 **현재 기본 진입(`initialAuthed=false`)**에서 런타임 에러 없이 정상 렌더된다. #7 unauthenticated branch 계약(로그인 placeholder 렌더)을 깨지 않는다.
- **History 실제 브라우저 렌더 검증** — `HistoryView` 또는 `ExtensionPageApp({ initialAuthed: true })`를 **테스트/검증용 환경**에서 실제 브라우저로 렌더해 확인한다. Production 코드에 영구 auth bypass를 추가하지 않는다 (아래 금지 목록). dev 검증 중 `main.tsx` mount를 임시 변경한 경우 검증 직후 원복하며, 최종 `git diff`에 해당 변경이 없어야 한다. 가능하면 기존 테스트 환경 / 일회성 검증 방법을 우선한다.
- `typecheck` / `lint` / `test` / `build` 전부 통과
- Floating Timer Widget 실제 회귀 확인 — #9 변경 전/후 Timer 화면 시각·동작 동일 (#9는 `entrypoints/content/**`·`tokens.css` 미변경이므로 무회귀 예상)

> **금지 (History를 브라우저에 노출시키기 위한 Production 인증 우회)**: `main.tsx`에 `initialAuthed={true}` 영구 하드코딩 · query parameter 기반 auth bypass · `localStorage`/`sessionStorage`/`chrome.storage` 기반 mock auth · dev authentication flag · Social Login 흉내 · Auth state 구현.

**[AC검증]** (static · source review)
- `packages/shared-types/**` diff 0 — History는 feature-local `history/types.ts`만 사용 (shared-types import 0)
- Timer production **source** diff 0 — `entrypoints/content/**`, timer 컴포넌트 미변경 (tag taxonomy는 `entrypoints/page/history/mock-data.ts`에 물리 복제)
- primitive HTML 재구현 없음 — `Button` / `ToggleGroup` / `Collapsible` / `Card` 를 `<button>`/`<div>` 등으로 재구현한 코드 없음
- 신규 npm dependency 없음 — `apps/extension/package.json` · `pnpm-lock.yaml` diff 0

---

## AC 커버리지

| AC (Issue #9) | 커버 |
|---|---|
| 1. `view` 상태로 List ⇄ Detail 전환 + 복귀 시 결과 탭·태그 필터 유지 | [정상] HistoryView list↔detail · [정상] HistoryView 필터 유지 |
| 2. `ResultFilterToggleGroup` 단일 선택이 최근 Attempt `result` 기준 즉시 필터 | [정상] ResultFilterToggleGroup onChange · [정상] filterProblems latestResult · [경계] 재선택 유지 · [정상] mock-data(latestResult = 최대 seq) |
| 3. `TagFilterPanel` 다중 선택이 union `tagIds`에 OR 매칭, 결과 필터와 AND | [정상] filterProblems OR / AND · [정상] TagFilterPanel 그룹 간 누적(merge-keep) / 해제 시 유지(drop-one) · [경계] 태그 무매칭 · [정상] mock-data(tagIds = union) |
| 4. `ClearFiltersButton` 비활성 시 숨김 / 클릭 시 결과=전체 + 태그 비움 | [예외] ClearFiltersButton 숨김 · [예외] 필터 해제 클릭 초기화 |
| 5. `ProblemCard` problemId/ResultBadge/횟수/풀이시간 항상, 제목·날짜·태그 조건부 | [정상] 필수 4필드 · [정상] 조건부 표시 · [예외] title/date/tags 생략 3건 |
| 6. `ResultBadge` `CORRECT/WRONG/HOLD` → 한글 라벨, List/Detail/AttemptItem 3곳 동일 | [정상] ResultBadge 라벨 3종 + className · [정상] ProblemCard/ProblemSummary/AttemptItem 렌더 (semantic color = AC verifier/브라우저) |
| 7. List: loading=`ListSkeleton`×3, 0건=`EmptyState(empty)`, 필터 0건=`EmptyState(filtered-empty)`+버튼 | [예외] ProblemListView loading / empty / filtered-empty 3건 |
| 8. Detail: `AttemptTimeline` `seq` 내림차순, `AttemptItem` 태그·메모·날짜 조건부 | [정상] AttemptTimeline 내림차순 · [예외] 원본 불변 · [정상] AttemptItem 전체 필드 · [예외] memo/date/tags 생략 3건 · [경계] 1개 |
| 9. Detail: loading=`DetailSkeleton`, `attempts` 0(방어)=`EmptyState`+목록으로 | [예외] ProblemDetailView DetailSkeleton · [예외] not-found |
| 10. 새 npm 패키지 없이 shadcn Skeleton 추가 | [정상] Skeleton 계약 · [AC검증] 신규 dep 없음 · [통합] build |
| 11. `packages/shared-types` 미수정 | [AC검증] shared-types diff 0 · [통합] typecheck (feature-local `history/types.ts`) |
| 12. Button / Toggle Group / Collapsible HTML 재구현 금지 | [정상] ResultFilterToggleGroup(ToggleGroup) · TagFilterPanel(Collapsible+TagToggleGroup) · ProblemCard/BackLink(Button) · [AC검증] source review |
| (통합) App.tsx 최소 연결 + #7 계약 유지 (maxWidth 720 / PageHeader / MOCK_USER / `initialAuthed=false` 분기) | [정상] App authenticated branch · [예외] App unauthenticated placeholder 유지 · [통합] Production entrypoint 검증(기본 `initialAuthed=false` 정상 렌더) |
| (통합) Product Rule 무결성 (1 Problem : N Attempts / latest result / tag union) | [정상] mock-data contract integrity |

### 커버리지 노트

- **class 문자열 미고정**: `ResultBadge` 단위는 라벨 + className 병합만. semantic color(`--success`/`--destructive`/`--warning` Tailwind class)는 unit contract 아님 → AC verifier / 실제 브라우저 UI 검증. `Skeleton`은 `data-slot` + className 병합만.
- **파일 미수정 계열 4건**(shared-types / Timer production / primitive 재구현 / npm dep)은 unit test가 아니라 `[AC검증]`으로 분리 — `git diff` · `package.json` diff · source review.
- mock 로딩 지연은 `loadDelayMs` 옵션으로 테스트에서 `0` 주입 또는 fake timers. Promise/API layer 없음.
- `filterProblems`는 순수 함수 → `expect` 직접 테스트.
- `HistoryView`의 5개 UI State(populated/empty/filtered-empty/detail/not-found)는 `problems`/`resolveDetail` 주입으로 결정적 테스트.
- App.tsx 통합: #7 `App.test.tsx`의 `'문제풀이 기록 화면 자리'` 검증 2건은 #9 tdd-red에서 `HistoryView`(`aria-label="내 문제풀이"`) 렌더 검증으로 갱신. `initialAuthed=false` / `maxWidth 720` / `MOCK_USER` 검증 유지.
- `mock-data` contract 테스트는 `tagIds`를 **Set 의미**로 비교하고 배열 순서를 계약으로 삼지 않는다.
- **History 브라우저 렌더 검증 ≠ Production 인증 우회**: `HistoryView` / `ExtensionPageApp({ initialAuthed: true })`는 테스트/검증 환경에서만 authed 경로를 노출한다. `main.tsx`·query param·storage 기반 auth bypass, dev auth flag를 Production에 넣지 않는다. dev 검증 중 `main.tsx` 임시 변경은 검증 후 원복하고 최종 `git diff`에 남기지 않는다. Production entrypoint 검증은 항상 기본값(`initialAuthed=false`) 기준.

### 시나리오 수

| 분류 | 수 |
|---|---|
| 정상 | 30 |
| 경계 | 6 |
| 예외 | 17 |
| **단위 소계** | **53** |
| 빌드·통합 (non-unit) | 4 |
| AC 독립검증 (non-unit) | 4 |

---

## TDD Green (2026-09-02) — 83/83 PASS

### 구현 파일

| 파일 | 내용 |
|---|---|
| `history/types.ts` | `RESULT_LABELS` / `RESULT_FILTER_LABELS` 값 채움 (타입·`TagOption`/`TagCategory` SoT 유지) |
| `history/filter-problems.ts` | `resultMatch && tagMatch` (result ALL/일치, tag OR). `.filter()` — 입력 불변 |
| `history/mock-data.ts` | `CORE_TAGS`(11) + `TAG_CATEGORIES`(7섹션) + `TAG_CATALOG`(flat). `MOCK_DETAIL_LIST`(3문제) → `toListItem`으로 `MOCK_PROBLEMS` 파생 → contract integrity 자동 보장. `resolveMockDetail` |
| `components/ui/skeleton.tsx` | shadcn Skeleton (`data-slot` + `animate-pulse` + `cn`) |
| `components/codit/result-badge.tsx` | `EXTEND ← Badge`. UI-local union, 내부 `LABELS`/`TONE`(`--success`/`--destructive`/`--warning`) |
| `components/codit/tag-chip-list.tsx` | `TagChipOption` 로컬 shape. catalog 매칭 chip, 미매칭 skip, 0개면 `null` |
| `history/empty-state.tsx` | 3 variant 고정 문구 + 선택적 `Button variant="ghost"` |
| `history/result-filter-toggle-group.tsx` | `ToggleGroup type="single"`. `if (next)` 가드로 재클릭 시 빈 값 무시 |
| `history/tag-filter-panel.tsx` | `Collapsible` + `TagToggleGroup`(핵심) + 중첩 `Collapsible`("더보기") . `selectedTagIds` 전역 SoT — `TagToggleGroup`의 그룹별 병합 로직으로 cross-group 보존 |
| `history/problem-card.tsx` | native `<button>` 래핑 (click/Enter/Space 기본 activation, custom 핸들러 없음) + `Card`. 조건부 title/date/tags |
| `history/problem-summary.tsx` · `attempt-item.tsx` · `attempt-timeline.tsx` | presentation. `AttemptTimeline` = `[...attempts].sort((a,b)=>b.seq-a.seq)` (원본 불변) |
| `history/skeletons.tsx` | `ListSkeleton`(카드형 ×3) / `DetailSkeleton` |
| `history/use-problem-history.ts` · `use-problem-detail.ts` | `useState` + `useEffect(setTimeout)` + `clearTimeout`. `problems`/`resolveDetail` 주입, 미주입 시 MOCK. Promise/API layer 없음 |
| `history/problem-list-view.ts` | `filterProblems` → loading→`ListSkeleton` / 원본0→`empty` / 필터0→`filtered-empty`(+버튼) / else→`ProblemCard`. `ClearFiltersButton`은 filtersActive & !filtered-empty |
| `history/problem-detail-view.tsx` | `useProblemDetail` → loading→`DetailSkeleton` / null→`not-found`(+목록으로) / else→`ProblemSummary`+`AttemptTimeline`. BackLink `Button variant="ghost"` |
| `history/history-view.tsx` | `<section aria-label="내 문제풀이">`. `view`/`selectedProblemId`/`resultFilter`/`selectedTagIds` 소유. list↔detail 전환 시 필터 유지. Auth 상태 미소유 |
| `entrypoints/page/App.tsx` | authenticated branch placeholder → `<HistoryView />` (import 1 + JSX 1줄). `initialAuthed`/`AUTH_MAX_WIDTH`/`HISTORY_MAX_WIDTH`/`MOCK_USER`/`PageHeader`/login placeholder 유지 |

### 게이트

| | 결과 |
|---|---|
| `typecheck` | 0 errors |
| `lint` | clean (`react-hooks/set-state-in-effect` 해소, import order 정리) |
| `test` | **83/83 PASS** (22 files) |
| `build` | EXIT 0 · `page.html` 496 B · `content.js` 293.12 kB |

### 검증

- **mock-data contract integrity**: PASS (`attemptCount`=`attempts.length`, 최대 seq attempt → `latestResult`/`latestDurationSeconds`, `list.tagIds`≡`detail.tagIds`≡attempt union, Set 의미)
- **TagFilterPanel cross-group**: PASS (핵심 BFS + 더보기 DP 누적 → `['dp','bfs']`, BFS 해제 → `['dp']`)
- **list↔detail + filter 유지**: PASS (`오답` 필터 → 상세 진입 → 복귀 시 필터 유지, CORRECT 문제 `#1859` 미표시)
- **App authenticated branch**: PASS (`<section aria-label="내 문제풀이">` 렌더, #7 계약 6종 유지)
- **Timer/#7 회귀**: 기존 26 테스트 PASS. `content/**` JS 로직 byte-identical, 토큰 블록 byte-identical, 기존 utility class 무변경. `content.js` +1.18kB는 history 컴포넌트가 쓰는 신규 Tailwind utility(`.h-16`·`.border-success`·`.animate-pulse` 등)가 공유 stylesheet에 **추가**된 것 — Timer 렌더 결과 불변
- **금지 범위 diff 0**: `packages/shared-types` · `entrypoints/content/**` · `styles/tokens.css` · `package.json` · `pnpm-lock.yaml` 전부 `git diff` empty. 신규 dependency 0

### 커버리지 노트

~~`history-view.tsx:45-47` — `onClearFilters` 콜백이 HistoryView 레벨 미커버~~ → **tdd-refactor에서 통합 테스트 추가로 해소** (아래).

---

## AC 검증 결과 — /ac-verifier 9 PASS (2026-09-02)

독립 검증(ac-verifier 에이전트 — raw mock 데이터에서 contract 직접 계산 + source review + gate) + 실제 시스템 Chrome 브라우저 검증(`initialAuthed=true` 임시 검증 entrypoint, 검증 후 제거 — git tree clean).

| AC | 판정 | 근거 |
|----|------|------|
| 1. List⇄Detail 전환 + 복귀 시 필터 유지 | **MET** | `history-view.tsx`가 `view`/`selectedProblemId`/`resultFilter`/`selectedTagIds` 소유, BackLink는 `setView('list')`만 호출(필터 미초기화). **실브라우저**: `오답` 필터 → `#2178` 상세 → 복귀 시 `#2178`만 표시(필터 유지) |
| 2. Result filter latestResult 기준 즉시 필터 | **MET** | `filterProblems`: `result==='ALL' \|\| latestResult===result`. `toListItem`: 최대 seq attempt에서 파생. 재클릭 시 `if(next)` 가드로 빈 값 무시. **실브라우저**: `오답` → `#2178`(WRONG)만 |
| 3. Tag OR + result AND + cross-group | **MET** | `filterProblems`: `tagIds.some(t => problem.tagIds.includes(t))` (OR) · `resultMatch && tagMatch` (AND). `TagFilterPanel`: 그룹별 `TagToggleGroup` + 전역 `selectedTagIds`. **실브라우저**: 핵심 BFS + 더보기 트리 동시 선택 + WRONG AND → `#2178` |
| 4. ClearFilters 숨김/초기화 | **MET** | `filtersActive = resultFilter!=='ALL' \|\| selectedTagIds.length>0`, filtered-empty 시 상단 버튼 억제(EmptyState action이 대체). `history-view.tsx:44-47` `onClearFilters` = `setResultFilter('ALL')` + `setSelectedTagIds([])`. **실브라우저 e2e**: 필터 비활성 시 숨김 → `오답` 시 표시 → 클릭 시 result tab `전체`(on) + 태그 전체 해제 + **3문제 전체 목록 재표시**. filtered-empty의 필터 해제도 3문제 복원 |
| 5. ProblemCard 필수/조건부 | **MET** | 항상: `#id`·`ResultBadge`·`풀이 N회`·`formatDuration`. 조건부: `title`/`latestSolvedAt`/`TagChipList`(0개→null). **실브라우저**: `#1012`(HOLD) 제목·날짜 생략 확인 |
| 6. ResultBadge 3곳 동일 + 의미 토큰 + 한글 라벨 | **MET** | `LABELS`(정답/오답/보류) + `TONE`(`border-success bg-success text-success-foreground` 등). `ProblemCard`·`ProblemSummary`·`AttemptItem` 3곳 동일 `<ResultBadge>` 호출. **실브라우저 computed style**: 정답 bg `oklch(0.596 0.145 163.225)`(=`--success`) / 오답 bg `oklch(0.577 0.245 27.325)`(=`--destructive`)·color white / 보류 bg `oklch(0.828 0.189 84.429)`(=`--warning`) — 3종 CSS var 유효 resolve, 서로 구분 |
| 7. List loading/empty/filtered-empty | **MET** | `problem-list-view.tsx` 3분기 + `ListSkeleton` ×3 + `EmptyState('empty'/'filtered-empty')`. **실브라우저**: 로딩 시 skeleton 9개 · `정답+BFS` → "조건에 맞는 문제가 없어요" + 필터 해제 1개 + 카드 0 |
| 8. AttemptTimeline seq 내림차순 + 조건부 | **MET** | `[...attempts].sort((a,b)=>b.seq-a.seq)` (원본 불변). `AttemptItem` `recordedAt`/`memo`/`tagIds` 조건부. **실브라우저**: `3회차→2회차→1회차`, 1회차 메모 생략(날짜만), 2·3회차 메모, 개별 태그 |
| 9. Detail loading/방어 | **MET** | `problem-detail-view.tsx`: `loading→DetailSkeleton` / `detail===null→EmptyState('not-found')`+목록으로. BackLink 무조건 렌더. **실브라우저**: 상세 진입 시 skeleton 4개 → summary+timeline. (not-found는 정상 플로우 도달 불가 — 단위 테스트 + 코드 검증) |
| 10. Skeleton npm 없이 | **MET** | `skeleton.tsx` 15줄, Radix 없음, `cn`만. `package.json`·`pnpm-lock.yaml` diff empty |
| 11. shared-types 미수정 | **MET** | `git diff -- packages/shared-types` empty. `history/types.ts` import 0줄. `@codit/shared-types` 참조 0 |
| 12. primitive HTML 재구현 금지 | **MET** | `ToggleGroup`/`Collapsible`/`Card`/`Button` 전부 `@/components/ui/*`에서 import. `TagToggleGroup` `@/components/codit`. `ProblemCard`의 native `<button>` 래핑은 spec 허용. hand-rolled toggle/disclosure 0 |

### 게이트 (전부 통과)

`tsc --noEmit` 0 errors · `eslint entrypoints components lib` clean · `vitest run` **83/83** · `wxt build` EXIT 0 (`page.html` 496 B).

### 경계 재확인

- `git diff HEAD --stat` = `App.tsx` + `App.test.tsx`만. App.tsx diff = import 1 + placeholder→`<HistoryView/>`. `initialAuthed`/`AUTH_MAX_WIDTH`/`HISTORY_MAX_WIDTH`(720)/`MOCK_USER`/`PageHeader`/login placeholder/`ExtensionPageShell` 유지
- `packages/shared-types` · `entrypoints/content/**` · `styles/tokens.css` · `package.json` · `pnpm-lock.yaml` diff **empty**. 신규 dependency 0
- 금지 패턴(`chrome.storage`·`localStorage`·`sessionStorage`·`fetch`·`axios`·OAuth·JWT·auth bypass·Social Login) history/·수정 파일 전체에서 0
- `history/types.ts` → `components/codit/**` 역방향 import 0. `result-badge.tsx`·`tag-chip-list.tsx` → `history/**` import 0
- **Tag taxonomy**: History `CORE_TAGS`(11) + `TAG_CATEGORIES`(7섹션) = Timer id 완전 일치. 3개 display name 축약(`shortest-path` 등, id 무변경 — 필터는 id 기준이라 동작 영향 0). Timer source diff 0
- **Item 7 page.html 기본 진입**: `initialAuthed=false` → 로그인 placeholder, History 미렌더, `pageerror`/`console.error` 0 (favicon 404만)
- **Item 8 Timer 실브라우저 회귀**: 위젯 정상 mount, 320px/14px/시스템폰트, `완료` 버튼 `--primary`, card `--card`, `tabular-nums`, `:host` 토큰 스코프 유지, host 페이지(빨강 h1·serif) 미침투. `content.js` JS 로직 byte-identical. +1.18kB는 history 컴포넌트 신규 Tailwind utility가 공유 stylesheet에 추가된 것 — Timer 렌더 결과 불변

### 후속 권고 (tdd-refactor — 차단 아님)

- ~~AC-4 HistoryView 레벨 테스트 gap~~ → **tdd-refactor에서 해소** (아래).
- Timer/History tag catalog 공통 SoT 승격 (기존 후속 항목).

---

## TDD Refactor (2026-09-02)

### Production 리팩터 — 적용 0건

7개 검토 영역(`filter-problems` / `mock-data` / `ResultBadge`·`TagChipList`·`Skeleton` / `TagFilterPanel` / `HistoryView` / `ProblemListView`·`ProblemDetailView` / `App.tsx`) 전부 이미 하우스 패턴(`entrypoints/content/*` 참조)에 부합하고 단순 → 억지 변경 없음.
- `mock-data.ts`의 `toListItem` 파생 헬퍼는 contract integrity 보장 메커니즘(integrity 테스트의 존재 이유)이므로 **유지**. 손으로 list item 작성 시 drift 위험.
- `ProblemCard` native `<button>` 구조 유지 (click/Enter/Space 1회 activation 계약).
- **Timer/History tag catalog 공통 SoT 승격 미실행** — Timer production/공통 타입을 건드릴 위험, #9 범위 밖 후속.

### 테스트 보강 — 1건

`history-view.test.tsx`에 통합 테스트 추가:
```
[HistoryView] should reset the result tab and tag selection via 필터 해제, restoring the full list
```
- 사용자 관점 DOM behavior: 결과 탭 `오답` 선택 + 태그 `BFS` 선택 → `#2178`만 표시 → `필터 해제` 클릭 → **3문제 전체 복귀 + 필터 해제 버튼 사라짐 + BFS chip `data-state="off"`**
- `HistoryView` → `ProblemListView` → `onClearFilters` → `HistoryView` state(`resultFilter`/`selectedTagIds`) reset 연결 검증. `ProblemListView` 단위 테스트(콜백 호출만)와 비중복.
- `setState` 구현 세부 미검사.

### 게이트

| | 결과 |
|---|---|
| `tsc --noEmit` | 0 errors |
| `eslint entrypoints components lib` | clean |
| `vitest run` | **84/84 PASS** (83 → +1) |
| `wxt build` | EXIT 0 · `page.html` 496 B · `content.js` 293.12 kB (Green과 동일 — refactor 라운드 bundle 변화 0. 신규 테스트 설명 문자열의 `filter` 단어 제거로 spurious Tailwind `.filter{}` 방지) |

### 경계

- `packages/shared-types` · `entrypoints/content/**`(mockData.ts 포함) · `styles/tokens.css` · `package.json` · `pnpm-lock.yaml` diff **empty**
- Auth/Social Login/API/`chrome.storage` 코드 추가 0
- Production 코드 변경 0 (이번 라운드: `history-view.test.tsx` 1건 + 본 문서만)
- git status: `App.tsx`·`App.test.tsx` modified + #9 신규 파일 untracked (미커밋). HEAD `ca6b713` 무변경
