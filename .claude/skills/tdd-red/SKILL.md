---
name: tdd-red
description: >
  승인된 테스트 시나리오를 실패하는 테스트 코드(TDD Red 단계)로 변환하는 스킬.
  "/tdd-red N", "테스트 코드 작성해줘", "Red 단계 진행", "실패 테스트 작성",
  "시나리오를 테스트로 바꿔줘", "TDD 시작", "테스트 먼저 써줘" 등의 요청에
  반드시 이 스킬을 사용하세요. 이슈 번호를 받아 issue-{N}.md의 시나리오를
  Vitest 테스트 코드로 작성하고, 각 테스트가 실패하는지 즉시 확인합니다.
---

# TDD Red

`docs/features/{feature명}/issue-{N}.md`의 승인된 시나리오를 **실패하는 테스트 코드**로 변환한다.
TDD Red 단계 — 테스트는 반드시 **AssertionError**로 실패해야 한다.

> **템플릿 안내**: `{feature명}`은 실제 기능 폴더명으로 치환한다. 아래 "테스트 환경"과 "테스트 파일 매핑" 섹션은 이 프로젝트의 실제 테스트 프레임워크·디렉터리 구조에 맞게 한 번 고쳐두면, 이후엔 그대로 재사용할 수 있다.

```
issue-{N}.md (시그니처 + 시나리오)
    ↓ 시나리오 → 파일별로 묶기
    ↓ 스텁 파일 생성 (시그니처만, 구현 없음)
    ↓ it 블록 작성 → 즉시 실행 → AssertionError 확인
    ↓ 다음 시나리오
테스트 파일들 (전부 AssertionError 실패 상태)
```

---

## 시작 전: 입력 확인

- **이슈 번호**: `$ARGUMENTS`에서 추출.
- **시나리오 파일**: `docs/features/{feature명}/issue-{N}.md`를 읽는다.
  - 없으면: "`issue-{N}.md`가 없습니다. `/test-scenarios {N}`을 먼저 실행해주세요." 안내 후 중단.
- **시그니처 섹션**: 같은 파일 상단의 시그니처에서 import 경로, 타입, 반환 모양을 파악한다.

---

## 테스트 환경

- **프레임워크**: Vitest (globals: true — `describe`, `it`, `expect`, `vi` import 불필요)
- **렌더링**: `@testing-library/react`
- **DOM**: jsdom (`@testing-library/jest-dom` 매처 전역 등록됨)
- **설정 파일**: `src/test-setup.ts`

---

## 테스트 파일 매핑

시나리오의 대상(함수명/컴포넌트명)을 보고 테스트 파일과 스텁 파일을 결정한다.
시그니처에 파일 경로가 명시된 경우 그것을 우선한다.

일반 규칙: `{대상명}` → 테스트 파일 `{경로}/{대상명}.test.ts(x)`, 스텁 파일 `{경로}/{대상명}.ts(x)`.
기존 파일을 수정해야 하는 경우(신규 파일이 아니라 기존 컴포넌트에 필드/prop을 추가하는 경우)는 새 시그니처만 추가하고 로직은 비워둔다.

아래는 예시일 뿐이며, 실제 이슈의 시나리오 대상명으로 대체한다:

| 시나리오 대상 (예시)                  | 테스트 파일 (예시)                    | 스텁 파일 (예시)               |
| -------------------------------------- | -------------------------------------- | -------------------------------- |
| `useItemEditor` / `addItem` / `removeItem` | `src/hooks/useItemEditor.test.ts`      | `src/hooks/useItemEditor.ts`     |
| `ItemInput`                            | `src/components/ItemInput.test.tsx`    | `src/components/ItemInput.tsx`   |
| 기존 컴포넌트 수정 (예: `ItemEditor`)  | `src/components/ItemEditor.test.tsx`   | 기존 파일 수정                    |
| 타입 확장                              | 타입은 스텁 불필요 — 타입 파일에 직접 필드 추가 | `src/types/*.ts`         |

---

## 스텁 파일 패턴

테스트가 import에 성공하되 동작은 하지 않는 껍데기. 시그니처의 모양만 갖추고 로직은 비운다.

### 훅 스텁

```typescript
// src/hooks/useItemEditor.ts
export function useItemEditor(_initialItems: string[]) {
  return {
    items: [] as string[],
    inputValue: '',
    setInputValue: (_: string) => {},
    addItem: (_: string) => {},
    removeItem: (_: number) => {},
  };
}
```

### 컴포넌트 스텁

```typescript
// src/components/ItemInput.tsx
interface ItemInputProps {
  items: string[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onAdd: (value: string) => void;
}

export default function ItemInput(_props: ItemInputProps) {
  return null;
}
```

### 기존 파일 수정이 필요한 경우

이미 파일이 존재하는 경우, 새 시그니처(예: 새 prop, 새 훅 호출)를 추가하되 실제 동작 없이 타입만 맞춘다.

---

## 테스트 코드 패턴

### 훅 테스트

```typescript
import { renderHook, act } from '@testing-library/react';
import { useItemEditor } from './useItemEditor';

describe('useItemEditor', () => {
  it('should return initialItems as items when initialized with existing items', () => {
    const { result } = renderHook(() => useItemEditor(['sample']));
    expect(result.current.items).toEqual(['sample']);
  });

  it('should clear inputValue after item is successfully added', () => {
    const { result } = renderHook(() => useItemEditor([]));
    act(() => {
      result.current.setInputValue('sample');
    });
    expect(result.current.inputValue).toBe('sample');
    act(() => {
      result.current.addItem('sample');
    });
    expect(result.current.inputValue).toBe('');
  });
});
```

### 컴포넌트 테스트

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ItemInput from './ItemInput'

describe('ItemInput', () => {
  it('should render each item as a chip element when items prop is given', () => {
    render(
      <ItemInput
        items={['sample', 'demo']}
        inputValue=""
        onInputChange={vi.fn()}
        onAdd={vi.fn()}
      />
    )
    expect(screen.getByText('sample')).toBeInTheDocument()
    expect(screen.getByText('demo')).toBeInTheDocument()
  })

  it('should call onAdd with current inputValue when Enter key is pressed', async () => {
    const onAdd = vi.fn()
    const user = userEvent.setup()
    render(
      <ItemInput
        items={[]}
        inputValue="sample"
        onInputChange={vi.fn()}
        onAdd={onAdd}
      />
    )
    await user.keyboard('{Enter}')
    expect(onAdd).toHaveBeenCalledWith('sample')
  })
})
```

### Context를 소비하는 컴포넌트 테스트

전역 상태(Context/Store)를 내부에서 호출하는 컴포넌트는 그 상태를 mock한다.

```typescript
import * as SomeContext from '../../context/SomeContext';

vi.mock('../../context/SomeContext', () => ({
  useSomeContext: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(SomeContext.useSomeContext).mockReturnValue({
    items: [],
    loading: false,
    error: null,
    // 이 프로젝트의 실제 Context 액션으로 대체
  });
});
```

---

## 테스트 작성 주의사항

### 상태 변경이 여러 단계일 때는 act()를 분리한다

스텁의 함수는 no-op이다. 여러 상태 변경 호출을 하나의 `act()` 안에 묶으면, 앞 단계가 no-op이어도 최종 상태만 검증하게 되어 우연히 통과할 수 있다.

**잘못된 패턴 — false pass 위험 (1): 여러 상태 변경을 하나의 act()에 묶기**

```typescript
act(() => {
  result.current.setInputValue('sample'); // 스텁: no-op → inputValue 여전히 ''
  result.current.addItem('sample'); // 스텁: no-op
});
expect(result.current.inputValue).toBe(''); // '' === '' → 우연히 통과
```

**올바른 패턴 — 단계별 검증:**

```typescript
act(() => {
  result.current.setInputValue('sample');
});
expect(result.current.inputValue).toBe('sample'); // 스텁에서 실패 → 진짜 Red
act(() => {
  result.current.addItem('sample');
});
expect(result.current.inputValue).toBe('');
```

각 `act()` 직후에 중간 상태를 검증하면, 스텁에서 no-op인 함수가 있을 때 그 단계에서 즉시 실패한다.

**잘못된 패턴 — false pass 위험 (2): before 상태가 기대값과 같을 때**

```typescript
// "아무것도 안 했다"와 "기존 데이터를 전부 날렸다"가 결과가 같아서 구분 불가
const { result } = renderHook(() => useItemEditor([])); // 시작부터 []
act(() => {
  result.current.addItem('');
});
expect(result.current.items).toEqual([]); // 스텁도 [] → 우연히 통과
```

**올바른 패턴 — 의미 있는 before 상태:**

```typescript
const { result } = renderHook(() => useItemEditor(['sample'])); // 데이터 있는 상태에서 시작
act(() => {
  result.current.addItem('');
});
expect(result.current.items).toEqual(['sample']); // 스텁은 [] → 실패 → 진짜 Red
```

"unchanged"를 검증할 때는 before 상태에 반드시 값이 있어야 "바뀌지 않았음"을 증명할 수 있다.

---

## 실행 순서

### 1단계: 시나리오를 파일별로 묶기

issue-{N}.md의 시나리오를 읽어 테스트 파일 단위로 그룹화한다.
한 파일을 완성한 뒤 다음 파일로 이동한다.

### 2단계: 파일별 스텁 생성 + 테스트 작성 + 실패 확인

파일 하나를 처리할 때:

1. **스텁 파일이 없으면 먼저 생성한다.** 시그니처 모양만 갖추고 로직은 비운다.
2. 테스트 파일이 없으면 import와 describe 뼈대를 작성한다.
3. 시나리오 하나를 `it` 블록으로 추가한다.
4. 저장 후 즉시 실행한다:
   ```bash
   npx vitest run {테스트파일경로}
   ```
5. **AssertionError**로 실패하는지 확인한다. 실패를 확인한 뒤 다음 시나리오를 추가한다.

**실패가 아닌 경우:**

- **ImportError** → 스텁 파일이 누락된 것. 먼저 스텁을 만들고 재실행한다.
- **pass** → 해당 기능이 이미 구현되어 있는 것. 사용자에게 알리고 다음 시나리오로 이동.
- **syntax 에러** → 테스트 코드 문제이므로 수정 후 재실행.

### 3단계: 전체 실행

모든 파일 완료 후 전체 테스트를 실행한다:

```bash
npm test
```

결과를 아래 형식으로 요약한다:

```
테스트 파일                실패 수   실패 유형
─────────────────────────────────────────
useItemEditor.test.ts       8개     AssertionError
ItemInput.test.tsx          5개     AssertionError
ItemEditor.test.tsx         6개     AssertionError
```

---

## 제약

- **스텁 파일(빈 껍데기)은 생성/수정 가능하다.** 스텁에 실제 로직을 넣는 것은 Green 단계이므로 금지.
- **테스트 파일은 자유롭게 생성/수정한다.**
- `it.skip` / `it.todo` 사용 금지 — 모든 `it` 블록은 실제 실행되어 **AssertionError**로 실패해야 한다.
- ImportError가 발생하면 Red 미완성 — 스텁을 먼저 만들고 반드시 AssertionError 상태로 전환한다.
