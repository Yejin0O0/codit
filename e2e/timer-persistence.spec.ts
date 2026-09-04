import path from 'node:path';

import { test, expect } from './fixtures/extension';

const MOCK_PROBLEM_URL =
    'https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=E2E-TIMER-001';
const MOCK_SOLVING_PROBLEM_URL =
    'https://swexpertacademy.com/main/solvingProblem/solvingProblem.do';
const MOCK_SOLVING_PROBLEM_PAGE_PATH = path.resolve(
    __dirname,
    'fixtures/mock-solving-problem.html',
);
const MOCK_EMPTY_PAGE_PATH = path.resolve(__dirname, 'fixtures/mock-problem.html');

test.describe('timer-persistence — 새로고침 후 Timer Session continuity (#16)', () => {
    test('[정상] 타이머 진행 중 새로고침해도 0초로 리셋되지 않고 이어진다', async ({ context }) => {
        const page = await context.newPage();
        await page.goto(MOCK_PROBLEM_URL);

        const timerText = page.getByText(/^\d{2}:\d{2}$/);
        // 실제 2초가 지날 때까지 폴링 대기 — waitForTimeout 대신 expect 의 자체 재시도 사용.
        await expect(timerText).toHaveText('00:02', { timeout: 5_000 });

        await page.reload();

        // 새로고침 후 같은 problemId 로 세션이 복원되어 0초로 리셋되지 않는다.
        await expect(page.getByText(/^\d{2}:\d{2}$/)).not.toHaveText('00:00');
    });

    test('[정상] 같은 문제를 다른 탭에서 열어도 같은 세션이 이어지고, 새로고침해도 유지된다', async ({
        context,
    }) => {
        const pageA = await context.newPage();
        await pageA.goto(MOCK_PROBLEM_URL);
        // 탭 A가 세션을 생성(mount 시 storage 에 write)할 때까지 실제 2초 대기.
        await expect(pageA.getByText(/^\d{2}:\d{2}$/)).toHaveText('00:02', { timeout: 5_000 });

        const pageB = await context.newPage();
        await pageB.goto(MOCK_PROBLEM_URL);
        // 탭 B는 같은 problemId 의 저장된 세션을 읽어 0초가 아니라 이미 진행된
        // 시간부터 보인다(다중 탭 storage 전역성, prd ADR-4).
        await expect(pageB.getByText(/^\d{2}:\d{2}$/)).not.toHaveText('00:00');

        await pageA.reload();
        // 탭 A를 새로고침해도 같은 세션이 유지되어 0초로 리셋되지 않는다.
        await expect(pageA.getByText(/^\d{2}:\d{2}$/)).not.toHaveText('00:00');
    });
});

test.describe('timer-persistence — SWEA 페이지 간 continuity (#17)', () => {
    test('[정상] problemDetail.do에서 진행 중이던 타이머가 solvingProblem.do로 이동해도 이어진다', async ({
        context,
    }) => {
        // solvingProblem.do 는 URL 에 contestProbId 가 없고 hidden input 에만 있다
        // (fixtures/extension.ts 의 기본 라우팅보다 더 구체적이라 이 경로에서 우선됨).
        await context.route(MOCK_SOLVING_PROBLEM_URL, (route) =>
            route.fulfill({ path: MOCK_SOLVING_PROBLEM_PAGE_PATH, contentType: 'text/html' }),
        );

        const page = await context.newPage();
        await page.goto(
            'https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=E2E-TIMER-002',
        );
        await expect(page.getByText(/^\d{2}:\d{2}$/)).toHaveText('00:02', { timeout: 5_000 });

        await page.goto(MOCK_SOLVING_PROBLEM_URL);

        // 같은 contestProbId(E2E-TIMER-002, hidden input 값)로 식별되어 세션이
        // 이어지고 0초로 리셋되지 않는다.
        await expect(page.getByText(/^\d{2}:\d{2}$/)).not.toHaveText('00:00');
    });

    test('[정상] hidden input이 나중에 나타나도 관찰 후 위젯이 뜬다', async ({ context }) => {
        await context.route(MOCK_SOLVING_PROBLEM_URL, (route) =>
            route.fulfill({ path: MOCK_EMPTY_PAGE_PATH, contentType: 'text/html' }),
        );

        const page = await context.newPage();
        await page.goto(MOCK_SOLVING_PROBLEM_URL);

        await expect(page.locator('#codit-root')).toHaveCount(0);

        await page.evaluate((problemId) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.id = 'contestProbId';
            input.value = problemId;
            document.body.appendChild(input);
        }, 'E2E-TIMER-003');

        await expect(page.locator('#codit-root')).toHaveCount(1);
    });
});
