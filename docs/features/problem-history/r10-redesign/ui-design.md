# 문제 상세(회차 히스토리) r10-redesign UI Design

> 이 문서는 tdd-green-frontend의 시각적 명세 참조 기준이다.
> 코드를 작성하지 않는다.

## 와이어프레임

### AttemptTimeline — 여러 회차 (Option 5, 재설계 후)

```
┌────────────────────────────────────────┐
│ ← 목록으로                               │
│ 문제 #1859 · 타일 채우기 문제             │
│ [정답] 총 풀이 횟수 3회                   │
│ [구현] [동적 계획법(DP)]                  │
│ ┌────────┐  │  3회차            [정답]   │
│ │3회차 ●│  │  11:32 · 2026-08-30        │ ← 선택된 회차 = AttemptItem 그대로
│ │2회차 ●│  │  [구현] [동적 계획법(DP)]     │
│ │1회차 ●│  │  메모 DP 점화식 다시 세워...  │
│ └────────┘  │                            │
└────────────────────────────────────────┘
   ● = 결과색 dot (success/destructive/warning)
   기본 선택 = 최신(3회차). border-l 로 사이드바/패널 구분.
```

### AttemptTimeline — 단일 회차 (변경 없음)

```
┌────────────────────────────────────────┐
│ ← 목록으로                               │
│ 문제 #2178                               │
│ [오답] 총 풀이 횟수 1회                   │
│ [BFS]                                    │
│ 1회차                            [오답]   │ ← 목록 없이 AttemptItem 단독
│ 23:11 · 2026-08-28                       │
│ [BFS]                                    │
└────────────────────────────────────────┘
```

---

## 컴포넌트 트리

```
AttemptTimeline (재설계 — 내부 구조 전면 변경, props 불변)
├── (attempts.length === 1) → AttemptItem 단독 (불변, 재사용)
└── (attempts.length > 1)
    ├── div[role="group"][aria-label="회차 목록"]  ★ 신규 — 사이드바
    │   └── button (반복, seq 내림차순)
    │       ├── span {seq}회차
    │       └── span.rounded-full  ★ 결과색 dot (aria-hidden)
    └── div (상세 패널, border-l)
        └── AttemptItem (불변, 선택된 회차로 재사용)
```

`AttemptItem`은 시그니처·내부 마크업 모두 불변 — 상세 패널 콘텐츠로 그대로 재사용.

---

## UI State

| 컴포넌트 | 상태 | 트리거 | 표현 |
|---------|------|--------|------|
| AttemptTimeline | 단일 회차 | `attempts.length === 1` | 목록 없이 `AttemptItem` 단독 |
| AttemptTimeline | 다중 회차, 초기 | `attempts.length > 1` mount | 최신 회차(`seq` 최대) 자동 선택 |
| 회차 버튼 | 선택됨 | `attempt.seq === selectedSeq` | `aria-current="true"`, `border-primary bg-accent` |
| 회차 버튼 | 미선택 | — | `border-transparent`, hover 시 `bg-muted` |
| 상세 패널 | 회차 전환 | 회차 버튼 클릭 | `AttemptItem`이 선택된 회차로 즉시 리렌더 |

부모(`ProblemDetailView`) 상태 영향: 없음 — `selectedSeq`는 `AttemptTimeline`이 자체 소유.

---

## shadcn/ui 사용 컴포넌트

새로 추가되는 shadcn/ui 컴포넌트 없음 — 순수 `<button>`/`<div>` + 기존 `AttemptItem` 재사용.

---

## Out of Scope (이번 Feature 제외)

- `ProblemSummary` 레이아웃 (색상만 R9로 자동 반영)
- 모바일/좁은 폭 대응
