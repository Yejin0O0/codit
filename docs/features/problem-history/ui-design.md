# Problem History Feature UI Design

> 이 문서는 tdd-green-frontend의 시각적 명세 참조 기준이다.
> 코드를 작성하지 않는다.
> 디자인 토큰·컴포넌트 규칙은 [../../ui/design-system.md](../../ui/design-system.md), 아키텍처는 [../../ui/ui-architecture.md](../../ui/ui-architecture.md) 참조.
> Auth는 별도 문서: [../auth/ui-design.md](../auth/ui-design.md)

---

## Surface 전제

| 항목 | 확정 |
|------|------|
| UI Surface | **전용 Codit Extension Page** (브라우저 탭). Floating Widget(320px)·Popup 아님 |
| 근거 | Problem List 탐색 · 필터링 · Problem Detail · Attempt History 확인처럼 오래 머무는 탐색 화면. Popup 은 외부 클릭 시 닫혀 탐색과 충돌, 320px 위젯은 Attempt 타임라인 가독성이 나쁨 |
| 진입점 | "툴바 아이콘 → 전용 Page" 를 UI Flow로만 채택. toolbar action / manifest / chrome API 구현은 후속 기술 결정 |
| 데이터 | 전부 mock data + React local state. fetch/axios/chrome.storage 없음 |
| 정보 구조 | **Problem 중심.** Result · Tag 는 grouping 축이 아니라 **Filter** |
| 관계 | Problem = 한 문제 / Attempt = 그 문제의 한 번의 풀이 기록. 1 Problem : N Attempt |
| 화면 전환 | Page 최상위 단일 상태(`view`)로 관리. Router 라이브러리 없음 (timer의 `screen` 패턴과 동일) |
| 테마 | 고정 라이트, shadcn `neutral`, 기존 토큰(`--success` / `--warning` / `--destructive`) 재사용 |
| Page 폭 | 중앙 정렬 컨테이너 `max-width ≈ 720px` |

---

## User Flow

```
[Extension Page] ──(mock: isAuthed = true)──▶ [My Problem History]

My Problem History (view = list)
  │  ProblemCard 클릭 → selectedProblemId 설정
  ▼
Problem Detail (view = detail)
  │  "← 목록으로"
  ▼
My Problem History (view = list)   ← 결과 탭 + 태그 필터 상태 유지
```

- `view` 상태: `list | detail`, `selectedProblemId: string | null`.
- Problem List 의 "최근 결과" = 가장 최근 Attempt 의 `result`.
- Problem 자체를 "정답 문제 / 오답 문제" 로 고정 분류하지 않는다.

---

## Result Taxonomy

History UI 는 `CORRECT` / `WRONG` / `HOLD` 3종을 사용한다 (최신 요구사항 + [../timer/ui-design.md](../timer/ui-design.md) 기준).

| result | 라벨 | 의미 토큰 |
|--------|------|----------|
| `CORRECT` | 정답 | `--success` |
| `WRONG` | 오답 | `--destructive` |
| `HOLD` | 보류 | `--warning` |

Result Filter 탭: **전체 · 정답 · 오답 · 보류**.

> **Contract 불일치 (아래 "Contract / Follow-up" 참조)**: `packages/shared-types` 의 `Attempt.result` 는 `CORRECT / WRONG / TIMEOUT / COMPILE_ERROR` 로 이 taxonomy 와 불일치한다. 이번 단계는 mock data 를 사용하므로 UI 설계를 BLOCK 하지 않는다. `packages/shared-types` 는 수정하지 않는다.

---

## 와이어프레임

### ① Problem List — populated

```
┌────────────────────────────────────────────────────────────┐
│ ◆ Codit                                    you@example.com  │  ← PageHeader
├────────────────────────────────────────────────────────────┤
│                                                            │
│  내 문제풀이                                                 │
│                                                            │
│  ┌──────┬──────┬──────┬──────┐                              │
│  │ 전체 │ 정답 │ 오답 │ 보류 │      ← ResultFilterToggleGroup │
│  └──────┴──────┴──────┴──────┘         (단일 선택, 기본 "전체") │
│                                                            │
│  ▸ 태그 필터        선택: 구현 ×  BFS ×        [필터 해제]    │  ← Collapsible 트리거 + 요약
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ #1859                                     [ 정답 ]    │  │  ← ProblemCard
│  │ 타일 채우기 문제                   (제목: 데이터 있을 때만) │  │
│  │ 풀이 3회 · 최근 풀이 11:32 · 2026-08-30                │  │  ← 메타 라인
│  │ 구현   시뮬레이션   DP                                 │  │  ← union 태그 chip (읽기 전용)
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ #2178                                     [ 오답 ]    │  │
│  │ 풀이 1회 · 최근 풀이 23:11 · 2026-08-28                │  │  ← 제목 없는 카드
│  │ 그래프   BFS                                          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ #1012                                     [ 보류 ]    │  │
│  │ 풀이 2회 · 최근 풀이 08:40                             │  │  ← 날짜 데이터 없음 → 생략
│  │ 수학/정수론                                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**ProblemCard 표시 정보**

| 필드 | 필수 | 소스 | 없을 때 |
|------|------|------|---------|
| `problemId` (`#1859`) | ✅ | `ProblemHistoryListItem.problemId` | — |
| 최근 결과 Badge | ✅ | `latestResult` | — |
| 풀이 횟수 (`풀이 3회`) | ✅ | `attemptCount` | — |
| 최근 풀이 시간 (`11:32`, mm:ss) | ✅ | `latestDurationSeconds` (`format-duration`) | — |
| 태그 chip | ✅ (0개 가능) | `tagIds` (**union** — 아래 정의) | 태그 영역 생략 |
| 문제 제목 | ❌ | `title?` | 줄 자체 생략 (레이아웃 필수 요소 아님) |
| 최근 풀이 날짜 | ❌ | `latestSolvedAt?` | 메타 라인에서 생략 |

### ② Problem List — result = "오답" + 태그 필터 적용

```
│  ┌──────┬──────┬──────┬──────┐                              │
│  │ 전체 │ 정답 │[오답]│ 보류 │   ← "오답" 강조               │
│  └──────┴──────┴──────┴──────┘                              │
│  ▸ 태그 필터   선택: BFS ×             [필터 해제]           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ #2178                                     [ 오답 ]    │  │  ← 최근 Attempt = WRONG & union 태그에 BFS 포함
│  └──────────────────────────────────────────────────────┘  │
```

- **결과 필터**: 최근 Attempt `result` 기준. 전체 / `CORRECT` / `WRONG` / `HOLD`.
- **태그 필터**: Problem-level **union `tagIds`** 기준, **OR 정책** — 선택 태그 중 하나라도 union 에 있으면 표시.
  - 예: 선택 태그 = `BFS`, `DP` → Problem 의 union tags 에 `BFS` **또는** `DP` 가 하나라도 있으면 표시.
- 두 필터는 **AND 로 결합** (결과 조건 ∧ 태그 조건).
- **"필터 해제"**: 결과 탭 → "전체", 태그 선택 → 비움.

### ③ 태그 필터 펼침 (Collapsible expanded)

```
│  ▾ 태그 필터                              [필터 해제]        │
│  ┌────────────────────────────────────────────────────┐   │
│  │ (구현)(시뮬레이션)(완전 검색)(그리디)(BFS)(DFS)       │   │  ← TagToggleGroup (multiple, chip)
│  │ (정렬)(DP)(배열)(문자열)(스택/큐)                     │   │     선택된 것만 강조
│  │ ▸ 더보기                                             │   │  ← 중첩 Collapsible (7 대분류 섹션)
│  └────────────────────────────────────────────────────┘   │
```

- timer `TagSelectScreen` 의 `TagPicker` 패턴 재사용. **단 직접입력(Input + 추가) 없음** — 필터는 존재하는 태그 집합에서만 선택.
- 태그 소스 = mock 태그 카탈로그 (timer `mockData.ts` 구조 재사용 가능. 실제 복제/공유 방식은 구현 단계 결정).

### ④ Problem List — loading (mock)

```
│  내 문제풀이                                                 │
│  ┌──────┬──────┬──────┬──────┐                              │
│  │ 전체 │ 정답 │ 오답 │ 보류 │                              │
│  └──────┴──────┴──────┴──────┘                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ▓▓▓▓▓▓▓        ▓▓▓▓                                   │  │  ← ListSkeleton (카드 형태 × 3)
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                                  │  │
│  │ ▓▓▓▓  ▓▓▓▓  ▓▓▓▓                                      │  │
│  └──────────────────────────────────────────────────────┘  │
```

### ⑤ Problem List — empty (기록 없음)

```
│  내 문제풀이                                                 │
│  ┌──────┬──────┬──────┬──────┐                              │
│  │ 전체 │ 정답 │ 오답 │ 보류 │                              │
│  └──────┴──────┴──────┴──────┘                              │
│                                                            │
│               아직 기록된 문제풀이가 없어요                   │  ← EmptyState (variant: empty)
│         SWEA에서 문제를 풀면 여기에 기록이 쌓여요             │
│                                                            │
```

### ⑥ Problem List — filtered empty (필터 결과 0)

```
│  ┌──────┬──────┬──────┬──────┐                              │
│  │ 전체 │ 정답 │[오답]│ 보류 │                              │
│  └──────┴──────┴──────┴──────┘                              │
│  ▾ 태그 필터   선택: DP ×               [필터 해제]          │
│                                                            │
│            조건에 맞는 문제가 없어요                          │  ← EmptyState (variant: filtered-empty)
│               [ 필터 해제 ]                                  │  ← Button
```

### ⑦ Problem Detail — populated

```
┌────────────────────────────────────────────────────────────┐
│ ◆ Codit                                    you@example.com  │  ← PageHeader
├────────────────────────────────────────────────────────────┤
│  ← 목록으로                                                  │  ← BackLink
│                                                            │
│  문제 #1859                                                  │
│  타일 채우기 문제                            (제목: 있을 때만) │
│                                                            │
│  최근 결과  [ 정답 ]          총 풀이 횟수  3회               │  ← ProblemSummary
│  구현   시뮬레이션   DP                     (union 태그 chip) │
│  ────────────────────────────────────────────────────────  │
│                                                            │
│  3회차                          [ 정답 ]                     │  ← AttemptItem (최신 회차 상단)
│  11:32                          2026-08-30                  │
│  구현   시뮬레이션                             (개별 태그 chip) │
│  메모  DP 점화식을 다시 세우니 통과. 경계조건 주의.            │
│  ────────────────────────────────────────────────────────  │
│  2회차                          [ 오답 ]                     │
│  15:20                          2026-08-22                  │
│  구현                                                        │
│  메모  시간 초과. 완전탐색으로 접근한 게 문제.                 │
│  ────────────────────────────────────────────────────────  │
│  1회차                          [ 오답 ]                     │
│  23:11                          2026-08-15                  │
│  구현                                                        │
│  (메모 없음 → "메모" 줄 생략)                                 │
└────────────────────────────────────────────────────────────┘
```

**ProblemSummary 표시 정보**

| 필드 | 필수 | 소스 |
|------|------|------|
| 문제 `#{id}` | ✅ | `ProblemHistoryDetail.problemId` |
| 제목 | ❌ | `title?` (없으면 줄 생략) |
| 최근 결과 Badge | ✅ | `latestResult` |
| 총 풀이 횟수 | ✅ | `attemptCount` |
| 태그 chip | ✅ (0개 가능) | `tagIds` (**union** — 전체 Attempt `tagIds` union) |

**AttemptItem 표시 정보**

| 필드 | 필수 | 소스 | 없을 때 |
|------|------|------|---------|
| 회차 (`3회차`) | ✅ | `ProblemAttempt.seq` | — |
| 결과 Badge (`CORRECT` / `WRONG` / `HOLD`) | ✅ | `result` | — |
| 풀이 시간 (`11:32`, mm:ss) | ✅ | `durationSeconds` (`format-duration`) | — |
| 태그 chip | ✅ (0개 가능) | `tagIds` (**개별** — 그 회차 태그, union 아님) | 태그 영역 생략 |
| 메모 | ❌ | `memo?` | "메모" 줄 생략 |
| 기록 시각 / 날짜 | ❌ | `recordedAt?` | 우측 날짜 생략 |

- **정렬**: 최신 회차 → 과거 회차 (내림차순). 요구사항 예시(3→2→1)와 동일.
- 목적: "처음엔 왜 틀렸고, 재도전하면서 어떻게 개선됐는가" 를 회차 흐름으로 확인.
- 구분선은 timer `PanelShell` 선례대로 `border-t` 유틸리티 (Separator 컴포넌트 추가하지 않음).

### ⑧ Problem Detail — loading (mock)

```
│  ← 목록으로                                                  │
│  ▓▓▓▓▓▓▓▓                                                   │  ← DetailSkeleton
│  ▓▓▓▓  ▓▓▓▓                                                 │
│  ────────────────                                           │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓   (attempt skeleton × 2)                    │
```

### ⑨ Problem Detail — no attempts (방어적 상태)

```
│  ← 목록으로                                                  │
│  문제 #1859                                                  │
│                                                            │
│        이 문제의 풀이 기록을 찾을 수 없어요                    │  ← EmptyState (variant: 방어)
│              [ 목록으로 ]                                    │
```

- **분석**: Problem 은 Attempt ≥ 1 이 있어야만 History 에 존재 → List 에서 진입한 Problem 이 0 attempt 인 경우는 정상 플로우에서 **발생 불가**. 방어적 처리만 정의하고, 주요 플로우 상태로 취급하지 않는다.

---

## 컴포넌트 트리

```
ExtensionPageShell                        [CUSTOM]  Auth와 공유
└─ <view: list | detail>  ← isAuthed = true
   ├─ PageHeader                           [CUSTOM]  브랜드 + 현재 사용자(mock) + (로그아웃 자리, 이번엔 미표시)
   │
   ├─ ProblemListView   <view = list>
   │  ├─ 제목 "내 문제풀이"
   │  ├─ ResultFilterToggleGroup           [EXTEND ← ui/toggle-group, single]  전체 / 정답 / 오답 / 보류
   │  ├─ TagFilterPanel                     [EXTEND ← Collapsible + TagToggleGroup]  (직접입력 없음)
   │  │  └─ ClearFiltersButton              [USE ← Button variant=ghost]  "필터 해제"
   │  ├─ ProblemList
   │  │  └─ ProblemCard (반복)              [EXTEND ← Card]
   │  │     ├─ problemId 텍스트
   │  │     ├─ ResultBadge (latestResult)   [EXTEND ← Badge]  (공용 승격)
   │  │     ├─ 제목 (조건부)
   │  │     ├─ 메타 라인 (횟수 · 풀이시간 · 날짜 조건부)
   │  │     └─ TagChipList (union tagIds)   [USE ← Badge variant=secondary, 반복, 읽기 전용]
   │  ├─ ListSkeleton                       [USE ← shadcn Skeleton] (신규)
   │  └─ EmptyState                         [CUSTOM]  variant: empty | filtered-empty
   │
   └─ ProblemDetailView   <view = detail, selectedProblemId>
      ├─ BackLink "← 목록으로"              [USE ← Button variant=ghost]
      ├─ ProblemSummary
      │  ├─ 문제 #{id} + 제목(조건부)
      │  ├─ ResultBadge (latestResult)      [EXTEND ← Badge]
      │  ├─ 총 풀이 횟수
      │  └─ TagChipList (union tagIds)      [USE ← Badge]
      ├─ AttemptTimeline                     [CUSTOM]  내림차순 정렬 컨테이너
      │  └─ AttemptItem (반복)              [CUSTOM]
      │     ├─ 회차 라벨 (seq)
      │     ├─ ResultBadge (result)         [EXTEND ← Badge]
      │     ├─ 풀이 시간 + 날짜(조건부)
      │     ├─ TagChipList (개별 tagIds)    [USE ← Badge]
      │     └─ 메모 (조건부)
      ├─ DetailSkeleton                      [USE ← shadcn Skeleton]
      └─ EmptyState (방어적)                [CUSTOM]
```

---

## UI State

| 컴포넌트 | 상태 | 트리거 | 표현 |
|---------|------|--------|------|
| HistoryView | `list` | 로그인(mock) / "← 목록으로" | ProblemListView. 필터 상태 유지 |
| HistoryView | `detail` | ProblemCard 클릭 | ProblemDetailView(`selectedProblemId`) |
| ProblemListView | loading | 진입 시 mock 로드 시뮬레이션 | `ListSkeleton` × 3 |
| ProblemListView | populated | mock 데이터 ≥ 1 & 필터 매칭 ≥ 1 | ProblemCard 리스트 |
| ProblemListView | empty | mock 데이터 0 | `EmptyState` (empty) — "아직 기록된 문제풀이가 없어요" |
| ProblemListView | filtered empty | 데이터 ≥ 1 이나 필터 매칭 0 | `EmptyState` (filtered-empty) + "필터 해제" 버튼 |
| ResultFilterToggleGroup | `전체` | 기본 | 전체 Problem |
| ResultFilterToggleGroup | `정답` / `오답` / `보류` | 탭 선택 | 최근 Attempt `result` === 선택값 인 Problem |
| TagFilterPanel | collapsed | 기본 | 트리거 + 선택 태그 요약만 |
| TagFilterPanel | expanded | 트리거 클릭 | TagToggleGroup(chip) + 중첩 "더보기" |
| TagFilterPanel | 태그 선택됨 (≥ 1) | chip 토글 | 선택 태그 OR 조건으로 리스트 필터 + 요약에 chip 표시 |
| ClearFiltersButton | hidden | 결과 = 전체 & 태그 0 | 렌더 안 함 |
| ClearFiltersButton | visible | 필터 활성 (결과 ≠ 전체 OR 태그 ≥ 1) | 클릭 시 결과 = 전체, 태그 비움 |
| ProblemCard | default | 리스트 렌더 | 카드 표시 |
| ProblemCard | hover / focus | 포인터 / 키보드 | 강조 (클릭 가능 표시) |
| ProblemCard.title | shown / hidden | `title` 유무 | 있으면 제목 줄, 없으면 생략 |
| ProblemCard.date | shown / hidden | `latestSolvedAt` 유무 | 메타 라인 포함 / 생략 |
| ProblemCard.tags | shown / hidden | union `tagIds` 길이 | ≥ 1 이면 chip 행, 0 이면 생략 |
| ProblemDetailView | loading | 진입 시 mock 로드 | `DetailSkeleton` |
| ProblemDetailView | populated | `attempts` ≥ 1 | ProblemSummary + AttemptTimeline |
| ProblemDetailView | empty (방어) | `attempts` 0 | EmptyState + "목록으로" |
| AttemptTimeline | 정렬 | 항상 | 최신 `seq` 상단 (내림차순) |
| AttemptItem.tags | shown / hidden | 개별 `tagIds` 길이 | ≥ 1 이면 chip 행, 0 이면 생략 |
| AttemptItem.memo | shown / hidden | `memo` 유무 | "메모" 줄 포함 / 생략 |
| AttemptItem.date | shown / hidden | `recordedAt` 유무 | 우측 날짜 포함 / 생략 |
| ResultBadge | `CORRECT` | result | `--success` + "정답" |
| ResultBadge | `WRONG` | result | `--destructive` + "오답" |
| ResultBadge | `HOLD` | result | `--warning` + "보류" |

> 부모 영향:
> - `ResultFilterToggleGroup` + `TagFilterPanel` 선택값 → `ProblemList` 표시 항목, `empty` vs `filtered-empty` 분기 결정.
> - `HistoryView.view` 전환 시 필터 상태(결과 탭 + 태그)는 상위에서 보존 → 목록 복귀 시 유지.

---

## Interaction

- **결과 필터**: 단일 선택 토글. 기본 "전체". 선택 시 최근 Attempt `result` 로 즉시 필터.
- **태그 필터**: Collapsible 로 패널 열고 chip 다중 선택. Problem-level union `tagIds` 에 OR 매칭. 닫아도 선택 유지, 요약 chip 으로 표시.
- **필터 해제**: 결과 = 전체 + 태그 비움. 필터 비활성 상태에서는 버튼 숨김.
- **ProblemCard 클릭**: `selectedProblemId` 설정 + `view = detail`. 카드 전체가 클릭 타깃 (키보드 포커스 가능).
- **BackLink**: `view = list`. 필터 상태 유지.
- **AttemptTimeline**: 최신 회차부터 아래로. 각 AttemptItem 은 조회 전용 — 수정/삭제/재도전 액션 없음.
- **로딩**: 진입 시 mock 로드 지연 시뮬레이션 → Skeleton → populated / empty 전환. 실제 네트워크 호출 없음.

---

## USE / EXTEND / CUSTOM Mapping

| 요소 | 분류 | 근거 |
|------|------|------|
| Card | **USE** (`ProblemCard` 는 EXTEND) | 리스트 카드 셸 |
| Button | **USE** | BackLink, ClearFilters, EmptyState 액션 (`ghost` variant) |
| Badge | **USE** | 태그 chip 표시 (`secondary`, 읽기 전용) |
| Collapsible | **USE** | 태그 필터 패널 + 중첩 "더보기" (timer 선례) |
| `ResultFilterToggleGroup` | **EXTEND ← ui/toggle-group (single)** | 전체 / 정답 / 오답 / 보류 세그먼트 필터. timer `ResultToggleGroup` 패턴 재사용, "전체" 옵션 추가. 탭 자체는 중립 색(의미색은 Badge 에만). **shadcn Tabs 추가 검토했으나 기존 ToggleGroup 재사용으로 신규 의존 회피** |
| `TagFilterPanel` | **EXTEND ← Collapsible + `TagToggleGroup`** | timer `TagPicker` 에서 직접입력 제거한 필터 버전. 다중 선택 chip primitive 재구현 안 함 |
| `ProblemCard` | **EXTEND ← Card** | 클릭 가능 카드 + 고정 슬롯 (id / badge / 제목 / 메타 / 태그) |
| `ResultBadge` | **EXTEND ← Badge** (공용 승격) | `CORRECT` / `WRONG` / `HOLD` → 의미 토큰 + 한글 라벨. List · Detail Summary · AttemptItem 3곳에서 동일 매핑 필요 (timer `ResultToggleGroup` 의 `TONE_CLASS` 와 같은 색 매핑) |
| `ListSkeleton` / `DetailSkeleton` | **USE ← shadcn Skeleton** (신규) | mock 로딩 표현. 단일 파일, Radix 의존 없음, **npm 추가 없음** |
| `AttemptItem` | **CUSTOM** | 회차 타임라인 항목. 대응 primitive 없음. 구분선은 `border-t` 유틸 |
| `AttemptTimeline` | **CUSTOM** | AttemptItem 세로 나열 + 내림차순 정렬 |
| `EmptyState` | **CUSTOM** | empty / filtered-empty / 방어 3변형. 문구 + 선택적 액션 |
| `ExtensionPageShell` / `PageHeader` | **CUSTOM** | 새 Surface 프레임 (Auth 와 공유) |
| `TagChipList` | **USE ← Badge** 반복 | 신규 컴포넌트 아님. Badge 나열 + 줄바꿈 규칙만 |

> 공통 interactive primitive(Button / Toggle Group / Collapsible)를 단순 HTML 로 재구현하지 않는다.

---

## Loading / Empty / Error State

| 화면 | Loading | Empty | Error |
|------|---------|-------|-------|
| Problem List | `ListSkeleton` × 3 (mock 지연 시뮬레이션) | "아직 기록된 문제풀이가 없어요" + 안내 문구 | 이번 단계 **없음** (네트워크 없음). Follow-up 에서 `FormAlert`(Alert) 재사용해 로드 실패 배너 |
| Problem List (필터) | — | "조건에 맞는 문제가 없어요" + [필터 해제] | — |
| Problem Detail | `DetailSkeleton` | (방어) "이 문제의 풀이 기록을 찾을 수 없어요" + [목록으로] | 이번 단계 없음 (Follow-up) |

---

## Mock Data Contract

> 설계 기준이다. 코드가 아니다. 실제 데이터는 mock 배열 + React local state 로 전제한다.

```
ProblemHistoryListItem {
  problemId: string
  title?: string
  latestResult: 'CORRECT' | 'WRONG' | 'HOLD'   // 가장 최근 Attempt 의 result
  attemptCount: number
  latestDurationSeconds: number                 // 가장 최근 Attempt 의 풀이 시간
  latestSolvedAt?: string                       // ISO date, optional
  tagIds: string[]                              // 해당 Problem 의 모든 Attempt tagIds 의 union
}

ProblemAttempt {
  seq: number                                   // 회차 (1-based, 1 = 최초)
  result: 'CORRECT' | 'WRONG' | 'HOLD'
  durationSeconds: number
  tagIds: string[]                              // 그 회차에서 선택된 태그 (개별, union 아님)
  memo?: string
  recordedAt?: string                           // ISO, optional
}

ProblemHistoryDetail {
  problemId: string
  title?: string
  latestResult: 'CORRECT' | 'WRONG' | 'HOLD'
  attemptCount: number
  tagIds: string[]                              // 전체 Attempt tagIds 의 union
  attempts: ProblemAttempt[]                    // 내림차순 (최신 seq 먼저)
}
```

### tagIds 의미 (확정)

| 위치 | 정의 | 용도 |
|------|------|------|
| `ProblemHistoryListItem.tagIds` | 해당 Problem 의 모든 Attempt `tagIds` 의 **union** | ProblemCard 태그 chip 표시 + **태그 필터 매칭 기준** |
| `ProblemHistoryDetail.tagIds` | 전체 Attempt `tagIds` 의 **union** | ProblemSummary 태그 chip 표시 |
| `ProblemAttempt.tagIds` | 그 회차에서 선택된 태그 (개별) | AttemptItem 태그 chip 표시 (회차별 태그 변화 확인) |

- 태그 필터는 **Problem-level union `tagIds`** 를 기준으로 동작한다. **OR 정책** — 선택 태그 중 하나라도 union 에 있으면 표시.
- 태그 카탈로그(id → 이름)는 timer `mockData.ts` 구조 재사용. 실제 복제 / 공유 방식은 구현 단계 결정.

---

## Contract / Follow-up

### Contract 불일치 (정렬 필요)

> 현재 승인된 Product UI Result taxonomy 는 **`CORRECT` / `WRONG` / `HOLD`** 이다 (최신 요구사항 + [../timer/ui-design.md](../timer/ui-design.md)).
>
> `packages/shared-types` 의 기존 `Attempt.result` (`CORRECT` / `WRONG` / `TIMEOUT` / `COMPILE_ERROR`) 와 불일치하므로, 실제 API / Storage 연결 전에 **FE-BE Contract 정렬이 필요**하다.
>
> 이번 단계에서는 mock data 를 사용하므로 UI 설계를 BLOCK 하지 않는다. `packages/shared-types` 는 수정하지 않는다.

### Follow-up

| 항목 | 비고 |
|------|------|
| 태그별 복습 화면 (예: "BFS 8문제", "DP 5문제") | 별도 후속 Feature. 이번 범위에서 메인 화면으로 만들지 않는다 |
| 태그 필터 AND(교집합) 모드 | 이번엔 OR 고정 |
| 리스트 정렬 옵션 (최근순 / 횟수순 / 정답률순) | 이번엔 "최근 풀이순" 고정 (mock 배열 순서) |
| 페이지네이션 / 무한 스크롤 | 데이터량 증가 시 |
| 로드 실패 에러 상태 | API 연결 시 `FormAlert`(Alert) 재사용 |
| 재도전 버튼 (Detail → Timer) | Timer-History 연동 후속 |
| Problem 제목 / 난이도 / URL 표시 | `shared-types.Problem` 엔 존재하나 History mock 은 optional 취급. Contract 정렬 후 |
| toolbar action / manifest / chrome API 진입점 | 후속 기술 결정 |

---

## Out of Scope (이번 Feature 제외)

- 실제 문제풀이 내역 API 연결
- `chrome.storage` 연결
- 대시보드 통계 / 차트
- 태그별 취약도 분석
- 태그별 전용 대시보드 / 복습 화면
- 자동 문제 추천
- 재도전 기능 구현
- Attempt 수정 / 삭제 기능
- 검색 기능
- 페이지네이션 / 무한 스크롤 구현
- 정렬 옵션 UI
- 문제 제목 등 메타데이터를 필수 데이터로 가정
- `packages/shared-types` 수정
- API Contract 변경 / Backend 수정

---

## Product Decision Required

**없음.** UI Surface / 진입점 방향 / Result taxonomy / 태그 필터 정책(OR) / `tagIds` union 의미는 모두 확정됨.
Contract 불일치는 위 "Contract / Follow-up" 에 명시하며, mock 사용으로 UI 설계를 BLOCK 하지 않는다.
