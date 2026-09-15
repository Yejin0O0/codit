import type { Meta, StoryObj } from '@storybook/react-vite';

import { HistoryView } from '@/entrypoints/page/history/history-view';

import { ExtensionPageShell } from './extension-page-shell';
import { PageHeader } from './page-header';

/**
 * [UI-L2 R7] 스파이크 — 페이지 공통 프레임.
 * 실제 HistoryView(mock data)를 프레임 안에 넣어 놓고 본다.
 * `extension-page-shell.tsx` / `page-header.tsx` 를 직접 고치면서
 * Storybook 이 핫리로드하는 걸 보고 방향을 정한다. args(우측 Controls 패널)로
 * maxWidth 는 바로 조절 가능.
 */
const meta: Meta = {
    title: 'Page/ExtensionPageShell',
    parameters: { layout: 'fullscreen', backgrounds: { value: 'page' } },
    argTypes: {
        maxWidth: { control: { type: 'range', min: 320, max: 960, step: 8 } },
    },
};

export default meta;
type Story = StoryObj<{ maxWidth: number }>;

export const HistoryLoggedIn: Story = {
    name: '히스토리 (로그인 상태)',
    args: { maxWidth: 720 },
    render: ({ maxWidth }) => (
        <ExtensionPageShell maxWidth={maxWidth} header={<PageHeader userName="you@example.com" />}>
            <HistoryView />
        </ExtensionPageShell>
    ),
};

export const AuthPlaceholder: Story = {
    name: '로그인 전 (좁은 폭)',
    args: { maxWidth: 400 },
    render: ({ maxWidth }) => (
        <ExtensionPageShell maxWidth={maxWidth} header={<PageHeader />}>
            <section aria-label="로그인 화면 자리">
                <p className="text-muted-foreground text-sm">
                    로그인 화면은 이후 이슈에서 구현됩니다.
                </p>
            </section>
        </ExtensionPageShell>
    ),
};

export const HeaderClose: Story = {
    name: '헤더 단독 (확대 비교용)',
    args: { maxWidth: 720 },
    parameters: { layout: 'padded' },
    render: () => (
        <div className="flex flex-col gap-6">
            <PageHeader />
            <PageHeader userName="you@example.com" />
        </div>
    ),
};
