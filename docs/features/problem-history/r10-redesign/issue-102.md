# Issue 102: [UI-L2 R10] 문제 상세(회차 히스토리) 재설계 — Option 5 (좌우 분할)

## 시그니처

### 프론트엔드 (TypeScript)

**[확정] `AttemptTimeline` Props — 변경 없음**

```ts
interface AttemptTimelineProps {
    attempts: ProblemAttempt[];
    tagCatalog: TagOption[];
}
export function AttemptTimeline(props: AttemptTimelineProps): JSX.Element | null;
```

내부 변경(시그니처 아님): `useState<number>(selectedSeq)` 내부 소유, 다중 회차일 때
좌측 회차 목록(`role="group"`) + 우측 `AttemptItem` 상세 패널로 분기 렌더.

**[확정] `AttemptItem` — 변경 없음** (상세 패널 콘텐츠로 그대로 재사용)

### 에러 케이스

- `attempts`가 빈 배열이면 `selected`가 `undefined` → `null` 반환 (방어적, 기존과 동일한 안전장치 — 실제 데이터에서는 발생하지 않음)

**결정 포인트**: 없음 — 스파이크(prd.md)에서 Option 5로 확정.

### 비-TS 변경

없음.

---

## 테스트 시나리오

> `attempt-timeline.test.tsx` 전면 재작성(구조 변경에 따른 의도적 회귀).
> `problem-detail-view.test.tsx` 쿼리 조정(동일 seq 텍스트가 사이드바+패널 양쪽에 나타날 수 있음).
> `describe` 영어 / `it` 한국어 현재형.

### 정상

- [정상] AttemptTimeline — 여러 회차면 회차 목록(사이드바)을 seq 내림차순으로 표시하고, 기본으로 최신 회차 상세를 보여준다
- [정상] AttemptTimeline — 다른 회차 버튼을 클릭하면 상세 패널이 그 회차로 바뀐다

### 경계

- [경계] AttemptTimeline — attempts 길이가 1이면 회차 목록 없이 AttemptItem 하나만 표시한다
- [경계] AttemptTimeline — 정렬 시 입력 attempts 배열을 변경하지 않는다 (기존 테스트, 회귀 가드)

### 예외 (회귀 가드)

- [회귀] ProblemDetailView — detail resolve 시 ProblemSummary + AttemptTimeline 표시 (쿼리를 `queryAllByText` 기반으로 조정 — 동일 seq 텍스트 중복 대응)

---

## AC 커버리지

| AC | 커버 시나리오 |
| --- | --- |
| selectedSeq를 AttemptTimeline이 소유 | 시그니처 [확정] + [정상] 클릭 전환 |
| 기본 선택 = 최신 회차 | [정상] 사이드바 정렬 + 기본 선택 |
| 클릭으로 상세 패널 전환 | [정상] 클릭 전환 |
| 회차 버튼 결과색 dot + 텍스트 병기 | [정상] 사이드바 렌더 — `aria-hidden` dot + 보이는 seq 텍스트 |
| TagChipList 공유로 R9 색상 자동 반영 | AttemptItem 재사용 구조 — 별도 테스트 불필요(단일 소스) |
| a11y — aria-current, role=group, 표준 버튼 시맨틱 | [정상] 2건에서 `aria-current`/`role="group"` 쿼리로 확인 |
| 단일 회차 폴백 | [경계] 단일 회차 |
| typecheck·lint·test·build·storybook green | tdd-green + security-review |
