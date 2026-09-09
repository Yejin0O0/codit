import { loginViaStorage } from './fixtures/auth';
import { test, expect } from './fixtures/extension';

/**
 * 이슈 #50 — JWT Silent Refresh 로그아웃 UI 배선. 이슈 #4 AC 중 단위 테스트(jsdom +
 * fakeBrowser)만으로는 못 잡는, 실제 확장 팝업 + 진짜 chrome.storage 이벤트를 도는
 * 두 흐름만 검증한다:
 *
 * - 로그아웃 버튼 클릭 → storage 초기화 → 로그인 화면 전환
 * - (다른 컨텍스트가 세팅한) storage의 sessionExpiredMessage → 로그인 화면 전환 + 안내 표시
 *
 * 선제/401 fallback refresh 판단 로직 자체(만료 임박 판정, 재시도 횟수 등)는
 * authenticatedFetch.test.ts에서 이미 충분히 커버되어 여기서 다시 검증하지 않는다.
 */

const popupUrl = (extensionId: string) => `chrome-extension://${extensionId}/popup.html`;

test.describe('login — 로그아웃 및 세션 만료 안내', () => {
    test('로그아웃 버튼 클릭 시 storage가 초기화되고 로그인 화면으로 전환된다', async ({
        context,
        extensionId,
    }) => {
        // 백엔드가 떠 있지 않은 e2e 환경이라 logout()의 best-effort fetch를 즉시 성공으로 처리한다.
        await context.route('http://localhost:8080/api/auth/logout', (route) =>
            route.fulfill({ status: 200 }),
        );

        const page = await context.newPage();
        await page.goto(popupUrl(extensionId));
        await loginViaStorage(page);

        const logoutButton = page.getByRole('button', { name: '로그아웃' });
        await expect(logoutButton).toBeVisible();

        await logoutButton.click();

        await expect(page.getByRole('button', { name: /계속하기/ })).toBeVisible();
        const stored = await page.evaluate(() => chrome.storage.local.get(['accessToken', 'expiresAt']));
        expect(stored.accessToken).toBeFalsy();
        expect(stored.expiresAt).toBeFalsy();
    });

    test('storage에 sessionExpiredMessage가 세팅되면 로그인 화면으로 전환되고 안내 문구가 표시된다', async ({
        context,
        extensionId,
    }) => {
        const page = await context.newPage();
        await page.goto(popupUrl(extensionId));
        await loginViaStorage(page);
        await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();

        // authenticatedFetch가 refresh 실패를 감지했을 때와 동일한 형태의 storage 쓰기를
        // 재현한다 — 실제 트리거(authenticatedFetch 호출부)는 이슈 #50 범위 밖이라
        // 백그라운드/다른 탭이 이미 이 상태를 만든 것으로 가정한다.
        await page.evaluate(() =>
            chrome.storage.local.set({
                sessionExpiredMessage: '세션이 만료되었습니다',
                accessToken: null,
                expiresAt: null,
            }),
        );

        await expect(page.getByRole('button', { name: /계속하기/ })).toBeVisible();
        await expect(page.getByRole('status')).toHaveText('세션이 만료되었습니다');
    });
});
