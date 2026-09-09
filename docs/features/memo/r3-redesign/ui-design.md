# Memo r3-redesign UI Design

> 이 문서는 tdd-green-frontend의 시각적 명세 참조 기준이다.
> 코드를 작성하지 않는다.

## 와이어프레임

### MemoScreen (재설계 후)

```
┌─ PanelShell ──────────────────────┐
│ ⓒ 메모                    ● ○ ○ ⌄ │  ← step "2 / 3"
├────────────────────────────────────┤
│                                    │
│   [ 정답 ]                        │  ← ResultBadge (success 채움, 기존 중립 Badge 대체)
│                                    │
│   메모                            │  ← 정답: 접힘("메모 추가하기") / 오답·보류: 자동 노출
│   ┌────────────────────────┐      │
│   │                        │      │
│   └────────────────────────┘      │
│                                    │
├────────────────────────────────────┤
│   [   뒤로   ]  [   다음   ]       │
└────────────────────────────────────┘
```

정답=success(초록) / 오답=destructive(빨강, #66에서 이미 대비 수정) /
보류=warning(amber) — `ResultToggleGroup`·`ResultSelectScreen`과 동일한 배색 언어.

---

## 컴포넌트 트리

```
MemoScreen
├── PanelShell               → CUSTOM (R0, 변경 없음)
│   ├── header: title="메모", step="2 / 3"
│   ├── body
│   │   ├── ResultBadge      → CUSTOM (기존 컴포넌트 재사용, 신규 아님)
│   │   │     result={result}
│   │   └── MemoField        → CUSTOM (기존, 변경 없음 — 정답 접힘/오답·보류 자동노출)
│   └── footer
│       ├── Button "뒤로"    → shadcn Button (기존)
│       └── Button "다음"    → shadcn Button (기존)
```

`Badge variant="secondary"` 자리를 `ResultBadge`로 교체하는 것이 유일한 구조 변경.

---

## UI State

| 컴포넌트 | 상태 | 트리거 | 표현 방식 |
|---------|------|--------|----------|
| ResultBadge | CORRECT | 화면 진입 시 result=CORRECT | success 채움 배경 + "정답" |
| ResultBadge | WRONG | 화면 진입 시 result=WRONG | destructive 채움 배경 + "오답" |
| ResultBadge | HOLD | 화면 진입 시 result=HOLD | warning 채움 배경 + "보류" |
| MemoField | (변경 없음) | — | 정답=접힘("메모 추가하기"), 오답·보류=Textarea 자동 노출 (기존 동작 유지) |

부모(App.tsx) 상태 영향: 없음 — `result`는 이미 App.tsx가 소유, 이번 라운드는 표현만 바꾼다.

---

## shadcn/ui 사용 컴포넌트

이번 라운드에서 새로 추가되는 shadcn/ui 컴포넌트는 없다 — `ResultBadge`는 R2 이전부터
존재하던 CUSTOM 컴포넌트(`components/codit/result-badge.tsx`)를 재배치만 한다.

---

## Out of Scope (이번 Feature 제외)

- 태그·저장완료 화면 (R4~R5)
- `--destructive`(#66 완료)·`--warning`(문제없음) 토큰 — 이번엔 `--success`만
- `MemoField`의 접힘/자동노출 로직 자체 변경 (배지 색만 바꿈)
