import { expect, type Page } from '@playwright/test';

/**
 * 펼친 위젯의 `PanelShell` 헤더 = 드래그 핸들. `data-slot` 앵커라 제목 마크업
 * (R1 재설계로 "문제 #{id}") 이 바뀌어도 안전. 세 드래그 spec 이 공유한다.
 */
export function widgetHeader(page: Page) {
    return page.locator('[data-slot="panel-shell-header"]');
}

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
