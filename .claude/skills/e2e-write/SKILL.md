---
name: e2e-write
description: >
  E2E 테스트 코드를 생성하는 스킬. 사용자가 "e2e 테스트 작성", "플레이라이트 테스트", "e2e 시나리오" 등을
  언급하거나 `/e2e-write {기능명}` 을 호출할 때 반드시 이 스킬을 사용한다.
  docs/features/{기능명}/prd.md의 사용자 스토리를 읽고 E2E 시나리오로 변환해 Playwright 테스트를 작성한다.
  단위 테스트와 중복되지 않도록 기존 테스트 파일을 먼저 확인한다.
---

# e2e-write

`docs/features/{기능명}/prd.md`의 사용자 스토리를 읽어 Playwright E2E 테스트를 작성한다.

코딩 규칙은 `references/best-practices.md`를 읽어 따른다.

```
prd.md (사용자 스토리)
    ↓ 단위 테스트가 이미 다루는 것 제외
    ↓ E2E 시나리오 결정
    ↓ Playwright 코드 작성 (best-practices.md 참고)
{testDir}/{기능명}/{기능명}.spec.ts
```

---

## 시작 전: 입력 확인

- **기능명 또는 이슈번호**: 인자에서 추출한다.
  - 숫자(이슈번호)인 경우: `find docs/features -name "issue-{N}.md"`로 기능 디렉터리를 자동 탐색한다.
  - 기능명인 경우: 그대로 사용한다.
  - 둘 다 없으면 사용자에게 묻는다.
- **prd 파일**: `docs/features/{기능명}/prd.md` — 없으면 중단하고 알린다.
- **best-practices**: `references/best-practices.md`를 읽어 셀렉터·대기·정리 패턴을 파악한다.

---

## 1단계: 컨텍스트 수집

### 1-1. 사용자 스토리 파악

`docs/features/{기능명}/prd.md`에서 추출:

- **사용자 스토리**: 사용자가 무엇을 하고 싶은가 (역할 / 행동 / 목적)
- **Out of Scope**: 이번 릴리스에서 제외된 기능 — E2E 시나리오로 만들지 않는다
- **ADR**: UI 동작에 영향을 주는 기술 결정 (피드백 방식, 제한 조건 등)

### 1-2. 단위 테스트 파악

프로젝트의 단위 테스트 파일(`*.test.ts`, `*.test.tsx`, `*.spec.ts` 등)을 읽는다.
일반적으로 `src/` 하위에 있으나, 프로젝트마다 위치가 다를 수 있으므로 먼저 구조를 파악한다.

단위 테스트가 이미 다루는 항목 목록을 만든다. E2E에서는 이것을 중복하지 않는다.

`best-practices.md`의 "단위 테스트와의 경계" 표를 판단 기준으로 사용한다.

### 1-3. 익스텐션 E2E 환경 파악

`playwright.config.ts`를 읽어 `testDir`과 E2E 실행 명령어를 파악한다.

크롬 익스텐션은 `baseURL` / `webServer` 대신 아래 항목을 확인한다:

**빌드 아웃풋 경로 확인**

WXT 빌드 결과물 위치를 확인한다. 기본값은 `apps/extension/.output/chrome-mv3/`이며,
테스트 실행 전 빌드가 완료되어 있어야 한다:

```bash
pnpm --filter @codit/extension build
```

**Playwright 실행 옵션 (익스텐션 로드)**

익스텐션 E2E는 `chromium.launch`에 아래 옵션이 필요하다. `playwright.config.ts`에
이미 설정되어 있으면 그것을 사용하고, 없으면 fixture에서 직접 설정한다:

```typescript
const extensionPath = path.join(__dirname, '../apps/extension/.output/chrome-mv3');

const context = await chromium.launchPersistentContext('', {
  headless: false, // 익스텐션은 headless: false 필요
  args: [
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`,
  ],
});
```

**익스텐션 ID 획득**

익스텐션 ID는 로드 시마다 동적으로 생성된다. service worker에서 추출한다:

```typescript
let [background] = context.serviceWorkers();
if (!background) {
  background = await context.waitForEvent('serviceworker');
}
const extensionId = background.url().split('/')[2]; // chrome-extension://{id}/...
```

**진입점별 URL 패턴**

| 진입점 | URL 패턴 |
|---|---|
| popup | `chrome-extension://${extensionId}/popup.html` |
| sidepanel | `chrome-extension://${extensionId}/sidepanel.html` |
| content script | 일반 웹 페이지 URL (익스텐션이 주입) |

---

## 2단계: E2E 시나리오 결정

사용자 스토리를 E2E 시나리오로 매핑한다.

**포함**:
- 여러 컴포넌트/계층이 함께 동작해야 성립하는 흐름
- API 저장 후 데이터 영속성이 핵심인 흐름
- 사용자가 UI에서 직접 경험하는 핵심 경로 (Happy Path)

**제외**:
- 단위 테스트에서 이미 검증된 검사 로직
- 불가시적인 내부 상태 변화
- Out of Scope 항목

### 시나리오 형식

```
[흐름] {설명} — {조건}
```

---

## 3단계: Playwright 코드 작성

1단계에서 파악한 `testDir` 하위에 `{기능명}/{기능명}.spec.ts` 파일을 생성한다.

`references/best-practices.md`의 다음 항목을 반드시 따른다:
- 셀렉터 우선순위
- 대기(Wait) 패턴 (`waitForTimeout` 금지)
- 테스트 독립성
- 데이터 정리 패턴

**데이터 정리 전략은 프로젝트마다 다르다.** 작성 전 다음을 확인한다:
- 백엔드가 REST API인가? 테스트 전용 초기화 엔드포인트가 있는가?
- 테스트 격리를 위해 mock/stub을 쓰는가, 실제 서버를 쓰는가?
- 테스트 간 데이터 간섭을 막을 고유 식별자 전략이 있는가?

데이터를 직접 정리하는 경우, 테스트 데이터를 구분할 수 있는 고유 접두사나 필드를 사용하고
`afterEach`에서 해당 데이터만 정리한다.

### 익스텐션 E2E 코드 패턴

#### Popup 테스트

```typescript
import { test, expect, chromium } from '@playwright/test';
import path from 'path';

test.describe('popup — 아이템 저장', () => {
  let extensionId: string;
  let context: BrowserContext;

  test.beforeAll(async () => {
    const extensionPath = path.join(__dirname, '../../apps/extension/.output/chrome-mv3');
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
    let [background] = context.serviceWorkers();
    if (!background) background = await context.waitForEvent('serviceworker');
    extensionId = background.url().split('/')[2];
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.beforeEach(async () => {
    // chrome.storage 초기화 — 테스트 간 데이터 간섭 방지
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.evaluate(() => chrome.storage.local.clear());
    await page.close();
  });

  test('유효한 입력 저장 시 목록에 표시된다', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    await page.getByRole('textbox', { name: /item/i }).fill('test-item');
    await page.getByRole('button', { name: /add/i }).click();

    await expect(page.getByText('test-item')).toBeVisible();
    await page.close();
  });
});
```

#### Content Script 테스트

Content script는 익스텐션이 일반 웹 페이지에 주입하므로, 실제 페이지로 이동해서 테스트한다:

```typescript
test('페이지 방문 시 익스텐션 UI가 주입된다', async () => {
  const page = await context.newPage();
  await page.goto('https://example.com'); // content script 대상 도메인

  // 익스텐션이 주입한 요소 확인
  await expect(page.locator('[data-extension="codit"]')).toBeVisible();
  await page.close();
});
```

#### 백엔드 연동 테스트

백엔드가 실제로 필요한 흐름(데이터 영속성)은 백엔드 서버를 직접 띄우거나 MSW로 mock한다.
어느 전략을 쓸지 prd.md ADR을 확인한 뒤 결정한다:

```typescript
// 실제 백엔드 사용 시 — 테스트 전후 데이터 정리 필수
test.afterEach(async ({ request }) => {
  await request.delete('/api/test-data?prefix=e2e-');
});
```

---

## 4단계: 작성 후 체크리스트

- [ ] 각 test()는 단위 테스트와 겹치지 않는다
- [ ] `waitForTimeout` 없음
- [ ] 셀렉터가 역할/텍스트 기반이다 (CSS 클래스 없음)
- [ ] 각 테스트가 독립적으로 실행 가능하다
- [ ] 테스트 데이터 정리 로직이 있다 (백엔드 데이터 + chrome.storage 모두)
- [ ] Out of Scope 항목이 포함되지 않았다
- [ ] 익스텐션 ID를 하드코딩하지 않았다 (동적으로 획득)
- [ ] `headless: false` 설정이 있다 (익스텐션은 headful 필요)
- [ ] popup / content script 중 어느 진입점을 테스트하는지 명확하다

---

## 5단계: 결과 보고

아래 형식으로 출력한다.

**E2E 작성 완료 — {기능명}**
파일: `{testDir}/{기능명}/{기능명}.spec.ts`

| 시나리오 | 사용자 스토리 / ADR |
|---|---|
| [흐름] ... | 스토리 #N: {행동 요약} |
| [흐름] ... | 스토리 #N, #N / ADR-N: {요약} |

**단위 테스트와의 경계**

| 포함하지 않은 것 | 이유 |
|---|---|
| ... | 단위 테스트에서 커버 |

**실행 방법**
```bash
# package.json에서 파악한 실제 스크립트 명령어를 사용한다
```

시나리오와 사용자 스토리 번호는 prd.md의 사용자 스토리 테이블 `#` 열 기준으로 매핑한다.
하나의 시나리오가 여러 스토리를 커버하면 모두 표기한다.

---

## 제약

- `prd.md`가 없으면 중단하고 알린다
- Out of Scope 항목은 절대 시나리오에 포함하지 않는다
- `waitForTimeout` 사용 금지
- CSS 클래스 셀렉터 사용 금지
- 단위 테스트가 다루는 검증 로직을 E2E에서 재검증하지 않는다
- 테스트 데이터는 반드시 정리한다
- `testDir`과 실행 명령어는 직접 읽어서 파악하고, 임의로 가정하지 않는다
- 익스텐션 ID를 하드코딩 금지 — service worker URL에서 동적으로 추출한다
- `headless: true`로 익스텐션 E2E를 실행하지 않는다 — 크롬 익스텐션은 headful 모드 필수
- content script 테스트 시 실제 접근 가능한 도메인을 사용한다 (manifest의 `host_permissions` 범위 내)
