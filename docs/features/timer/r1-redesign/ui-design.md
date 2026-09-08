# Timer 화면 재설계 — UI Design (R1)

> tdd-green-frontend 시각 명세. 코드 작성 안 함. 에픽 #51 · 이슈 #54.
> `TimerScreen` 본문 + `TimerDisplay` 레이아웃만. 동작·라우팅·persistence 불변.

## 와이어프레임

```
┌──────────────────────────────────┐  Card, shadow-lg, rounded-xl (R0 프레임)
│  C  1024. 최단 경로        [ ⌄ ]  │  헤더: CoditMark + h2(문제 제목, truncate) + 접기
├──────────────────────────────────┤  border-b
│                                  │
│            12:34                 │  TimerDisplay — text-7xl tabular-nums, 중앙
│                                  │
│           ● 측정 중              │  펄스 도트(민트 animate-ping) + "측정 중"
│                                  │  py-5 (R0 roomy)
├──────────────────────────────────┤  border-t
│  ┌────────────────────────────┐  │
│  │            완료             │  │  Button default, w-full
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

- 헤더 제목 = `problemTitle` (없으면 `문제 #{id}`). `풀이 타이머` 라벨 삭제.
- 긴 제목 → `truncate`, 접기 버튼 고정 (헤더 `min-w-0` 처리).
- 본문 = 타이머 + 러닝 표시 2개만. 별도 문제 라벨 없음.

## 컴포넌트 트리

```
TimerScreen
└── PanelShell                         → title={problemLabel(id, title)}, footer=<완료>
    └── (본문)
        └── <div flex-col items-center gap-3>
            └── TimerDisplay            → CUSTOM
                ├── <div text-7xl tabular-nums>{mm:ss}</div>
                └── (running 시) <p>     → <span pulse-dot aria-hidden /> {caption}
```

- `problemLabel(id, title)` = TimerScreen 로컬 헬퍼 (기존). `title || 문제 #${id}`.
- `TimerDisplay` 시그니처: `{ seconds, caption?, running?, className? }` — `running` 신규 optional.
  - `running && caption` → 캡션 앞에 펄스 도트.
  - 펄스 도트: `<span>` 2겹 (`bg-success` + `animate-ping` 오버레이), `aria-hidden`, size-1.5.

## UI State

| 컴포넌트 | 상태 | 트리거 | 표현 |
|---------|------|--------|------|
| 헤더 제목 | 제목 있음 | `problemTitle` truthy | 제목 텍스트, truncate |
| 헤더 제목 | 폴백 | `problemTitle` 없음 | `문제 #{problemId}` |
| TimerDisplay | 기본 | 항상 | `mm:ss` text-7xl |
| TimerDisplay 캡션 | running | `running` + `caption` | 펄스 도트 + caption |
| TimerDisplay 캡션 | 캡션만 | `caption` (running 없음) | 텍스트만 (기존 동작) |
| TimerDisplay 캡션 | 없음 | `caption` 미주입 | 미렌더 |

## shadcn/ui

새 컴포넌트·토큰 없음. `--success`(펄스 도트), `--foreground`(타이머), text-7xl.

## Out of Scope

- R2~R5 다른 화면 · CollapsedTimer(R6) · 다크 · step 번호 체계
- 헤더 `min-w-0`/`truncate` 는 R1이 첫 긴 제목을 도입하므로 `PanelShell` 에 함께 추가 (R0 파일이지만 R1 스택)
