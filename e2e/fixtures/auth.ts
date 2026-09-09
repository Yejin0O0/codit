import type { Page } from '@playwright/test';

/**
 * chrome.storage.local에 유효한 accessToken/expiresAt을 세팅해 popup을 인증된
 * 상태로 만든다. `page`는 이미 popup.html로 한 번 이동한 상태여야 한다(chrome.storage
 * API는 확장 페이지에서만 접근 가능).
 *
 * chrome.storage API는 비동기라, addInitScript로 첫 로드 전에 미리 값을 써두는
 * 방식은 useAuth의 마운트 effect가 그 값을 읽는 시점과의 순서를 보장할 수 없다
 * (둘 다 별도 비동기 작업이라 레이스가 생긴다). 대신 빈 storage로 이미 연 페이지에
 * 값을 쓰고 reload — 쓰기가 완료된 뒤에만 마운트 effect가 실행되도록 순서를 확정한다.
 */
export async function loginViaStorage(page: Page): Promise<void> {
    await page.evaluate(() =>
        chrome.storage.local.set({ accessToken: 'e2e-access-token', expiresAt: Date.now() + 60 * 60 * 1000 }),
    );
    await page.reload();
}
