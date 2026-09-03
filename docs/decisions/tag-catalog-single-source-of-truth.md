# Decision: Tag Catalog — Single Source of Truth

**Status: Accepted (retrospective record).** PR #10 `6971b55`
(`refactor: share timer and history tag catalog`) 에서 확정된 결정을 기록한다.
새 요구사항이 아니라 실제 코드·리뷰 결과의 정리다.

관련 코드: `apps/extension/lib/tag-catalog.ts` (+ `content/mockData.ts`,
`entrypoints/page/history/mock-data.ts`, `entrypoints/page/history/types.ts` 재노출).

---

## Context

Codit 은 문제 태그 taxonomy 를 두 곳에서 쓴다:

- **Floating Widget / Timer** — 태그 선택 화면(`TagPicker` → `TagToggleGroup`).
- **Problem History** — 태그 필터(`TagFilterPanel`), 태그 chip 표시(`TagChipList`).

PR #10 이전에는 이 taxonomy 가 `entrypoints/content/mockData.ts` 와
`entrypoints/page/history/mock-data.ts` 에 **각각 물리 복제**되어 있었다. 두 복사본이
동일해야 하지만, 이미 3개 태그의 **표시명이 drift** 되어 있었다:

| tag id | Timer 표시명 | History 표시명 (drift) |
|---|---|---|
| `shortest-path` | 최단경로(다익스트라/플로이드-워셜/벨만-포드) | 최단경로 |
| `mst` | 최소 신장 트리(크루스칼/프림) | 최소 신장 트리 |
| `string-search` | 문자열 탐색(패턴 매칭, KMP 등) | 문자열 탐색 |

tag `id` 집합(11 core + 14 category)은 두 곳이 완전히 일치했고, 필터·선택은 전부
`id` 기준이라 동작 영향은 없었으나, 표시명이 소리 없이 갈라지는 구조였다.

`TagOption` / `TagCategory` 타입도 `content/mockData.ts`(`Tag`),
`history/types.ts`(`TagOption`), `components/codit/tag-toggle-group.tsx`(`TagOption`),
`packages/shared-types`(`Tag`) 에 각각 정의되어 있었다(구조 동일 `{ id, name }`).

---

## Review Feedback

PR #10 코드 리뷰(`6971b55` 로 이어짐):

> Timer 와 History 가 동일한 제품 tag taxonomy 를 각각 물리 복제하고 있고, 표시명이
> 이미 일부 달라졌다. 같은 제품 taxonomy 를 하나의 Source of Truth 로 두고 두 feature
> 가 참조하게 하라.

동일 라운드의 후속 권고:

> Timer/History tag catalog 공통 SoT 승격 — 이번 리팩터 범위. (단 `TagToggleGroup`
> 의 로컬 prop 타입은 별개.)

---

## Decision

**태그 taxonomy 는 `apps/extension/lib/tag-catalog.ts` 단일 Source of Truth 로 둔다.**

`lib/tag-catalog.ts` 가 export 하는 것:

- `TagOption` (`{ id: string; name: string }`), `TagCategory` (`{ title; tags: TagOption[] }`).
- `CORE_TAGS: TagOption[]` — 기본 노출 핵심 태그 11종.
- `TAG_CATEGORIES: TagCategory[]` — "더보기" 7개 대분류 섹션(14 태그).
- `TAG_CATALOG: TagOption[]` — `[...CORE_TAGS, ...TAG_CATEGORIES.flatMap(c => c.tags)]`
  (id → name 역조회용 평탄화).

각 feature 는 **재노출만** 한다:

- `entrypoints/content/mockData.ts` — `export { CORE_TAGS, TAG_CATALOG, TAG_CATEGORIES }
  from '@/lib/tag-catalog'`, `export type Tag = TagOption`.
- `entrypoints/page/history/mock-data.ts` — `export { CORE_TAGS, TAG_CATALOG,
  TAG_CATEGORIES } from '@/lib/tag-catalog'`. (Problem/Attempt mock 만 History local.)
- `entrypoints/page/history/types.ts` — `export type { TagCategory, TagOption }
  from '@/lib/tag-catalog'`.

**표시명은 Timer 기준으로 통일**한다(drift 된 3개는 verbose 버전 채택).

`components/codit/tag-toggle-group.tsx` 의 로컬 `TagOption` interface 는 **유지**한다 —
이것은 taxonomy 데이터가 아니라 UI 프리미티브의 구조적 prop 타입이고, `codit/**` →
feature 역방향 import 금지 원칙을 지키기 위함이다.

`packages/shared-types` 는 이번 결정에서 수정하지 않는다 (백엔드 계약 미확정).

---

## Alternatives

- **두 복사본을 계속 유지하고 값만 맞춘다** — 거부. drift 가 이미 발생했고, 수동
  동기화는 반복적으로 깨진다.
- **`packages/shared-types` 에 taxonomy 를 둔다** — 거부. `shared-types` 는 익스텐션
  ↔ 백엔드 타입 공유용이고, 태그 taxonomy 는 아직 백엔드 계약이 없다(`GET /api/tags`
  의 `{ id, name, category }` 형태·numeric id 여부 미확정 — `frontend-handoff.md` §8-C).
  mock taxonomy 를 shared-types 에 박으면 백엔드 계약이 확정될 때 되돌려야 한다.
- **`components/codit/` 에 공용 조합으로 승격** — 거부. 태그 목록 데이터는 UI 조합이
  아니다. `codit/**` 는 프리미티브/조합 레이어이지 도메인 데이터 레이어가 아니다.
- **각 feature 가 `TAG_CATALOG` 를 직접 재-flatten** — 거부. `content/App.tsx` 가
  `PREDEFINED_TAGS` 로 재-flatten 하던 것도 `eda6141`/후속에서 `TAG_CATALOG` 직접
  사용으로 정리됨.

---

## Consequences

- (+) 표시명·id 가 Timer/History 에서 항상 일치한다. drift 불가능.
- (+) `mock-data.test.ts` 의 integrity 테스트가 History mock 의 `tagIds` 를 카탈로그와
  대조할 수 있다.
- (+) 후속(백엔드 `GET /api/tags` 연동)에서 `lib/tag-catalog.ts` 한 파일만
  교체/확장하면 된다.
- (+) 신규 코드(예: `content/tag-input.ts`, `timer-persistence`)가 태그 목록을
  필요로 하면 `@/lib/tag-catalog` 하나만 import.
- (−) `content/mockData.ts` 가 `MOCK_PROBLEM` 제거 후 사실상 "태그 재노출 + `Tag`
  타입 alias" 파일이 되어 이름이 다소 misnomer (rename 은 import 파급 때문에 보류).
- (−) `codit/tag-toggle-group.tsx` 에 여전히 로컬 `TagOption` 이 있어, `{ id, name }`
  shape 정의가 형식상 2벌(lib + toggle-group) 존재한다 — 의도된 분리(역방향 의존
  금지)지만 "완전 단일화" 는 아님.

---

## Regression Constraint

**이후 어떤 feature 도 태그 taxonomy 를 다시 물리 복제하지 않는다.**

- Timer / History / 신규 코드는 `@/lib/tag-catalog` 를 재노출/재사용만 한다.
- 태그 목록·표시명·카테고리 구조를 별도 배열로 복사하지 않는다.
- `lib/tag-catalog.ts` 를 수정할 때 두 feature 에 동시 반영되는 것이 정상 동작이다.
- `timer-persistence` `issues.md` "공통 구현 제약" #1 로도 기록됨.

---

## Future / Deferred

- **백엔드 `GET /api/tags` 연동** — 실제 서버 taxonomy 로 `lib/tag-catalog.ts` 교체.
  numeric id / `category` 필드 / CORE vs category 그룹핑을 계약 확정 후 반영.
  `frontend-handoff.md` §8-C.
- **`content/mockData.ts` rename** (예: `tags.ts`) — import 파급이 있어 별도 작업으로.
- **`codit/tag-toggle-group.tsx` 의 `TagOption` 을 lib 타입으로 통합** — `components`
  → `lib` 의존은 허용 범위지만 역방향 의존 원칙 재검토 필요. 별도 결정.
