# 문제풀이 목록 카드 r9-redesign UI Design

> 이 문서는 tdd-green-frontend의 시각적 명세 참조 기준이다.
> 코드를 작성하지 않는다.

## 와이어프레임

### ProblemCard — Option 5 (재설계 후)

```
┌──────────────────────────────────┐
│ [구현] [동적 계획법(DP)]          │ ← 색상 태그, 카드 맨 위 (CORE=filled primary)
│ #1859                    [정답]   │
│ 타일 채우기 문제                  │
│ 풀이 3회 · 11:32 · 2026-08-30     │
└──────────────────────────────────┘
```

CORE 태그(filled `--primary`)와 카테고리 태그(파스텔 4색: blue/orange/violet/magenta)가
톤 자체로 구분된다 — 태그 이름 텍스트는 항상 함께 보인다(color-alone 아님).

---

## 컴포넌트 트리

```
ProblemCard (변경 — TagChipList 위치만 이동)
├── TagChipList          ★ 카드 맨 위로 이동 (기존: 맨 아래)
│   └── Badge (반복, 색상 클래스 적용) ★ variant="secondary" 제거 → tagColorClass(tagId)
├── #문제번호 + ResultBadge (불변)
├── title (불변, 있으면)
└── 메타 줄(풀이 횟수·시간·날짜) (불변)

lib/tag-colors.ts (신규 CUSTOM 유틸)
├── tagColorFamily(tagId) → 'core' | 'custom' | 'blue' | 'orange' | 'violet' | 'magenta'
└── tagColorClass(tagId) → Tailwind 클래스 문자열
```

`ProblemSummary`/`AttemptItem`은 `TagChipList`를 그대로 재사용 — 별도 변경 없이 색상 자동 반영.

---

## UI State

| 컴포넌트 | 상태 | 트리거 | 표현 |
|---------|------|--------|------|
| TagChipList | CORE 태그 | `tagColorFamily==='core'` | filled `bg-primary text-primary-foreground` |
| TagChipList | 카테고리 태그 | 7개 카테고리 중 하나 | 파스텔 4색 중 매핑된 hue (`bg-[hex] text-[hex]`) |
| TagChipList | CUSTOM(미매핑) 태그 | 카탈로그에 없는 카테고리 | `bg-secondary text-secondary-foreground` |
| TagChipList | tagIds 빈 배열 | — | 아무것도 렌더 안 함 (기존과 동일, `null` 반환) |

부모 상태 영향: 없음 — `ProblemListView`의 필터·정렬 로직은 `ProblemCard`가 받는
`problem.tagIds` 순서를 그대로 쓴다.

---

## shadcn/ui 사용 컴포넌트

| 컴포넌트 | 용도 | 커스터마이징 |
|---------|------|------------|
| Badge | 태그 칩 | `className`으로 색상 오버라이드 (variant 제거) |

---

## Out of Scope (이번 Feature 제외)

- 문제 상세 화면 구조 (R10)
- 새 카테고리 추가 시 색 재배정
