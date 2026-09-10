import { test, expect } from './fixtures/extension';

/**
 * #73 — 완료 후 결과 기록 흐름(결과·메모·태그·현재 화면)이 새로고침을 견디는지 검증한다.
 *
 * 단위 테스트(App.test.tsx / attempt-draft/store.test.ts)는 `initialDraft` prop 주입으로
 * 복원 동작을 근사한다. 여기서는 실제 content script 재실행(page.reload)을 거쳐
 * chrome.storage.session 왕복까지 포함한 전 경로를 확인한다.
 *
 * 테스트마다 fixture 가 새 임시 프로필을 만들어 storage 가 격리되지만, 방어적으로
 * contestProbId 도 테스트별로 다르게 둔다.
 */

const problemUrl = (probId: string) =>
    `https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=${probId}`;

const timerText = (page: import('@playwright/test').Page) => page.getByText(/^\d{2}:\d{2}$/);

test.describe('attempt-draft-persistence — 결과 기록 폼 새로고침 유실 방지 (#73)', () => {
    test('[흐름] 결과·메모까지 입력한 뒤 새로고침하면 메모 화면과 입력 내용이 유지된다', async ({
        context,
    }) => {
        const page = await context.newPage();
        await page.goto(problemUrl('E2E-DRAFT-001'));

        // 위젯이 뜨고 타이머가 흐르기 시작할 때까지 대기.
        await expect(timerText(page)).toBeVisible();

        await page.getByRole('button', { name: '완료' }).click();
        await page.getByText('오답').click();
        await page.getByRole('button', { name: '다음' }).click(); // 결과 → 메모

        const memo = page.getByRole('textbox');
        await memo.fill('이분탐색 경계 조건 실수');
        await expect(memo).toHaveValue('이분탐색 경계 조건 실수');

        await page.reload();

        // 새로고침 후: 타이머 화면이 아니라 메모 화면으로 복귀하고 내용이 남아 있다.
        await expect(page.getByRole('textbox')).toHaveValue('이분탐색 경계 조건 실수');
        await expect(page.getByRole('button', { name: '완료' })).toHaveCount(0);
    });

    test('[흐름] 태그를 선택한 뒤 새로고침하면 태그 화면과 선택 상태가 유지된다', async ({
        context,
    }) => {
        const page = await context.newPage();
        await page.goto(problemUrl('E2E-DRAFT-002'));
        await expect(timerText(page)).toBeVisible();

        await page.getByRole('button', { name: '완료' }).click();
        await page.getByText('보류').click();
        await page.getByRole('button', { name: '다음' }).click(); // 결과 → 메모
        await page.getByRole('button', { name: '다음' }).click(); // 메모 → 태그
        await page.getByRole('button', { name: 'DFS' }).click();
        await expect(page.getByText('1개 선택됨')).toBeVisible();

        await page.reload();

        await expect(page.getByText('태그 선택')).toBeVisible();
        await expect(page.getByText('1개 선택됨')).toBeVisible();
    });

    test('[흐름] "저장" 완료 후 새로고침하면 초안이 정리되어 타이머 화면으로 새로 시작한다', async ({
        context,
    }) => {
        const page = await context.newPage();
        await page.goto(problemUrl('E2E-DRAFT-003'));
        await expect(timerText(page)).toBeVisible();

        await page.getByRole('button', { name: '완료' }).click();
        await page.getByText('보류').click();
        await page.getByRole('button', { name: '다음' }).click(); // 결과 → 메모
        await page.getByRole('button', { name: '다음' }).click(); // 메모 → 태그
        await page.getByRole('button', { name: 'DFS' }).click();
        await page.getByRole('button', { name: '저장' }).click();
        await expect(page.getByText('저장되었어요')).toBeVisible();

        await page.reload();

        // 초안·세션이 함께 정리되었으므로 저장 완료 화면이 아니라 타이머 화면으로 뜬다.
        await expect(page.getByRole('button', { name: '완료' })).toBeVisible();
        await expect(page.getByText('저장되었어요')).toHaveCount(0);
    });
});
