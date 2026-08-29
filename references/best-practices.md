# Playwright Best Practices — Codit (Chrome Extension)

## 셀렉터

역할/텍스트 기반으로 쓴다. CSS 클래스는 쓰지 않는다.

```typescript
// Good
page.getByRole('button', { name: /저장/i })
page.getByRole('textbox', { name: /태그/i })
page.getByText('완료')

// Bad
page.locator('.btn-save')
page.locator('#tag-input')
```

## 대기

`waitForTimeout` 금지. 상태 변화를 기다릴 때는 `expect`의 자동 재시도를 이용한다.

```typescript
// Good
await expect(page.getByText('저장됨')).toBeVisible()

// Bad
await page.waitForTimeout(1000)
```

## 단위 테스트와의 경계

| E2E에서 다루는 것 | E2E에서 다루지 않는 것 |
|---|---|
| 여러 계층이 함께 동작하는 흐름 | 단위 테스트가 이미 검증한 로직 |
| 데이터 저장 후 실제 영속성 확인 | 컴포넌트 내부 상태 변화 |
| 사용자가 UI에서 경험하는 핵심 경로 | Out of Scope 항목 |

## Chrome Extension 전용

- `headless: false` 필수 — 익스텐션은 headful 모드에서만 동작한다
- 익스텐션 ID는 하드코딩 금지 — service worker URL에서 동적으로 추출한다
- `chrome.storage` 초기화는 `beforeEach`에서 처리해 테스트 간 간섭을 막는다

## 데이터 정리

각 테스트는 독립적으로 실행 가능해야 한다. `afterEach`에서 테스트 데이터를 정리한다.
백엔드 데이터가 있으면 고유 접두사(예: `e2e-`)로 구분하고 해당 데이터만 삭제한다.
