# Issue 37: [timer-persistence] 위젯에 실제 문제 제목 표시

## 시그니처

### 프론트엔드 (TypeScript)

```ts
// content/problem/resolve-problem-title.ts (신규)
export function resolveProblemTitle(doc: Document): string | null;
```

- `doc.querySelector('p.problem_title')` → 없으면 `null`
- 있으면 직계 텍스트 노드만 골라 이어붙이고 trim (중첩된 배지 `<span class="badge
  badge-a">`는 element 노드라 자동 제외)
- 결과가 빈 문자열이면 `null`

```ts
// entrypoints/content/mount.tsx
function performMount(problemId: string): void {
    const problemTitle = resolveProblemTitle(document); // 신규 한 줄, 재시도 없음
    // ...
}
```

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

### 결정 사항

- **TimerScreen 표시 형식(안 A)**: 제목 있으면 제목만 표시, 없으면 기존처럼
  "문제 #{ID}"로 폴백

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

### TimerScreen / mount 통합

**정상**
- `[정상] TimerScreen` — `problemTitle`이 있으면 제목만 표시하고 "문제 #{ID}" 텍스트는 없다
- `[정상] mountCoditWidget(통합)` — 제목이 있는 mock DOM에서 mount하면 App이 `problemTitle`을 받아 표시한다

**경계**: `TimerScreen` — `problemTitle`이 없으면 기존처럼 "문제 #{ID}"로 폴백 표시(기존 `App.test.tsx` 테스트가 이미 커버, 신규 작성 불필요 — 회귀 확인용)

**예외**: 없음(표시 로직뿐, store/session과 무관)

> E2E는 `#16`/`#17`과 동일하게 Green 이후 이 이슈에 바로 추가 예정(별도 이슈 분리
> 안 함) — `e2e/fixtures/mock-problem.html`에 `p.problem_title` 마크업을 추가해
> 실제 Chrome에서 제목 표시를 검증한다.

---

## AC 커버리지

| AC | 커버 시나리오 |
|---|---|
| 배지 값(D3/D4) 미포함, 순수 텍스트만 | `[정상] resolveProblemTitle` (배지 제외) |
| problemDetail.do·solvingProblem.do 둘 다 같은 셀렉터로 동작 | 단일 셀렉터 구조로 자동 충족(페이지 분기 없음) |
| `p.problem_title` 없으면 null, ID로 폴백 표시 | `[예외] resolveProblemTitle`, `[경계] TimerScreen` 폴백 |
| 공백뿐이면 null | `[예외] resolveProblemTitle` (공백) |
| 기존 테스트 회귀 없음 | 기존 `mount.test.tsx`/`App.test.tsx` 그대로 통과 |
