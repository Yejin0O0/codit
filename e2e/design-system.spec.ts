import type { BrowserContext } from '@playwright/test';

import { test, expect } from './fixtures/extension';

/**
 * 디자인 시스템 시각 QA 하네스 (`/design-system` 스킬).
 *
 *  1. 스크린샷 회귀 — 갤러리 + 위젯 상태. `toHaveScreenshot()`.
 *     headful Chrome이라 렌더링이 머신 의존적 → **로컬 자문용**. CI 회귀 가드로 신뢰하지 않는다.
 *     의도된 시각 변화는 `--update-snapshots`로 갱신한다. 초 단위로 바뀌는 타이머 숫자는 mask.
 *  2. 대비 — 갤러리의 fg/bg 쌍을 브라우저 canvas로 sRGB화해 WCAG 명도비를 계산.
 *     계산값은 결정적 → **CI 가드**. 각 쌍의 최소 요구치는 `data-contrast-min` 속성이 정한다.
 *  3. 수동 검토 walkthrough — `DS_REVIEW=1`로 실행하면 갤러리와 위젯 각 화면에서 멈춰
 *     개발자가 눈으로 확인한다. 자동 스크린샷이 너무 빨라 볼 수 없을 때 쓴다.
 *
 * 리스킨 전 baseline: 토큰은 shadcn `neutral` 기본값. `/design-system` Phase 2에서
 * 텍스트 쌍(destructive·success·muted)의 요구치를 4.5로 조인다.
 */

const MOCK_PROBLEM_URL =
    'https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=DS-GALLERY-001';

async function getExtensionId(context: BrowserContext): Promise<string> {
    let [sw] = context.serviceWorkers();
    if (!sw) {
        sw = await context.waitForEvent('serviceworker');
    }
    return sw.url().split('/')[2];
}

test.describe('design-system — 갤러리 스크린샷 (로컬 자문)', () => {
    test('부품 카탈로그 전체', async ({ context }) => {
        const extensionId = await getExtensionId(context);
        const page = await context.newPage();
        await page.goto(`chrome-extension://${extensionId}/gallery.html`);

        await expect(
            page.getByRole('heading', { name: 'Codit Design System Gallery' }),
        ).toBeVisible();
        await expect(page.locator('#compositions-panel')).toBeVisible();

        await expect(page).toHaveScreenshot('gallery-full.png', {
            fullPage: true,
            // 갤러리 안의 타이머 표시(TimerDisplay/CollapsedTimer/PanelShell)는 고정값이라 mask 불필요.
        });
    });
});

test.describe('design-system — 위젯 스크린샷 (로컬 자문)', () => {
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

        const pill = widget.getByRole('button', { name: /펼치기/ });
        await expect(pill).toBeVisible();
        await expect(widget).toHaveScreenshot('widget-collapsed.png', {
            mask: [widget.getByText(/^\d{2}:\d{2}$/)],
        });
    });
});

test.describe('design-system — 대비 (CI 가드)', () => {
    test('갤러리 fg/bg 쌍이 각자의 최소 명도비를 만족한다', async ({ context }) => {
        const extensionId = await getExtensionId(context);
        const page = await context.newPage();
        await page.goto(`chrome-extension://${extensionId}/gallery.html`);
        await expect(page.locator('#tokens-contrast')).toBeVisible();

        const results = await page.locator('[data-contrast-pair]').evaluateAll((nodes) => {
            // 임의의 CSS 색 문자열(oklch 포함)을 브라우저 엔진으로 sRGB 바이트화한다.
            const toRgb = (color: string): [number, number, number] => {
                const canvas = document.createElement('canvas');
                canvas.width = canvas.height = 1;
                const ctx = canvas.getContext('2d')!;
                ctx.fillStyle = '#000';
                ctx.fillStyle = color;
                ctx.fillRect(0, 0, 1, 1);
                const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                return [r, g, b];
            };
            const channel = (c: number) => {
                const s = c / 255;
                return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
            };
            const luminance = ([r, g, b]: [number, number, number]) =>
                0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
            const ratio = (fg: string, bg: string) => {
                const l1 = luminance(toRgb(fg));
                const l2 = luminance(toRgb(bg));
                const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
                return (hi + 0.05) / (lo + 0.05);
            };

            return nodes.map((node) => {
                const el = node as HTMLElement;
                const textEl = (el.querySelector('[data-contrast-text]') ?? el) as HTMLElement;
                const cs = getComputedStyle(textEl);
                const bg = getComputedStyle(el).backgroundColor;
                return {
                    name: el.dataset.contrastPair ?? '?',
                    min: Number(el.dataset.contrastMin ?? '4.5'),
                    ratio: Math.round(ratio(cs.color, bg) * 100) / 100,
                };
            });
        });

        const failures = results.filter((r) => r.ratio < r.min);
        expect(
            failures,
            `대비 미달: ${failures.map((f) => `${f.name} ${f.ratio}:1 < ${f.min}`).join(', ')}`,
        ).toEqual([]);
    });
});

/**
 * 수동 검토 — `DS_REVIEW=1 pnpm test:e2e e2e/design-system.spec.ts -g "수동 검토"` 로 실행.
 * 각 `page.pause()` 에서 Playwright Inspector 가 뜨고 멈춘다. 눈으로 확인한 뒤 Resume.
 * 자동 스크린샷이 너무 빨라 페이지 전환을 못 볼 때 사용한다.
 */
test.describe('design-system — 수동 검토 (walkthrough)', () => {
    test.skip(!process.env.DS_REVIEW, 'DS_REVIEW=1 로 실행');

    test('갤러리 → 위젯 전 화면을 순서대로 열고 각 단계에서 멈춘다', async ({ context }) => {
        const extensionId = await getExtensionId(context);

        const gallery = await context.newPage();
        await gallery.goto(`chrome-extension://${extensionId}/gallery.html`);
        await gallery.pause(); // ① 갤러리(토큰·프리미티브·조합) 검토 → Resume

        const page = await context.newPage();
        await page.goto(MOCK_PROBLEM_URL);
        const widget = page.locator('#codit-root');
        await expect(widget.getByText(/^\d{2}:\d{2}$/)).toBeVisible();
        await page.pause(); // ② 위젯 expanded — 타이머 화면 → Resume

        await widget.getByRole('button', { name: '완료' }).click();
        await page.pause(); // ③ 결과 선택 화면 → Resume

        await widget.getByRole('button', { name: '정답', exact: true }).click();
        await widget.getByRole('button', { name: '다음' }).click();
        await page.pause(); // ④ 메모 화면 → Resume

        await widget.getByRole('button', { name: '다음' }).click();
        await page.pause(); // ⑤ 태그 선택 화면 → Resume

        await widget.getByRole('button', { name: 'Codit 타이머 접기' }).first().click();
        await page.pause(); // ⑥ collapsed pill → Resume
    });
});
