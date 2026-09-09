# Issue 74: [UI-L2 R4] 태그 선택 화면 재설계 — TagSelectScreen · TagPicker

## 시그니처

### 프론트엔드 (TypeScript)

`TagSelectScreen.tsx` — `result` prop 신규 추가 + `ResultBadge` 렌더:
```tsx
interface TagSelectScreenProps {
    result: ResultType;   // 신규 — 기존 prop은 전부 유지
    step: string;
    coreTags: Tag[];
    categories: TagCategory[];
    customTags: Tag[];
    selectedTagIds: string[];
    onSelectedTagIdsChange: (ids: string[]) => void;
    onAddCustomTag: (name: string) => void;
    onBack: () => void;
    onSave: () => void;
    onCollapse?: () => void;
    collapseControlRef?: Ref<HTMLButtonElement>;
    dragHandlers?: WidgetDragHandlers;
}
// body 최상단에 <ResultBadge result={result} className="w-fit" /> 추가
```

`App.tsx` — `<TagSelectScreen>` 호출부에 `result={result}` 전달 추가.

`TagPicker.tsx` — "추가" 버튼 variant 변경:
```tsx
// Before: <Button type="button" size="sm" variant="secondary" onClick={submitDraft}>
// After:
<Button type="button" size="sm" variant="default" onClick={submitDraft}>
```

### 에러 케이스

없음 — 순수 표현 변경, 비동기/실패 경로 없음.

---

## 테스트 시나리오

### 정상

- [정상] TagSelectScreen — result=CORRECT일 때 success 톤 배지로 "정답"을 렌더한다
- [정상] TagSelectScreen — result=WRONG일 때 destructive 톤 배지로 "오답"을 렌더한다
- [정상] TagSelectScreen — result=HOLD일 때 warning 톤 배지로 "보류"를 렌더한다
- [정상] TagSelectScreen — "추가" 버튼이 렌더된다 (TagPicker 통합 확인)

### 경계

- 없음 (MemoScreen R3와 달리 "중립 배지였다가 색이 생긴" 회귀 가드는 불필요 — 원래 배지 자체가 없었음)

### 예외

- 없음

---

## AC 커버리지

| AC | 커버 시나리오 |
|---|---|
| `result` prop 신규 추가, 기존 prop 유지 | 전체 시나리오가 기존 props + result로만 렌더 — 구조적으로 커버 |
| `App.tsx` 호출부가 result 전달 | Green 단계에서 반영, App.test.tsx 기존 통합 테스트로 회귀 확인 |
| `ResultBadge` 렌더 + R2·R3와 톤 일관 | [정상] 3건 |
| "추가" 버튼 `variant="default"` | Green 단계에서 시각 확인 (Storybook) — 클래스 단언은 버튼 텍스트 렌더로 대체 |
| `TagPicker` 동작 회귀 없음 | 기존 App.test.tsx 태그 관련 테스트가 이미 커버 (변경 없음) |
| typecheck·lint·test·build·storybook green | Green 단계 별도 검증 |
