# Issue 77: [UI-L2 R5] 저장 완료 화면 재설계 — SaveSuccessScreen

## 시그니처

### 프론트엔드 (TypeScript)

**[확정] `SaveSuccessScreen` Props — 변경 없음**

**근거**: 이슈 AC "props 시그니처 불변". prd.md 결정 안 B-1 = 요약 `<dl>` "결과" 행의
**값 표현만** 교체(텍스트 → `ResultBadge`). 새 prop·삭제 prop 없음.

```ts
interface SaveSuccessScreenProps {
    result: ResultType;          // 'CORRECT' | 'WRONG' | 'HOLD'  (screens.ts)
    elapsedSeconds: number;
    memo: string;
    tags: Tag[];                  // mockData.Tag = { id: string; name: string }
    onCollapse?: () => void;
    collapseControlRef?: Ref<HTMLButtonElement>;
    dragHandlers?: WidgetDragHandlers;
}
```

**[확정] 내부 구조 변경 (구현 상세, 시그니처 아님)**

`<dd className="font-medium">{RESULT_LABELS[result]}</dd>`
→ `<dd className="...">{<ResultBadge result={result} className="w-fit" />}</dd>`

- `ResultBadge`는 기존 CUSTOM 컴포넌트(`components/codit/result-badge.tsx`) 재사용 — 신규 없음
- 정답=`bg-success` / 오답=`bg-destructive` / 보류=`bg-warning` (R2·R3·R4와 동일)
- "결과" `<dt>` 라벨, 풀이 시간·태그·메모 행, 헤더 블록(체크 원 + "저장되었어요")은 불변

### 에러 케이스

없음 — 순수 표현 컴포넌트. 비동기·사용자 입력·검증 로직 없음. `result`는 타입상
3개 값으로 한정되고 `RESULT_LABELS`/`ResultBadge` 모두 전수 매핑을 가진다.

**결정 포인트**: 없음 — 모두 확정됨 (prd.md 스파이크에서 안 B-1 확정).

---

## 테스트 시나리오

> 신규 파일 `apps/extension/entrypoints/content/screens/SaveSuccessScreen.test.tsx`.
> `describe` 영어 / `it` 한국어 현재형 (PR #10 컨벤션). 배지 클래스 단언은 `getByText`로
> 잡은 노드가 Badge 루트(`data-slot="badge"`)인지 함께 확인 (PR #72·#75 리뷰 반영).

### 정상

- [정상] SaveSuccessScreen — result=CORRECT일 때 success 톤 배지로 "정답"을 렌더한다
- [정상] SaveSuccessScreen — result=WRONG일 때 destructive 톤 배지로 "오답"을 렌더한다
- [정상] SaveSuccessScreen — result=HOLD일 때 warning 톤 배지로 "보류"를 렌더한다
- [정상] SaveSuccessScreen — "결과" 요약 라벨(dt)을 유지한다
- [정상] SaveSuccessScreen — 풀이 시간 값을 formatDuration 형식으로 렌더한다
- [정상] SaveSuccessScreen — 선택한 태그 이름을 쉼표로 이어 렌더한다
- [정상] SaveSuccessScreen — 입력한 메모를 렌더한다
- [정상] SaveSuccessScreen — "저장되었어요" 확인 헤더를 렌더한다

### 경계

- [경계] SaveSuccessScreen — tags가 빈 배열이면 태그 값으로 "없음"을 렌더한다
- [경계] SaveSuccessScreen — memo가 공백뿐이면 메모 값으로 "없음"을 렌더한다

### 예외 (회귀 가드)

- [회귀] SaveSuccessScreen — 결과 라벨이 Badge 루트(`data-slot="badge"`) 안에 렌더된다 — 텍스트 노드로 되돌아가면(안 B-1 회귀) 깨진다

---

## AC 커버리지

| AC | 커버 시나리오 |
| --- | --- |
| props 시그니처 불변 | 시그니처 [확정] 섹션 + 모든 렌더 시나리오가 현행 props로 렌더 (ac-verifier가 구조 확인) |
| "결과" 값이 ResultBadge로 렌더, R2·R3·R4와 일관 | [정상] CORRECT/WRONG/HOLD 배지 톤 3건 + [회귀] data-slot |
| "결과" 외 요약 행·헤더 블록 회귀 없음 | [정상] "결과" 라벨 / 풀이 시간 / 태그 / 메모 / "저장되었어요" 헤더 |
| 태그 없음 / 메모 없음 "없음" 유지 | [경계] 2건 |
| typecheck·lint·test·build·storybook green | tdd-green + security-review 단계에서 전수 실행 |
| 스크린샷 전/후 + 개발자 승인 | create-pr 단계 |
