import { test, expect } from './fixtures/extension';
import { dragBy } from './fixtures/drag';
import { getWidgetPosition, widgetHeader } from './fixtures/widget';

const MOCK_PROBLEM_URL =
    'https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=E2E-TEST-001';

test.describe('widget-drag-move — 다중 탭 storage 동기화 (e2e-infra #28)', () => {
    test('[정상] 탭 A에서 드래그하면 탭 B의 위젯도 같은 위치로 이동한다', async ({ context }) => {
        const pageA = await context.newPage();
        const pageB = await context.newPage();
        await pageA.goto(MOCK_PROBLEM_URL);
        await pageB.goto(MOCK_PROBLEM_URL);

        const headerA = widgetHeader(pageA);
        await dragBy(headerA, -250, 200);
        const afterDragOnA = await getWidgetPosition(pageA);

        await expect
            .poll(() => getWidgetPosition(pageB), {
                message: '탭 B 의 위젯이 탭 A 와 같은 위치로 동기화되어야 한다',
            })
            .toEqual(afterDragOnA);
    });

    test('[경계] 드래그를 마친 탭의 최종 위치는 자기 자신의 storage 갱신으로 흔들리지 않는다', async ({
        context,
    }) => {
        const pageA = await context.newPage();
        const pageB = await context.newPage();
        await pageA.goto(MOCK_PROBLEM_URL);
        await pageB.goto(MOCK_PROBLEM_URL);

        const headerA = widgetHeader(pageA);
        await dragBy(headerA, -250, 200);
        const afterDragOnA = await getWidgetPosition(pageA);

        // 탭 B 로 전파된 storage.onChanged 가 탭 A 자신에게도 되돌아와 위치를
        // 흔들지 않아야 한다 — 드래그가 끝난 뒤 탭 A 의 위치는 그대로 확정값이다.
        await expect.poll(() => getWidgetPosition(pageB)).toEqual(afterDragOnA);
        expect(await getWidgetPosition(pageA)).toEqual(afterDragOnA);
    });
});
