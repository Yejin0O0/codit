import { test, expect } from './fixtures/extension';

/**
 * 위젯 실조건 시각 회귀 (`/design-system` 스킬).
 *
 * Storybook(`pnpm --filter @codit/extension storybook`)이 컴포넌트 카탈로그 + a11y(대비)를
 * 담당한다. 이 스펙은 Storybook이 못 하는 것만 본다: **빌드된 확장을 실제 Chrome에 로드,
 * Shadow DOM + `:root→:host` 토큰 치환 + 실제 SWEA 페이지 마운트** 조건의 위젯 스크린샷.
 *
 * headful Chrome이라 스냅샷은 머신 의존(`-win32` 등) → **로컬 자문용**. CI 회귀 가드 아님.
 * 초 단위로 바뀌는 타이머 숫자는 mask. 의도된 시각 변화는 `--update-snapshots`로 갱신.
 */

const MOCK_PROBLEM_URL =
    'https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=DS-WIDGET-001';

test.describe('design-system — 위젯 스크린샷 (실 Shadow DOM · 로컬 자문)', () => {
    test('expanded — 타이머 화면', async ({ context }) => {
        const page = await context.newPage();
        await page.goto(MOCK_PROBLEM_URL);

        const widget = page.locator('#codit-root');
        const clock = widget.getByText(/^\d{2}:\d{2}$/);
        await expect(clock).toBeVisible();
        await expect(widget.getByRole('button', { name: '완료' })).toBeVisible();

        await expect(widget).toHaveScreenshot('widget-timer.png', { mask: [clock] });
    });

    test('collapsed — pill', async ({ context }) => {
        const page = await context.newPage();
        await page.goto(MOCK_PROBLEM_URL);

        const widget = page.locator('#codit-root');
        await expect(widget.getByText(/^\d{2}:\d{2}$/)).toBeVisible();
        await widget.getByRole('button', { name: 'Codit 타이머 접기' }).click();

        await expect(widget.getByRole('button', { name: /펼치기/ })).toBeVisible();
        await expect(widget).toHaveScreenshot('widget-collapsed.png', {
            mask: [widget.getByText(/^\d{2}:\d{2}$/)],
        });
    });
});

/**
 * 수동 검토 — `DS_REVIEW=1 pnpm test:e2e e2e/design-system.spec.ts -g "수동 검토" --headed`.
 * 각 `page.pause()` 에서 Playwright Inspector 가 멈춘다. 눈으로 확인한 뒤 Resume.
 * (컴포넌트 단위 검토는 Storybook 에서 — 이건 실 페이지 위 위젯 흐름 전용.)
 */
test.describe('design-system — 수동 검토 (walkthrough)', () => {
    test.skip(!process.env.DS_REVIEW, 'DS_REVIEW=1 로 실행');

    test('위젯 전 화면을 순서대로 열고 각 단계에서 멈춘다', async ({ context }) => {
        const page = await context.newPage();
        await page.goto(MOCK_PROBLEM_URL);
        const widget = page.locator('#codit-root');
        await expect(widget.getByText(/^\d{2}:\d{2}$/)).toBeVisible();
        await page.pause(); // ① expanded — 타이머 화면 → Resume

        await widget.getByRole('button', { name: '완료' }).click();
        await page.pause(); // ② 결과 선택 화면 → Resume

        await widget.getByRole('button', { name: '정답', exact: true }).click();
        await widget.getByRole('button', { name: '다음' }).click();
        await page.pause(); // ③ 메모 화면 → Resume

        await widget.getByRole('button', { name: '다음' }).click();
        await page.pause(); // ④ 태그 선택 화면 → Resume

        await widget.getByRole('button', { name: 'Codit 타이머 접기' }).first().click();
        await page.pause(); // ⑤ collapsed pill → Resume
    });
});
