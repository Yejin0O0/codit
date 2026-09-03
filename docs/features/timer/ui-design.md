# Timer Feature UI Design

> 이 문서는 tdd-green-frontend의 시각적 명세 참조 기준이다.
> 코드를 작성하지 않는다.
> 디자인 토큰·컴포넌트 규칙은 [../../ui/design-system.md](../../ui/design-system.md), 아키텍처는 [../../ui/ui-architecture.md](../../ui/ui-architecture.md) 참조.

---

## Flow

메모와 태그는 **별도 화면**이다. 같은 화면에 합치지 않는다.

```
[Timer] ──"완료"(타이머 정지·시간 고정)──▶ [결과 선택]
                                              │ 정답 / 오답 / 보류 택1 + "다음"
              ┌───────────────────────────────┼───────────────────────────────┐
           WRONG                           CORRECT                          HOLD
              │                               │                               │
     [오답 메모 화면]                   [정답 메모 화면]                        │  (메모 화면 건너뜀)
      Textarea 자동 노출                 "메모 추가하기"로 선택 확장             │
      메모는 선택 입력                    메모는 선택 입력                       │
      [뒤로] / [다음]                     [뒤로] / [다음]                        │
              │                               │                               │
              └───────────────┬───────────────┴───────────────────────────────┘
                              ▼
                      [태그 선택 화면]   핵심 11 · 더보기(7 섹션) · 직접입력 · 선택 개수
                      메모 UI 없음        [뒤로] / [저장](태그 ≥ 1)
                              │
                              ▼
                      [저장 완료 피드백]  ── 이후 패널 동작: 이번 UI Scope 밖
```

- `screen` 상태: `timer → result → (memo) → tags → success`. `memo`는 결과가 WRONG/CORRECT일 때만 거친다.
- 스텝 인디케이터: WRONG·CORRECT = 메모 `2 / 3` → 태그 `3 / 3` · HOLD = 태그 `2 / 2`. 결과 선택은 분기 전이라 미표기.

---

## 와이어프레임

### ① Timer

```
┌────────────────────────┐
│ 풀이 타이머            │
├────────────────────────┤
│  문제 #{problem_id}    │
│                        │
│       12:34            │   ← TimerDisplay
│                        │
│   ┌────────────────┐   │
│   │     완료       │   │
│   └────────────────┘   │
└────────────────────────┘
```

- 문제 정보: **확정 식별자(`problem_id` / 문제 번호)만 필수 표시.**
- 제목·난이도는 있으면 표시, 레이아웃 필수 요소 아님.

### ② 결과 선택

```
┌────────────────────────┐
│ 결과 선택              │   ← 분기 전이라 스텝 미표기
├────────────────────────┤
│  12:34 만에 풀이       │
│  ┌────┐┌────┐┌────┐    │   ← ResultToggleGroup (single)
│  │정답││오답││보류│    │
│  └────┘└────┘└────┘    │
│                        │
│              [다음]    │   ← 선택 시 활성. "뒤로" 없음 (완료는 커밋 지점)
└────────────────────────┘
```

### ③ 메모 화면 — 결과값에 따른 분기 (HOLD는 진입하지 않음)

```
③ 오답 메모                       ③′ 정답 메모
┌────────────────────────┐       ┌────────────────────────┐
│ 메모             2 / 3 │       │ 메모             2 / 3 │
├────────────────────────┤       ├────────────────────────┤
│ [오답]                 │       │ [정답]                 │
│ 메모                   │       │ ▸ 메모 추가하기        │
│ ┌────────────────────┐ │       │   (클릭 시 Textarea)   │
│ │ Textarea (자동)    │ │       │                        │
│ └────────────────────┘ │       │                        │
│  (선택 입력)           │       │  (선택 입력)           │
│                        │       │                        │
│ [뒤로]        [다음]   │       │ [뒤로]        [다음]   │
└────────────────────────┘       └────────────────────────┘
```

- **태그 UI를 절대 포함하지 않는다.**
- 메모는 선택 입력 — 작성하지 않아도 "다음"으로 진행 가능.
- "뒤로" → 결과 선택.

### ④ 태그 선택

```
┌────────────────────────┐
│ 태그 선택        3 / 3 │   ← HOLD 는 "2 / 2"
├────────────────────────┤
│ 태그        1개 이상 선택 │
│ ┌ 핵심 태그 ──────────┐ │
│ │(구현)(시뮬레이션)   │ │
│ │(완전 검색)(그리디)  │ │
│ │(BFS)(DFS)(정렬)     │ │
│ │(동적 계획법(DP))    │ │
│ │(배열)(문자열)(스택/큐)│ │
│ └─────────────────────┘ │
│      ▾ 더보기           │
│ 직접 입력:             │
│ [__________] (+ 추가)   │
│ N개 선택됨             │
│ [뒤로]        [저장]   │   ← 태그 0개면 [저장] disabled
└────────────────────────┘
```

- **메모 UI를 포함하지 않는다.**
- "뒤로" → 메모 화면 (HOLD는 결과 선택).

### ④-더보기 펼침

```
┌───────────────────────────────────────┐
│ ▴ 접기                                 │
│ 자료구조   (연결 리스트)(트리)(리스트(List))(해시)
│ 탐색·완전탐색   (백트래킹)(이분 탐색)
│ 그래프   (최단경로(다익스트라/플로이드-워셜/벨만-포드))(최소 신장 트리(크루스칼/프림))(위상 정렬)
│ 알고리즘 설계 기법   (분할 정복)
│ 문자열 알고리즘   (문자열 탐색(패턴 매칭, KMP 등))
│ 수학   (수학/정수론)
│ 고급   (NP-Complete)(근사 알고리즘)
└───────────────────────────────────────┘
```

- 위 7개 대분류는 **섹션 제목**이며, "더보기" 1회로 전부 펼쳐진다. 대분류를 클릭해 진입하는 navigation은 없다.

### ⑤ 저장 완료 (피드백)

```
┌────────────────────────┐
│         ✓              │   ← 인라인 SVG 체크 아이콘 (lucide 도입은 follow-up)
│   저장되었어요         │
│  결과 · 풀이시간 ·     │
│  태그 · 메모 요약      │
└────────────────────────┘
```

- 이번 Feature Scope는 **Save Feedback까지**다. 이후 패널 동작은 이번 UI Scope 밖.

---

## 컴포넌트 트리

```
CoditWidget                                   [CUSTOM] Shadow host + 위젯 프레임
└─ <screen: timer | result | memo | tags | success>
   ├─ TimerScreen
   │  └─ PanelShell                           [EXTEND ← Card]
   │     ├─ 문제 식별자 (problem_id)
   │     ├─ TimerDisplay                      [CUSTOM]
   │     └─ Button "완료"                     [USE]
   │
   ├─ ResultSelectScreen
   │  └─ PanelShell (스텝 없음)
   │     ├─ 풀이 시간 표시
   │     ├─ ResultToggleGroup (정답·오답·보류) [EXTEND ← Toggle Group, single]
   │     └─ Button "다음" (선택 시 활성)      [USE]
   │
   ├─ MemoScreen  <result: 정답 | 오답>   ── HOLD 는 진입 안 함
   │  └─ PanelShell (스텝 "2 / 3")
   │     ├─ 결과 표시                          [USE ← Badge]
   │     ├─ MemoField                          [USE ← Label + Textarea + Collapsible]
   │     │     오답 = Textarea 자동 노출 / 정답 = 접힘 + "메모 추가하기"
   │     │     (메모는 선택 입력, 태그 UI 없음)
   │     └─ Button "뒤로" / "다음"             [USE]
   │
   ├─ TagSelectScreen                          (메모 UI 없음)
   │  └─ PanelShell (스텝 "3 / 3", HOLD 는 "2 / 2")
   │     └─ TagPicker
   │        ├─ TagToggleGroup (multiple, chip) [EXTEND ← Toggle Group]
   │        │     핵심 태그 11종(항상) + 더보기 태그(전개 시) + 직접입력 태그
   │        ├─ Collapsible "더보기"            [USE]
   │        │     └─ 7개 대분류 섹션 제목 + 각 태그
   │        ├─ 직접 입력: Input + Button "추가" / Enter   [USE]
   │        ├─ 선택 개수 표시
   │        └─ Button "뒤로" / "저장" (태그 ≥ 1 시 활성)  [USE]
   │
   └─ SaveSuccessScreen
      └─ PanelShell
         ├─ 인라인 SVG 체크 아이콘             (lucide 도입은 follow-up)
         └─ "저장되었어요" + 요약
            (이후 패널 동작 = 이번 UI Scope 밖)
```

---

## 태그 (TagSelectScreen 전용)

**핵심 태그 11종 (기본 노출)**: 구현, 시뮬레이션, 완전 검색, 그리디, BFS, DFS, 정렬, 동적 계획법(DP), 배열, 문자열, 스택/큐

**"더보기" 7개 대분류** (1회 클릭으로 전부 전개, navigation 없음):

| 대분류 | 태그 |
|--------|------|
| 자료구조 | 연결 리스트 · 트리 · 리스트(List) · 해시 |
| 탐색·완전탐색 | 백트래킹 · 이분 탐색 |
| 그래프 | 최단경로(다익스트라/플로이드-워셜/벨만-포드) · 최소 신장 트리(크루스칼/프림) · 위상 정렬 |
| 알고리즘 설계 기법 | 분할 정복 |
| 문자열 알고리즘 | 문자열 탐색(패턴 매칭, KMP 등) |
| 수학 | 수학/정수론 |
| 고급 | NP-Complete · 근사 알고리즘 |

**직접 입력 UI(FR-011)**: 텍스트 입력 + Enter 또는 "추가" 버튼. 빈 문자열·중복 무시, 추가 시 즉시 선택.

---

## UI State

| 컴포넌트 | 상태 | 트리거 | 표현 |
|---------|------|--------|------|
| Widget | `timer` | 초기 진입 | TimerScreen |
| Widget | `result` | "완료" (타이머 정지·시간 고정) | ResultSelectScreen |
| Widget | `memo` | 결과 선택 후 "다음" (WRONG·CORRECT만) | MemoScreen |
| Widget | `tags` | 메모 "다음" · 또는 HOLD 선택 후 "다음" | TagSelectScreen |
| Widget | `success` | "저장" | SaveSuccessScreen |
| 스텝 | `memo` = "2 / 3" · `tags` = "3 / 3" (HOLD "2 / 2") · `result` 미표기 | 화면 진입 | PanelShell 헤더 |
| TimerDisplay | running | 측정 중 | `mm:ss` 증가 |
| TimerDisplay | stopped | "완료" | `mm:ss` 고정 |
| ResultToggleGroup | none | 진입 | 선택 없음 · "다음" 비활성 |
| ResultToggleGroup | `정답`/`오답`/`보류` | 토글 클릭 | 항목 강조 · "다음" 활성 |
| MemoScreen | — | HOLD | 진입하지 않음 (결과 선택 → 태그 선택 직행) |
| MemoField | expanded | `result=오답` 진입 | Textarea 표시 (선택 입력) |
| MemoField | collapsed | `result=정답` 진입 | "메모 추가하기" 트리거만 |
| MemoField | expanded | 정답 + "메모 추가하기" 클릭 | Textarea 표시 |
| Textarea | empty / filled | 입력 | placeholder / 값 |
| TagSection.더보기 | collapsed | 기본 | 핵심 11종 + "더보기" |
| TagSection.더보기 | expanded | "더보기" 클릭 | 나머지 태그 전체를 대분류 섹션 제목과 함께 노출 (접기 가능) |
| 직접입력 Input | idle | 기본 | placeholder ("태그 직접 입력") |
| 직접입력 Input | submit(유효) | Enter 또는 "추가" | 신규 태그가 선택 상태로 추가, Input 비움 |
| 직접입력 Input | submit(빈값·중복) | Enter 또는 "추가" | 추가 안 함 (무시) |
| TagToggleGroup | selectedCount = 0 | 진입 | 전체 비선택 · **저장 비활성** |
| TagToggleGroup | selectedCount ≥ 1 | chip 토글 / 직접입력 추가 | 선택 chip 강조 · **저장 활성** |
| 저장 버튼 | disabled | 선택 태그 0개 | 비활성 |
| 저장 버튼 | enabled | 선택 태그 ≥ 1개 | 활성 (메모 입력 여부 무관) |
| SaveSuccessScreen | shown | 저장 완료 | ✓ + 요약 |

---

## Interaction

- **완료**: 타이머 정지 + 시간 고정 → 결과 선택. 재측정 없음.
- **결과 선택**: 단일 토글. 선택 시 "다음" 활성. "뒤로" 없음 (완료는 커밋 지점).
  - WRONG·CORRECT "다음" → **메모 화면**
  - HOLD "다음" → **태그 선택 화면** (메모 화면 건너뜀)
- **메모 화면** (WRONG·CORRECT 전용): 오답은 Textarea 자동 노출, 정답은 "메모 추가하기"로 확장. 메모는 선택 입력이라 비워도 "다음" 가능. **태그 UI 없음.** "뒤로" → 결과 선택.
- **태그 선택 화면**: **메모 UI 없음.** "뒤로" → 메모 화면 (HOLD는 결과 선택).
- **더보기**: 7개 대분류를 섹션 제목으로 구분해 한 번에 전개. 대분류 진입 네비게이션 아님. 다시 접기 가능.
- **직접 입력**: 텍스트 입력 후 Enter 또는 "추가" → 태그 목록에 추가되고 즉시 선택 상태. 빈값·중복은 무시.
- **저장**: 선택 태그 ≥ 1일 때만 가능. 클릭 시 저장 완료 피드백 표시.
- **저장 완료 이후**: 이번 Feature Scope(= Save Feedback까지) 밖.

---

## Component Library Mapping

| 요소 | 분류 | 근거 |
|------|------|------|
| Button | **USE** | shadcn new-york 그대로 |
| Card | **USE** | 화면 셸 |
| Textarea | **USE** | 메모 입력 |
| Label | **USE** | 메모 라벨 |
| Input | **USE** | 태그 직접 입력 |
| 결과 선택 (`ResultToggleGroup`) | **EXTEND** ← shadcn/ui Toggle Group (single) | 선택 상태 유지형 + 의미색 3종 |
| 태그 선택 (`TagToggleGroup`) | **EXTEND** ← shadcn/ui Toggle Group (multiple) / Base UI Toggle은 대체 후보 | 다중 선택 chip. CUSTOM 재구현 안 함 |
| 더보기 · 메모 추가하기 | **USE** ← shadcn/ui Collapsible | 표준 확장/축소 |
| `TimerDisplay` | **CUSTOM** | `tabular-nums` 대형 `mm:ss`. 대응 primitive 없음 |
| Screen/Panel (`PanelShell`) | **EXTEND** ← Card | 제목 + 스텝 인디케이터 고정 레이아웃 |
| `CoditWidget` | **CUSTOM** | Shadow host 래퍼 |
| Badge | **USE** (선택) | 결과 표시 |

---

## shadcn/ui 사용 컴포넌트

| 컴포넌트 | 용도 | 커스터마이징 |
|---------|------|------------|
| Button | 액션 전반 | 없음 |
| Card | 화면 셸 (`PanelShell`로 EXTEND) | 헤더 스텝 인디케이터 |
| Textarea | 메모 | 없음 |
| Label | 메모 라벨 | 없음 |
| Input | 태그 직접 입력 | 없음 |
| Toggle Group | 결과 선택 / 태그 선택 | `ResultToggleGroup`, `TagToggleGroup`로 EXTEND |
| Collapsible | 더보기 / 메모 추가하기 | 없음 |
| Badge | 결과 표시 | 없음 (선택 사용) |

---

## Out of Scope / Follow-up

| 항목 | 분류 | 비고 |
|------|------|------|
| 일시정지 / 재개 | Out of Scope | 확정 기능 아님. Prototype에만 존재, Production 설계 제외 |
| 저장 완료 후 패널 동작 (닫힘 / 새 문제 / 대기 등) | Out of Scope | 이번 Feature Scope = Save Feedback까지 |
| 완료 후 재측정 (Timer 복귀) | Follow-up | 이번 스코프 밖 |
| 보류 결과의 선택적 메모 | Follow-up (Product Decision 후보) | MVP UI는 "보류 → 메모 화면 건너뜀"으로 확정 |
| 문제 제목 · 난이도 표시 | Follow-up | 확정 식별자(`problem_id`)만 필수 |
| 저장 완료 아이콘 lucide 전환 | Follow-up | 현재 인라인 SVG. `lucide-react` 도입 시 교체 |
| 태그 대분류 taxonomy | 확정 (7 대분류) | 위 "태그" 섹션 참조. 데이터는 mock 배열로 보유, 실제 소스 연결은 이후 단계 |
