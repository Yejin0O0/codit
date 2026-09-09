# Issue 71: [UI-L2 R3] 메모 화면 재설계 — MemoScreen · MemoField

## 시그니처

### 프론트엔드 (TypeScript)

`MemoScreen.tsx` — 결과 배지를 `ResultBadge`로 교체 (props 시그니처 불변):
```tsx
// Before: <Badge variant="secondary" className="w-fit">{RESULT_LABELS[result]}</Badge>
// After:
<ResultBadge result={result} className="w-fit" />
```
`Badge`/`RESULT_LABELS` import 제거, `ResultBadge` import 추가.

`tokens.css` — `--success` 값 조정:
```css
/* Before */ --success: oklch(0.6406 0.1329 157.68); /* #30A46C green-9 */
/* After  */ --success: oklch(0.53 0.1329 157.68); /* #00824C, 흰 텍스트와 4.90:1 */
```

### 에러 케이스

없음 — 순수 표현 변경, 비동기/실패 경로 없음.

---

## 테스트 시나리오

### 정상

- [정상] MemoScreen — result=CORRECT일 때 success 톤 배지(`bg-success`)로 "정답"을 렌더한다
- [정상] MemoScreen — result=WRONG일 때 destructive 톤 배지(`bg-destructive`)로 "오답"을 렌더한다
- [정상] MemoScreen — result=HOLD일 때 warning 톤 배지(`bg-warning`)로 "보류"를 렌더한다

### 경계

- [경계] MemoScreen — 더 이상 중립 배지(`bg-secondary`)를 렌더하지 않는다 (마이그레이션 회귀 가드)

### 예외

- 없음 — 순수 표현 변경, 실패 경로 없음

---

## AC 커버리지

| AC | 커버 시나리오 |
|---|---|
| `MemoScreen` props 시그니처 불변 | 전체 시나리오가 기존 props로만 렌더 — 구조적으로 커버 |
| 결과 배지가 `ResultBadge`로 렌더(정답=success/오답=destructive/보류=warning) | [정상] 3건 |
| `--success` 토큰이 흰 텍스트와 4.5:1 이상 | Green 단계에서 토큰 값 적용 + Storybook a11y로 검증 (유닛 테스트 범위 아님) |
| `ResultBadge`·`ResultToggleGroup` CORRECT 상태 a11y 위반 없음 | Storybook a11y 수동 검증 (Green 이후) |
| `MemoField` 동작 회귀 없음 | 기존 App.test.tsx 통합 테스트가 이미 커버 (변경 없음) |
| typecheck·lint·test·build·storybook green | Green 단계 별도 검증 |
