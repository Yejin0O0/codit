# SaveSuccess r5-redesign UI Design

> 이 문서는 tdd-green-frontend의 시각적 명세 참조 기준이다.
> 코드를 작성하지 않는다.

## 와이어프레임

### SaveSuccessScreen (재설계 후 — 안 B-1)

```
┌─ PanelShell ──────────────────────┐
│ ⓒ 저장 완료                    ⌄ │  ← step 없음 (터미널 화면)
├────────────────────────────────────┤
│                                    │
│            ( ✓ )                   │  ← 체크 아이콘 원 (bg-success/10) — 변경 없음
│          저장되었어요               │  ← text-sm font-semibold — 변경 없음
│                                    │
│   ┌────────────────────────────┐  │  ← 요약 dl (bg-muted/50 rounded-lg p-3)
│   │ 결과            [ 정답 ]   │  │  ← ★ 값 자리: 텍스트 → ResultBadge (success 채움)
│   │ 풀이 시간        12:34     │  │  ← 변경 없음 (tabular-nums)
│   │ 태그       DFS, 그리디, …  │  │  ← 변경 없음 (없으면 "없음")
│   │ 메모                       │  │  ← 변경 없음
│   │ 다익스트라로 풀었다         │  │     (없으면 "없음", whitespace-pre-wrap)
│   └────────────────────────────┘  │
│                                    │
└────────────────────────────────────┘
```

유일한 구조 변경: 요약 dl "결과" 행의 `<dd>` 안 `{RESULT_LABELS[result]}` 텍스트를
`<ResultBadge result={result} className="w-fit" />`로 교체. "결과" 행은 `flex justify-between`
이라 `<dd>`가 우측에 위치하고, 배지 높이가 텍스트보다 커서 행에 `items-center`를 추가한다.
정답=success / 오답=destructive / 보류=warning —
`ResultToggleGroup`·`ResultSelectScreen`·`MemoScreen`·`TagSelectScreen`과 동일한 배색 언어.

---

## 컴포넌트 트리

```
SaveSuccessScreen
├── PanelShell                  → CUSTOM (R0, 변경 없음) — title="저장 완료"
│   └── body
│       ├── 헤더 블록 (변경 없음)
│       │   ├── span.rounded-full (체크 아이콘 원, inline SVG)
│       │   └── p "저장되었어요"
│       └── dl (bg-muted/50, 변경 없음)
│           ├── 결과   → dt "결과" + dd → ResultBadge   ★ 텍스트에서 교체
│           ├── 풀이 시간 → dt + dd {formatDuration}      (변경 없음)
│           ├── 태그   → dt + dd {tags.join(', ') | '없음'} (변경 없음)
│           └── 메모   → dt + dd {memo.trim() | '없음'}   (변경 없음)
```

`ResultBadge`는 R2 이전부터 있던 CUSTOM 컴포넌트(`components/codit/result-badge.tsx`)를
재배치만 한다 — 신규 컴포넌트/EXTEND 없음.

---

## UI State

| 컴포넌트 | 상태 | 트리거 | 표현 방식 |
|---------|------|--------|----------|
| ResultBadge | CORRECT | 화면 진입 시 result=CORRECT | success 채움 배경 + "정답" |
| ResultBadge | WRONG | 화면 진입 시 result=WRONG | destructive 채움 배경 + "오답" |
| ResultBadge | HOLD | 화면 진입 시 result=HOLD | warning 채움 배경 + "보류" |
| 태그 dd | 있음 | tags.length > 0 | 쉼표로 이은 태그 이름 |
| 태그 dd | 없음 | tags.length === 0 | "없음" |
| 메모 dd | 있음 | memo.trim() 비어있지 않음 | 메모 원문 (whitespace-pre-wrap) |
| 메모 dd | 없음 | memo.trim() 비어있음 | "없음" |

부모(App.tsx) 상태 영향: 없음 — `result`/`elapsedSeconds`/`memo`/`tags`는 이미 App.tsx가
prop으로 넘긴다. 이번 라운드는 "결과" 값의 표현만 바꾼다.

---

## shadcn/ui 사용 컴포넌트

이번 라운드에서 새로 추가되는 shadcn/ui 컴포넌트는 없다.

| 컴포넌트 | 용도 | 커스터마이징 |
|---------|------|------------|
| Badge (via `ResultBadge`) | 요약 dl "결과" 값 표시 | 없음 — 기존 `ResultBadge`(EXTEND) 재사용 |

---

## Out of Scope (이번 Feature 제외)

- "새 문제" / "닫기" 등 종료 액션 버튼 추가 — 별도 이슈
- `App.tsx` / 저장 로직(`handleSave`) 변경 — 레이아웃만 (#73과 무관)
- `--success` 등 토큰 값 — R3(#71)에서 완료
- 헤더 블록(체크 원 + "저장되었어요") 재배치 — 이번엔 "결과" 값만 교체 (안 B-2 기각)
- R6 CollapsedTimer 점검 — 다음 라운드
