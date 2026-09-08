import type { Page } from '@playwright/test';

import { test, expect } from './fixtures/extension';
import { dragBy } from './fixtures/drag';

const MOCK_PROBLEM_URL =
    'https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=E2E-TEST-001';

test.describe('widget-drag-move — 접힌 pill 드래그·클릭 구분 (e2e-infra #27)', () => {
    async function collapseWidget(page: Page) {
        await page.goto(MOCK_PROBLEM_URL);
        await page.getByRole('button', { name: 'Codit 위젯 접기' }).click();
        return page.getByRole('button', { name: /Codit 타이머 펼치기/ });
    }

    test('[정상] pill을 3px 이동 후 떼면 위젯이 펼쳐진다', async ({ context }) => {
        const page = await context.newPage();
        const pill = await collapseWidget(page);

        await dragBy(pill, 3, 0);

        await expect(page.locator('[data-slot="panel-shell-header"]')).toBeVisible();
    });

    test('[정상] pill을 20px 드래그하면 위젯이 이동하고 펼쳐지지 않는다', async ({ context }) => {
        const page = await context.newPage();
        const pill = await collapseWidget(page);

        const before = await pill.boundingBox();
        if (!before) {
            throw new Error('pill 의 bounding box 를 가져올 수 없다');
        }

        await dragBy(pill, -20, 0);

        await expect(page.locator('[data-slot="panel-shell-header"]')).not.toBeVisible();
        const after = await pill.boundingBox();
        expect(after?.x).toBeCloseTo(before.x - 20, 0);
    });

    test('[경계] pill을 4px(임계값 미만) 이동하면 클릭으로 처리되어 펼쳐진다', async ({
        context,
    }) => {
        const page = await context.newPage();
        const pill = await collapseWidget(page);

        await dragBy(pill, 4, 0);

        await expect(page.locator('[data-slot="panel-shell-header"]')).toBeVisible();
    });
});
