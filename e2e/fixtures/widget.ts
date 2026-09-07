import { expect, type Page } from '@playwright/test';

/**
 * `#codit-root` 의 저장값 읽기가 끝날 때까지(`visibility: hidden` 해제) 기다린 뒤
 * 현재 top/left(px, number)를 반환한다. 읽기 전에 위치를 읽으면 Default position
 * 과 복원된 위치 중 어느 시점 값인지 보장할 수 없어 flaky 해진다.
 */
export async function getWidgetPosition(page: Page): Promise<{ top: number; left: number }> {
    const root = page.locator('#codit-root');
    await expect(root).not.toHaveCSS('visibility', 'hidden');

    return root.evaluate((el) => ({
        top: Number.parseFloat((el as HTMLElement).style.top),
        left: Number.parseFloat((el as HTMLElement).style.left),
    }));
}
