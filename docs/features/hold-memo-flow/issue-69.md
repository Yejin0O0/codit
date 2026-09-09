# Issue 69: [결과 기록] 보류(HOLD) 선택 시에도 메모 화면 진입 — 보류 이유 기록

## 시그니처

### 프론트엔드 (TypeScript)

`App.tsx`:
```ts
// 삭제: function hasMemoStep(result: ResultType | null): boolean { ... }

// tagStep — 상수로 고정 (분기 제거)
const TAG_STEP = '3 / 3';

// handleNextFromResult — else 분기 제거, 항상 메모로
const handleNextFromResult = () => {
    if (result === null) return;
    setScreen('memo');
};

// memo 화면 렌더 가드 — hasMemoStep(result) 조건 제거
if (screen === 'memo' && result !== null) { ... }

// 태그 화면 onBack — 삼항 제거, 항상 메모로
onBack={() => setScreen('memo')}
```

`MemoField.tsx`:
```ts
const PLACEHOLDER: Record<'WRONG' | 'HOLD', string> = {
    WRONG: '풀이 접근, 막힌 지점, 다시 볼 점을 적어두세요.',
    HOLD: '보류한 이유를 적어두세요.',
};
// result === 'HOLD' → null 반환하던 분기 삭제
// "기본 노출" 조건을 result === 'WRONG' || result === 'HOLD' 로 확장
// textarea placeholder = PLACEHOLDER[result] (WRONG/HOLD), CORRECT는 기존 공용 PLACEHOLDER 유지
```

`MemoScreen.tsx`: props 시그니처 불변, JSDoc("HOLD 는 이 화면에 진입하지 않는다")만 갱신.

### 에러 케이스

없음 — 순수 상태 전이/조건 분기 변경.

---

## 테스트 시나리오

### 정상

- [정상] App — 보류 선택 후 "다음" 클릭 시 메모 화면으로 이동한다 (기존: 태그 화면 직행)
- [정상] App — 보류의 메모 화면은 Textarea가 기본 노출되고 placeholder가 "보류한 이유를 적어두세요."이다
- [정상] App — 보류의 메모 화면에서 "다음" 클릭 시 태그 화면으로 이동한다
- [정상] App — 보류의 메모 화면에서 "뒤로" 클릭 시 결과 선택 화면으로 이동한다
- [정상] App — 보류 경로에서 태그 화면 "뒤로" 클릭 시 메모 화면으로 돌아간다 (기존: 결과 화면 직행 — 대칭적으로 바뀜)
- [정상] App — 보류 경로에서도 태그 화면 step은 "3 / 3"으로 표시된다 (기존: "2 / 2")

### 경계

- [경계] App — 정답/오답의 메모 화면 흐름·step("2 / 3")은 기존과 동일하다 (회귀 가드, 기존 테스트 유지로 커버)

### 예외

- 없음 — 순수 화면 전이 변경, 실패/에러 경로 없음

---

## AC 커버리지

| AC | 커버 시나리오 |
|---|---|
| 보류 선택 후 "다음" → 메모 화면 | [정상] 보류→메모 이동 |
| 메모 화면 Textarea 기본 노출 + placeholder | [정상] placeholder 검증 |
| 정답/오답 메모 동작 회귀 없음 | [경계] 기존 회귀 가드 유지 |
| 메모 화면 뒤로/다음 전환 — 보류도 동일 흐름 | [정상] 뒤로→결과, 다음→태그, 태그뒤로→메모(대칭) |
| 태그 화면 step 모든 결과 "3 / 3" | [정상] step 통일 검증 |
| typecheck·lint·test·build green | Green 단계 별도 검증 |
