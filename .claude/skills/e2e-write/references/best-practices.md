# Playwright E2E Best Practices

## 셀렉터 우선순위

사용자에게 보이는 의미 기반 셀렉터를 우선한다. 우선순위:

1. `page.getByRole('button', { name: '저장' })` — 역할 + 이름
2. `page.getByLabel('태그 입력')` — 레이블
3. `page.getByText('react')` — 텍스트
4. `page.getByPlaceholder('검색어를 입력하세요')` — placeholder

CSS 클래스(`.tag-chip`)나 XPath는 위 방법이 불가능할 때만 사용한다.
`data-testid`는 팀 컨벤션에 따라 사용 여부를 결정한다.

---

## 대기(Wait) 패턴

`page.waitForTimeout()` 사용 금지. 대신:

```typescript
// UI 변화 기다리기
await expect(page.getByRole('listitem')).toHaveCount(1);
await expect(page.getByRole('button', { name: '저장' })).toBeEnabled();
await expect(page.getByRole('textbox')).toBeDisabled();

// API 응답과 클릭을 동시에
await Promise.all([
  page.waitForResponse(
    res =>
      res.url().includes('/api/resource') &&
      ['POST', 'PATCH'].includes(res.request().method()) &&
      res.ok(),
  ),
  page.getByRole('button', { name: '저장' }).click(),
]);

// 페이지 전환 후 네트워크 안정화 기다리기
await page.waitForLoadState('networkidle');
```

---

## 테스트 독립성

각 테스트는 독립적으로 실행 가능해야 한다.

- `beforeEach`에서 필요한 초기 상태를 직접 만든다
- 다른 테스트의 결과나 실행 순서에 의존하지 않는다
- 테스트가 외부 데이터(DB, 파일 등)를 변경했다면 반드시 정리한다

---

## 데이터 정리 패턴

테스트가 공유 데이터 저장소(DB, 파일 등)를 변경한다면, 다른 테스트에 영향을 주지 않도록 정리해야 한다.

**정리 전략은 프로젝트 환경에 따라 선택한다:**

### 전략 A — API로 직접 삭제 (실제 서버 사용 시)

테스트 데이터를 식별할 수 있는 고유 접두사나 필드를 사용한다.

```typescript
test.afterEach(async ({ request }) => {
  const res = await request.get(`${BASE_URL}/items`);
  const items = await res.json();
  for (const item of items) {
    if (item.name.startsWith('[e2e-test]')) {
      await request.delete(`${BASE_URL}/items/${item.id}`);
    }
  }
});
```

`BASE_URL`은 `playwright.config.ts`의 `baseURL`이나 프로젝트의 API 엔드포인트에 맞춰 결정한다.

### 전략 B — 직렬 실행으로 격리 (`mode: 'serial'`)

DB를 공유하는 테스트들이 병렬로 실행되면 정리 타이밍이 충돌할 수 있다.
`fullyParallel: true` 환경에서 데이터 경합이 발생한다면 직렬로 전환한다.

```typescript
test.describe.configure({ mode: 'serial' });
```

### 전략 C — 테스트 전용 환경 (DB seed/reset)

프로젝트에 테스트 초기화 스크립트가 있다면 `beforeAll`에서 호출한다.

```typescript
test.beforeAll(async ({ request }) => {
  await request.post(`${BASE_URL}/test/reset`);
});
```

---

## 파일 구조 템플릿

```typescript
import { test, expect } from '@playwright/test';

test.describe('{기능명}', () => {
  // 데이터 경합이 있으면 serial 모드 사용
  // test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 공통 초기 상태 준비
  });

  test.afterEach(async ({ request }) => {
    // 테스트 데이터 정리 (프로젝트 환경에 맞는 전략 선택)
  });

  test('{시나리오 설명}', async ({ page }) => {
    // Arrange
    // Act
    // Assert
  });
});
```

---

## 단위 테스트와의 경계

| E2E가 다루는 것 | 단위 테스트가 다루는 것 (중복 금지) |
|---|---|
| 전체 사용자 흐름 (여러 컴포넌트 가로지름) | 개별 컴포넌트 렌더링 조건 |
| API 저장 후 데이터 영속성 | 함수/훅의 유효성 검사 로직 |
| 키보드 인터랙션 (브라우저 수준) | 이벤트 핸들러 호출 여부 |
| 컴포넌트 간 통합 흐름 | 상태 초기값·파생값 계산 |
