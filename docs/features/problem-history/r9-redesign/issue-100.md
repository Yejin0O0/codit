# Issue 100: [UI-L2 R9] 문제풀이 목록 카드 재설계 — 태그 색상 + Option 5 (태그 우선)

## 시그니처

### 프론트엔드 (TypeScript)

**[확정] `lib/tag-colors.ts` — 신규 CUSTOM 유틸**

**근거**: prd.md 결정 — 검증기(`validate_palette.js`) 통과한 4개 hue 패밀리로
7개 카테고리 그룹핑, CORE는 filled primary(자체 리뷰 수정), CUSTOM은 secondary.

```ts
// lib/tag-colors.ts
export type TagColorFamily = 'core' | 'custom' | 'blue' | 'orange' | 'violet' | 'magenta';
export function tagColorFamily(tagId: string): TagColorFamily;
export function tagColorClass(tagId: string): string;
```

**[확정] `TagChipList` Props — 변경 없음**

```ts
interface TagChipListProps {
    tagIds: string[];
    catalog: TagChipOption[];
    className?: string;
}
```

내부 변경(시그니처 아님): 각 `Badge`의 `variant="secondary"` → `className={cn('font-normal', tagColorClass(tag.id))}`.

**[확정] `ProblemCard` Props — 변경 없음**

```ts
interface ProblemCardProps {
    problem: ProblemHistoryListItem;
    tagCatalog: TagOption[];
    onSelect: () => void;
}
```

내부 변경(시그니처 아님): `TagChipList`를 Card의 첫 자식으로 이동(기존: 마지막).

### 에러 케이스

없음 — 순수 표현 컴포넌트. `tagColorFamily`는 미매핑 카테고리를 `'custom'`으로 안전하게 폴백.

**결정 포인트**: CORE 색상 — 최초 `--accent` 확정 → 자체 리뷰(스크린샷)로 violet 패밀리와
혼동 발견 → filled `--primary`로 재확정. prd.md에 기록.

### 비-TS 변경

없음 — 기존 `--primary`/`--secondary` 토큰만 재사용, 새 CSS 변수 없음(칩 파스텔 4색은
Tailwind 임의값 `bg-[hex]`로 직접 지정 — `/design-system` 정식화 전 후보값, prd.md 참조).

---

## 테스트 시나리오

> 기존 `tag-chip-list.test.tsx`에 추가. `problem-card.test.tsx`는 기존 스위트가
> 텍스트 존재만 확인해 순서 변경에 영향받지 않음(회귀 없이 그대로 통과).
> `describe` 영어 / `it` 한국어 현재형.

### 정상

- [정상] TagChipList — CORE 태그(bfs)는 filled `bg-primary`/`text-primary-foreground`를 받는다
- [정상] TagChipList — 카테고리 태그(linked-list)는 매핑된 hue 패밀리 클래스(`bg-[#E6EEFC]`)를 받는다
- [정상] TagChipList — 카탈로그에 없는 카테고리(custom-user-tag)는 `bg-secondary`/`text-secondary-foreground`를 받는다

### 경계

- [경계] TagChipList — tagIds가 비면 아무것도 렌더하지 않는다 (기존 테스트, 회귀 가드)
- [경계] TagChipList — 카탈로그에 없는 tagId는 오류 없이 건너뛴다 (기존 테스트, 회귀 가드)

### 예외 (회귀 가드)

- [회귀] ProblemCard — 기존 8개 테스트(problemId·풀이횟수·소요시간·title·날짜·tag·클릭/키보드·focus·title 생략·날짜 생략·tagIds 빈 배열) 전부 그대로 통과 — 순서만 바뀌고 텍스트 존재 여부는 불변이라 영향 없음

---

## AC 커버리지

| AC | 커버 시나리오 |
| --- | --- |
| `lib/tag-colors.ts` 순수 함수 | 시그니처 [확정] |
| TagChipList 색상 적용, color-alone 아님 | [정상] 3건 — 태그 이름 텍스트는 모든 테스트에서 함께 확인 |
| ProblemCard Option 5 레이아웃 | [회귀] 기존 스위트 전건 통과 (텍스트 기반이라 순서 무관) |
| ProblemSummary/AttemptItem 자동 반영 | TagChipList 공유 구조 — 별도 테스트 불필요(단일 소스) |
| a11y — color-alone 아님 | [정상] 3건 모두 태그 이름 텍스트 동시 확인 |
| typecheck·lint·test·build·storybook green | tdd-green + security-review |
| CORE/카테고리 육안 구분 | create-pr 스크린샷 — 자체 리뷰로 1차 수정 완료 |
