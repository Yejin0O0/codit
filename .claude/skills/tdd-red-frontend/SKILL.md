---
name: tdd-red-frontend
description: >
  크롬 익스텐션 프론트엔드(WXT + React)의 승인된 시나리오를 실패하는 Vitest 테스트 코드로 변환하는 스킬.
  "/tdd-red-frontend N" 또는 tdd-red가 프론트엔드 레이어로 위임할 때 사용합니다.
  issue-{N}.md의 시나리오를 Vitest 테스트 코드로 작성하고, 각 테스트가 AssertionError로 실패하는지 확인합니다.
---

# TDD Red — 프론트엔드 (WXT + React)

`docs/features/{feature명}/issue-{N}.md`의 시나리오를 **실패하는 Vitest 테스트 코드**로 변환한다.
테스트는 반드시 **AssertionError**로 실패해야 한다.

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
- **시그니처 섹션**: 파일 상단의 시그니처에서 import 경로, 타입, 반환 모양을 파악한다.

---

## 테스트 환경

- **프레임워크**: Vitest (globals: true — `describe`, `it`, `expect`, `vi` import 불필요)
- **렌더링**: `@testing-library/react`
- **DOM**: jsdom (`@testing-library/jest-dom` 매처 전역 등록됨)
- **Chrome API mock**: `wxt/testing`의 `fakeBrowser` 또는 `vi.mock`

---

## 테스트 파일 매핑

시나리오의 대상(함수명/컴포넌트명)과 시그니처의 파일 경로를 기준으로 결정한다.

| 시나리오 대상 | 테스트 파일 | 스텁 파일 |
|---|---|---|
| 훅 / 유틸 함수 | `apps/extension/entrypoints/{영역}/{대상명}.test.ts` | 동일 경로 `.ts` |
| 컴포넌트 | `apps/extension/entrypoints/{영역}/{대상명}.test.tsx` | 동일 경로 `.tsx` |
| chrome.storage 연동 훅 | 동일 | 동일 (fakeBrowser 사용) |
| 기존 파일 수정 | 기존 테스트 파일에 추가 | 기존 파일에 시그니처만 추가 |

시그니처에 경로가 명시된 경우 그것을 우선한다.

---

## 스텁 파일 패턴

테스트가 import에 성공하되 동작은 하지 않는 껍데기.

### 훅 스텁

```typescript
// apps/extension/entrypoints/popup/useItems.ts
export function useItems() {
  return {
    items: [] as string[],
    addItem: (_: string) => {},
    removeItem: (_: number) => {},
  };
}
```

### 컴포넌트 스텁

```typescript
// apps/extension/entrypoints/popup/ItemList.tsx
interface ItemListProps {
  items: string[];
  onRemove: (index: number) => void;
}

export default function ItemList(_props: ItemListProps) {
  return null;
}
```

### Chrome Storage 연동 훅 스텁

```typescript
// apps/extension/entrypoints/popup/useStoredItems.ts
export function useStoredItems() {
  return {
    items: [] as string[],
    save: async (_: string) => {},
    isLoading: false,
  };
}
```

---

## 테스트 코드 패턴

### 훅 테스트

```typescript
import { renderHook, act } from '@testing-library/react';
import { useItems } from './useItems';

describe('useItems', () => {
  it('should return initialItems as items when initialized with existing items', () => {
    const { result } = renderHook(() => useItems(['sample']));
    expect(result.current.items).toEqual(['sample']);
  });

  it('should clear inputValue after item is added', () => {
    const { result } = renderHook(() => useItems([]));
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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ItemList from './ItemList';

describe('ItemList', () => {
  it('should render each item when items prop is given', () => {
    render(<ItemList items={['sample', 'demo']} onRemove={vi.fn()} />);
    expect(screen.getByText('sample')).toBeInTheDocument();
    expect(screen.getByText('demo')).toBeInTheDocument();
  });

  it('should call onRemove with index when remove button is clicked', async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    render(<ItemList items={['sample']} onRemove={onRemove} />);
    await user.click(screen.getByRole('button', { name: /remove/i }));
    expect(onRemove).toHaveBeenCalledWith(0);
  });
});
```

### Chrome API(storage) 연동 테스트

`fakeBrowser`를 사용해 실제 chrome API 없이 테스트한다.

```typescript
import { fakeBrowser } from 'wxt/testing';
import { renderHook, act } from '@testing-library/react';
import { useStoredItems } from './useStoredItems';

beforeEach(() => {
  fakeBrowser.reset();
});

describe('useStoredItems', () => {
  it('should load items from storage on mount', async () => {
    await fakeBrowser.storage.local.set({ items: ['stored-item'] });
    const { result } = renderHook(() => useStoredItems());
    await act(async () => {});
    expect(result.current.items).toEqual(['stored-item']);
  });

  it('should persist item to storage when save is called', async () => {
    const { result } = renderHook(() => useStoredItems());
    await act(async () => {
      await result.current.save('new-item');
    });
    const stored = await fakeBrowser.storage.local.get('items');
    expect(stored.items).toContain('new-item');
  });
});
```

### Context를 소비하는 컴포넌트 테스트

```typescript
import * as SomeContext from '../../context/SomeContext';

vi.mock('../../context/SomeContext', () => ({
  useSomeContext: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(SomeContext.useSomeContext).mockReturnValue({
    items: [],
    loading: false,
  });
});
```

---

## 테스트 작성 주의사항

### 상태 변경이 여러 단계일 때는 act()를 분리한다

스텁의 함수는 no-op이다. 여러 상태 변경을 하나의 `act()` 안에 묶으면 우연히 통과할 수 있다.

**잘못된 패턴 — false pass 위험:**

```typescript
act(() => {
  result.current.setInputValue('sample'); // 스텁: no-op → inputValue 여전히 ''
  result.current.addItem('sample');
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

### before 상태가 기대값과 같으면 false pass가 난다

```typescript
// 잘못된 패턴
const { result } = renderHook(() => useItems([])); // 시작부터 []
act(() => { result.current.addItem(''); });
expect(result.current.items).toEqual([]); // 스텁도 [] → 우연히 통과

// 올바른 패턴
const { result } = renderHook(() => useItems(['sample'])); // 값 있는 상태에서 시작
act(() => { result.current.addItem(''); });
expect(result.current.items).toEqual(['sample']); // 스텁은 [] → 실패 → 진짜 Red
```

---

## 실행 순서

### 1단계: 시나리오를 파일별로 묶기

`issue-{N}.md`의 시나리오를 테스트 파일 단위로 그룹화한다.
한 파일을 완성한 뒤 다음 파일로 이동한다.

### 2단계: 파일별 스텁 생성 + 테스트 작성 + 실패 확인

파일 하나를 처리할 때:

1. 스텁 파일이 없으면 먼저 생성한다.
2. 테스트 파일이 없으면 import와 describe 뼈대를 작성한다.
3. 시나리오 하나를 `it` 블록으로 추가한다.
4. 저장 후 즉시 실행한다:
   ```bash
   pnpm --filter @codit/extension exec vitest run {테스트파일경로}
   ```
5. **AssertionError**로 실패하는지 확인한다. 실패를 확인한 뒤 다음 시나리오를 추가한다.

**실패가 아닌 경우:**
- **ImportError** → 스텁 파일 누락. 스텁 먼저 생성 후 재실행.
- **pass** → 이미 구현된 것. 사용자에게 알리고 다음 시나리오로 이동.
- **syntax 에러** → 테스트 코드 수정 후 재실행.

### 3단계: 전체 실행

모든 파일 완료 후:

```bash
pnpm --filter @codit/extension test
```

결과를 아래 형식으로 요약한다:

```
테스트 파일                    실패 수   실패 유형
──────────────────────────────────────────────
useItems.test.ts                 8개     AssertionError
ItemList.test.tsx                5개     AssertionError
```

---

## 제약

- 스텁 파일(빈 껍데기)은 생성/수정 가능하다. 스텁에 실제 로직을 넣는 것은 Green 단계이므로 금지.
- 테스트 파일은 자유롭게 생성/수정한다.
- `it.skip` / `it.todo` 사용 금지 — 모든 `it` 블록은 **AssertionError**로 실패해야 한다.
- ImportError가 발생하면 Red 미완성 — 스텁을 먼저 만들고 반드시 AssertionError 상태로 전환한다.
