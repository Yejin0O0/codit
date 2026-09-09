# widget-shell UI Design

> 이 문서는 tdd-green-frontend의 시각적 명세 참조 기준이다. 코드를 작성하지 않는다.
> Layer 2 R0 · 에픽 #51 · 이슈 #52. `PanelShell`·`CoditWidget` **레이아웃만** 재설계 —
> props 시그니처·동작 로직 불변.

## 재설계 결정 (Product Decision — 스파이크 스토리에서 개발자 확정)

| # | 항목 | 결정 |
|---|------|------|
| 1 | 섹션 구분 | **전폭 divider 유지** — 헤더 `border-b` / 푸터 `border-t` 그대로. (스파이크에서 A 선택 — 320px 흰 배경 위에서 명확한 구조가 낫다고 판단) |
| 2 | 진행 단계 | **도트** — `2 / 4` 텍스트 → `● ● ○ ○` (완료+현재 채움 / 남음 빈). 헤더 우측, 접기 버튼 왼쪽. `step` 미주입 시 미렌더 |
| 3 | 밀도 | **roomy** — 헤더/푸터 `py-3.5`, 본문 `py-5` (현재 py-3 / py-4 → 한 단계씩 크게). `px-4` 공통 유지 |
| 4 | 제목 시맨틱 | `<h2>` heading (기존 `<span>`) — a11y. 시각 스타일(`text-sm font-semibold`)은 유지 |
| 5 | 아이콘 | 전부 인라인 `<svg>` (`panel-shell.tsx` 내부). 라이브러리 미도입 원칙 |

> **현재 대비 실제 변경**: ① step 텍스트 → 도트  ② 밀도 roomy  ③ 제목 h2
> ④ 헤더 좌측에 `CoditMark`(단색 C) — 접힌 pill 과 브랜드 일관성 (#55 로 마크 자체는 별도 개선).
> divider·footer 버튼 배치·shadow·drag·collapse 동작은 **전부 유지**.

---

## 와이어프레임

`step` / `footer` 슬롯 조합에 따른 3가지 프레임 형태. (본문 콘텐츠는 각 화면 R1~R5 소관 — 여기선 `{ 화면 본문 }` 로만 표기)

### 형태 A — title + collapse, footer 단일 (Timer)

```
┌───────────────────────────────┐  ← Card, shadow-lg(primary 틴트), rounded-xl
│  풀이 타이머            [ ⌄ ]  │  h2            ghost icon btn   (py-3.5)
├───────────────────────────────┤  border-b (전폭)
│                               │
│        { 화면 본문 }          │  px-4 py-5 (roomy)
│                               │
├───────────────────────────────┤  border-t (전폭)
│  ┌─────────────────────────┐  │  (py-3.5)
│  │          완료           │  │  Button default, w-full
│  └─────────────────────────┘  │
└───────────────────────────────┘
```

### 형태 B — title + step 도트 + collapse, footer 이중 (Memo, TagSelect)

```
┌───────────────────────────────┐
│  메모        ● ● ○ ○   [ ⌄ ]  │  h2   step dots   ghost icon
├───────────────────────────────┤  border-b
│                               │
│        { 화면 본문 }          │  py-5
│                               │
├───────────────────────────────┤  border-t
│  ┌─────────┐   ┌───────────┐  │
│  │  뒤로   │   │   다음    │  │  outline(왼쪽) + default, 각 flex-1
│  └─────────┘   └───────────┘  │
└───────────────────────────────┘
```

### 형태 C — title + collapse, footer 없음 (SaveSuccess)

```
┌───────────────────────────────┐
│  저장 완료             [ ⌄ ]  │
├───────────────────────────────┤  border-b
│                               │
│        { 화면 본문 }          │  py-5, footer 없음 → 본문이 하단까지
│                               │
└───────────────────────────────┘
```

### 헤더 우측 영역 상세 (step + collapse 공존)

```
 메모                    ● ● ○ ○   [ ⌄ ]
 └ h2 (flex-1)           └ dots     └ collapse (data-codit-no-drag)
                         └───── gap-2 ─────┘
```

- `step` 없으면: `메모 ················· [ ⌄ ]`
- `onCollapse` 없으면: `메모 ················· ● ● ○ ○`
- 둘 다 없으면: `메모` 만
- 드래그 핸들 = 헤더 전체(`dragHandlers` 주입 시). 단 collapse 버튼(`data-codit-no-drag`)에서 시작한 pointerdown은 드래그 아님 — 기존 동작 유지

---

## 컴포넌트 트리

```
CoditWidget                         → 표현 전용 래퍼 (변경 없음: w-full, text-foreground)
└── PanelShell                      → EXTEND ← shadcn Card
    ├── <header>                    → border-b, px-4 py-3.5 · 선택적 드래그 핸들
    │   ├── <h2>{title}</h2>        → text-sm font-semibold, flex-1
    │   ├── StepDots (조건부)       → step="n / N" 파싱 → 원 N개 (n개 채움)
    │   │                             <span> size-1.5 rounded-full (채움 bg-primary / 빈 bg-input)
    │   └── Button (조건부)         → shadcn Button variant=ghost size=icon
    │       └── <svg> chevron-down  → aria-hidden, size-4
    ├── <div>{children}</div>       → 본문 슬롯, px-4 py-5
    └── <footer>{footer}</footer>   → 조건부. border-t, px-4 py-3.5. 화면이 Button 주입
```

새로 만드는 하위 컴포넌트: **`StepDots`** (PanelShell 내부 로컬 — 별도 파일/export 불필요).
`"2 / 4"` 형태 문자열을 파싱해 채운 원 · 빈 원을 렌더. 파싱 실패 시 원문 텍스트로 폴백.

---

## UI State

| 컴포넌트 | 상태 | 트리거 | 표현 방식 |
|---------|------|--------|----------|
| PanelShell | 기본 | 항상 | Card(shadow-lg, rounded-xl, overflow-hidden) + 헤더 + 본문 |
| PanelShell 헤더 | static | `dragHandlers` 미주입 | 커서 기본, pointerdown 무시 |
| PanelShell 헤더 | draggable | `dragHandlers` 주입 | `cursor: grab`, pointerdown → `onPointerDown` (collapse 버튼 위 제외) |
| StepDots | hidden | `step` 미주입 | 미렌더 |
| StepDots | n / N | `step="n / N"` | 원 N개, 앞 n개 채움(`bg-primary`)·나머지 빈(`border-input`) |
| StepDots | fallback | `step` 파싱 불가 | 문자열 그대로 렌더 (기존 동작 보존) |
| Collapse 버튼 | hidden | `onCollapse` 미주입 | 미렌더 |
| Collapse 버튼 | idle | `onCollapse` 주입 | ghost 아이콘 버튼, `aria-label="Codit 위젯 접기"` (화면-중립) |
| Collapse 버튼 | hover | 포인터 | `bg-accent` |
| Collapse 버튼 | focus | 키보드 | focus ring(`ring-ring`) |
| Collapse 버튼 | 포커스 복귀 | collapsed→expanded 전환 | `collapseControlRef`로 포커스 이동 (기존 동작) |
| Footer | absent | `footer` 미주입 | 미렌더, 본문이 카드 하단까지 |
| Footer | 단일 액션 | `footer`에 Button 1개 | 상단 hairline + full-width primary |
| Footer | 이중 액션 | `footer`에 Button 2개 | 상단 hairline + outline(왼쪽)·primary, 각 `flex-1` |

**상태 간 영향**: `step` + `onCollapse` 동시 주입 시 헤더 우측에서 `gap-2`로 나란히. `h2`는 `flex-1`로 남은 공간 차지 → 우측 영역이 밀리지 않음.

---

## shadcn/ui 사용 컴포넌트

| 컴포넌트 | 용도 | 커스터마이징 |
|---------|------|------------|
| Card | PanelShell 프레임 베이스 | `shadow-lg`(primary 틴트) · `rounded-xl` · `overflow-hidden` · `gap-0 py-0` (헤더/본문/푸터가 자체 패딩) |
| Button | 접기 컨트롤 / 푸터 액션 | 접기 = `ghost` `size-icon`; 푸터 = 화면이 주입(`default` / `outline`) |

새 shadcn 컴포넌트 추가 없음. 새 토큰 필요 없음 (기존 `--border` `--primary` `--input` `--accent` `--ring` `--radius` + `shadow-lg`).

---

## Out of Scope

- 컴포넌트 분해·props 변경·상태 이동 (PanelShell/CoditWidget 시그니처 고정)
- 각 화면 본문 레이아웃 (Timer·ResultSelect·Memo·TagSelect·SaveSuccess) → R1~R5
- CollapsedTimer(접힌 pill) → R6
- 다크 모드
- 새 디자인 토큰 값 정의
- z-index 정리(`mount.tsx` ↔ `--z-widget`) — 관련이지만 이슈 #52 "함께" 항목, 별 커밋
