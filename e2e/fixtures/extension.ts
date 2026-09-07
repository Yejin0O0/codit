import path from 'node:path';

import { test as base, chromium, type BrowserContext } from '@playwright/test';

const EXTENSION_PATH = path.resolve(__dirname, '../../apps/extension/.output/chrome-mv3');
const MOCK_PROBLEM_PAGE_PATH = path.resolve(__dirname, 'mock-problem.html');

/**
 * 빌드된 Codit 확장을 실제 Chrome에 로드하고, `swexpertacademy.com`으로 가는
 * 요청을 로컬 mock 문제 페이지로 가로챈다 (widget-drag-move prd ADR-1/ADR-2).
 *
 * - `launchPersistentContext('')` — 빈 userDataDir 은 Playwright 가 임시 프로필을
 *   생성하고 `context.close()` 시 자동 정리한다. 테스트마다 새 프로필이라 이전
 *   실행에서 저장된 위젯 위치가 다음 실행에 남지 않는다(완전 격리).
 * - MV3 확장은 headless 모드에서 서비스워커 로드가 불안정할 수 있어 `headless: false`.
 * - `context.route()` 로 `swexpertacademy.com` 요청만 mock HTML 로 fulfill 한다 —
 *   manifest 의 `content_scripts.matches` 를 건드리지 않고 실제 주입 경로를 그대로 탄다.
 */
export const test = base.extend<{ context: BrowserContext }>({
    context: async ({}, use) => {
        const context = await chromium.launchPersistentContext('', {
            headless: false,
            args: [
                `--disable-extensions-except=${EXTENSION_PATH}`,
                `--load-extension=${EXTENSION_PATH}`,
            ],
        });

        await context.route('https://swexpertacademy.com/**', (route) =>
            route.fulfill({ path: MOCK_PROBLEM_PAGE_PATH, contentType: 'text/html' }),
        );

        await use(context);
        await context.close();
    },
});

export const expect = test.expect;
