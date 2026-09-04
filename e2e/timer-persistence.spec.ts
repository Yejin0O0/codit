import { test, expect } from './fixtures/extension';

const MOCK_PROBLEM_URL =
    'https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=E2E-TIMER-001';

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
});
