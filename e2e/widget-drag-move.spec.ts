import { test, expect } from './fixtures/extension';
import { dragBy } from './fixtures/drag';
import { getWidgetPosition } from './fixtures/widget';

const MOCK_PROBLEM_URL =
    'https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=E2E-TEST-001';

test.describe('widget-drag-move — 헤더 드래그 위치 영속 (e2e-infra #26)', () => {
    test('[정상] mock 문제 페이지에 접속하면 Codit 위젯이 뜬다', async ({ context }) => {
        const page = await context.newPage();
        await page.goto(MOCK_PROBLEM_URL);

        await expect(page.getByText('풀이 타이머')).toBeVisible();
    });

    test('[정상] 헤더를 드래그하면 위젯이 이동한 만큼 위치가 갱신된다', async ({ context }) => {
        const page = await context.newPage();
        await page.goto(MOCK_PROBLEM_URL);

        const header = page.getByText('풀이 타이머').locator('..');
        const before = await getWidgetPosition(page);

        const dx = -250;
        const dy = 200;
        await dragBy(header, dx, dy);

        const after = await getWidgetPosition(page);
        expect(after.left).toBe(before.left + dx);
        expect(after.top).toBe(before.top + dy);
    });

    test('[정상] 드래그 후 새로고침하면 옮긴 위치 그대로 위젯이 다시 뜬다', async ({ context }) => {
        const page = await context.newPage();
        await page.goto(MOCK_PROBLEM_URL);

        const header = page.getByText('풀이 타이머').locator('..');
        await dragBy(header, -250, 200);
        const afterDrag = await getWidgetPosition(page);

        await page.reload();

        const afterReload = await getWidgetPosition(page);
        expect(afterReload).toEqual(afterDrag);
    });

    test('[경계] 서로 다른 테스트 실행은 이전 실행의 위치를 공유하지 않는다', async ({
        context,
    }) => {
        const page = await context.newPage();
        await page.goto(MOCK_PROBLEM_URL);

        // 이 테스트는 새 persistent context(임시 프로필)에서 실행되므로, 다른 테스트가
        // 드래그로 옮긴 위치가 이어졌다면 Default position(top-right, margin 20)이
        // 아닐 것이다.
        const widgetWidth = await page.locator('#codit-root').evaluate((el) => el.clientWidth);
        const viewport = page.viewportSize();
        if (!viewport) {
            throw new Error('viewport size 를 가져올 수 없다');
        }

        const position = await getWidgetPosition(page);
        expect(position.top).toBe(20);
        expect(position.left).toBe(viewport.width - widgetWidth - 20);
    });

    test('[예외] swexpertacademy.com 이 아닌 페이지에서는 위젯이 뜨지 않는다', async ({
        context,
    }) => {
        const page = await context.newPage();
        await page.goto('about:blank');

        await expect(page.locator('#codit-root')).toHaveCount(0);
    });
});
