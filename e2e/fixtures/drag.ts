import type { Locator } from '@playwright/test';

/**
 * locator 를 pointer down → move → up 시퀀스로 (dx, dy) 만큼 드래그한다.
 * `useWidgetPosition` 의 pointer 기반 드래그(헤더/pill 공용)를 실제 좌표로 재현한다.
 */
export async function dragBy(locator: Locator, dx: number, dy: number): Promise<void> {
    const box = await locator.boundingBox();
    if (!box) {
        throw new Error('dragBy: locator 의 bounding box 를 가져올 수 없다');
    }

    const page = locator.page();
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + dx, startY + dy);
    await page.mouse.up();
}
