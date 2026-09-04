# Issue 26: [e2e-infra] Playwright 확장 로드 인프라 + 헤더 드래그 위치 영속 검증

## 시그니처

### 프론트엔드 (TypeScript, E2E — Playwright)

```ts
// e2e/fixtures/extension.ts
import { test as base, chromium, type BrowserContext } from '@playwright/test';

export const test: ReturnType<typeof base.extend<{ context: BrowserContext }>>;
export const expect: typeof base.expect;
```

- `context` fixture: `chromium.launchPersistentContext('', { headless: false, args: [
  '--disable-extensions-except=<EXTENSION_PATH>', '--load-extension=<EXTENSION_PATH>' ] })`.
  빈 문자열 `userDataDir` → Playwright가 임시 프로필 생성, `context.close()` 시 자동 정리.
- fixture 내부에서 `context.route('https://swexpertacademy.com/**', route =>
  route.fulfill({ path: MOCK_HTML_PATH, contentType: 'text/html' }))` 등록 후 `use(context)`.
- `extensionId` fixture는 이번 이슈 스코프에서 **제외**(YAGNI — content script는
  manifest match만으로 자동 주입되어 필요 없음).

```ts
// e2e/fixtures/drag.ts
import type { Locator } from '@playwright/test';

/** locator 를 pointer down → move → up 시퀀스로 dx, dy 만큼 드래그한다. */
export async function dragBy(locator: Locator, dx: number, dy: number): Promise<void>;
```

```ts
// e2e/fixtures/widget.ts
import type { Page } from '@playwright/test';

/** #codit-root 의 visibility 가 hidden 이 아닐 때까지 기다린 뒤 top/left(px, number)를 반환한다. */
export async function getWidgetPosition(page: Page): Promise<{ top: number; left: number }>;
```

```ts
// e2e/widget-drag-move.spec.ts
import { test, expect } from './fixtures/extension';
import { dragBy } from './fixtures/drag';
import { getWidgetPosition } from './fixtures/widget';
```

- `page.goto('https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=E2E-TEST-001')`
- 헤더 접근: `page.getByText('풀이 타이머').locator('..')` (기존 코드베이스가
  `data-testid` 대신 텍스트/role 쿼리를 쓰는 관례와 일치)
- `e2e/fixtures/mock-problem.html`: `<html><body></body></html>` 수준의 최소 정적
  페이지 (`parseContestProbId`는 URL만 읽으므로 DOM 내용 무관)

### 에러 케이스

이번 이슈 범위 밖 (정상 플로우 인프라 구축). storage 실패 fail-soft 등은
`prd.md` Out of Scope.

### 결정 사항

- headless: `false` (로컬 전용, 신뢰성 우선)
- `extensionId` fixture: 제외 (YAGNI)

---

## 테스트 시나리오

### 정상

- `[정상] 확장 로드` — mock 문제 페이지(`?contestProbId=`)에 접속하면 Codit 위젯(헤더 "풀이 타이머")이 뜬다
- `[정상] 헤더 드래그` — 헤더를 드래그하면 위젯이 이동한 만큼 위치(top/left)가 갱신된다
- `[정상] 새로고침 복원` — 드래그 후 새로고침하면 옮긴 위치 그대로 위젯이 다시 뜬다

### 경계

- `[경계] 테스트 격리` — 서로 다른 `test()` 실행(각자 새 persistent context)은 이전 실행에서 옮긴 위치를 공유하지 않는다 — 매번 Default position에서 시작한다

### 예외

- `[예외] 라우팅 스코프` — `swexpertacademy.com` 외 페이지(`about:blank`)에서는 mock 라우팅이 적용되지 않고 위젯도 뜨지 않는다 — `context.route()`가 의도한 도메인에만 좁혀졌는지 검증 (인프라 자체의 정확성 확인이지, 문제 식별 실패 로직 테스트가 아님 — 그건 prd.md Out of Scope)

> storage 실패 fail-soft, 문제 식별 실패 등은 `prd.md` Out of Scope로 이미 확정되어 이번 이슈 예외 시나리오에서 제외했다.

---

## AC 커버리지

| AC | 커버 시나리오 |
|---|---|
| 확장 로드 + 위젯 표시 | `[정상] 확장 로드` |
| 헤더 드래그로 위치 이동 | `[정상] 헤더 드래그` |
| 새로고침 후 위치 복원 | `[정상] 새로고침 복원` |
| 시스템 흔적 없음(temp userDataDir, hosts 미변경) | `[경계] 테스트 격리`(temp dir 매번 새로 생성 간접 검증) + hosts 파일은 애초에 안 건드리는 설계(ADR-2, route 방식)로 충족 — 별도 런타임 assertion 불필요 |
