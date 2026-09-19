# Extension Page r7-redesign UI Design

> 이 문서는 tdd-green-frontend의 시각적 명세 참조 기준이다.
> 코드를 작성하지 않는다.

## 와이어프레임

### ExtensionPageShell + PageHeader — Option C (재설계 후)

```
┌──────────────────────────────────────────┐
│ Ⓒ Codit                    you@example.com│ ← sticky top-0, bg-background/95 backdrop-blur-sm, border-b
├──────────────────────────────────────────┤
│  bg-muted (페이지 배경)                    │
│   ┌────────────────────────────────────┐ │
│   │  bg-background rounded-lg border    │ │ ← 카드 프레임 (콘텐츠 슬롯)
│   │  shadow-sm                          │ │
│   │                                      │ │
│   │   (children — HistoryView 등)        │ │
│   │                                      │ │
│   └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

스크롤해도 헤더는 고정, 카드 프레임은 페이지와 함께 스크롤.

### AuthPlaceholder (좁은 폭, maxWidth=400)

```
┌──────────────────┐
│ Ⓒ Codit          │ ← userName 없음 → 사용자 영역 생략
├──────────────────┤
│  ┌──────────────┐ │
│  │ 로그인 화면은 │ │
│  │ 이후 이슈에서 │ │
│  │ 구현됩니다.   │ │
│  └──────────────┘ │
└──────────────────┘
```

---

## 컴포넌트 트리

```
ExtensionPageShell (변경 — 내부 렌더만, props 불변)
├── header 슬롯 → PageHeader (변경 — sticky/backdrop-blur 클래스 추가)
└── extension-page-shell-container
    └── extension-page-shell-content ★ 신규 data-slot — 카드 프레임
        └── children (HistoryView 또는 auth placeholder)
```

`ExtensionPageShell`/`PageHeader` 둘 다 새 shadcn 컴포넌트 없음 — 기존 프레임 컴포넌트의
내부 className/구조만 변경.

---

## UI State

| 컴포넌트 | 상태 | 트리거 | 표현 |
|---------|------|--------|------|
| PageHeader | 항상 | — | sticky top-0, bg-background/95, backdrop-blur-sm, border-b |
| ExtensionPageShell | 항상 | — | children이 카드 프레임(rounded-lg border shadow-sm)에 감싸짐 |
| ExtensionPageShell | header 없음 | `header` prop 미전달 | 헤더 영역 생략 (기존과 동일) |

부모 상태 영향: 없음 — 순수 프레젠테이션 컴포넌트, 데이터 흐름 불변.

---

## shadcn/ui 사용 컴포넌트

새로 추가되는 shadcn/ui 컴포넌트 없음 — 기존 `Card`/`Button` 등도 사용하지 않음(순수 div 프레임).

---

## Out of Scope (이번 Feature 제외)

- 로그아웃 배선 (R8)
- 페이지 콘텐츠(HistoryView/ProblemCard) 재설계 (R9/R10)
