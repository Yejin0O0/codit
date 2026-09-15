import type { Meta, StoryObj } from '@storybook/react-vite';

import { HistoryView } from '@/entrypoints/page/history/history-view';

import { ExtensionPageShell } from './extension-page-shell';
import { PageHeader } from './page-header';

/**
 * [UI-L2 R7] 페이지 공통 프레임 — Option C(스파이크 #98에서 채택: sticky 헤더 + 콘텐츠 카드).
 * `ExtensionPageShell`/`PageHeader` 자체가 이 프레임을 갖고 있으므로 스토리는 실사용 조합만 보여준다.
 */
const meta: Meta = {
    title: 'Page/ExtensionPageShell',
    parameters: { layout: 'fullscreen', backgrounds: { value: 'page' } },
};

export default meta;
type Story = StoryObj;

export const HistoryLoggedIn: Story = {
    name: '히스토리 (로그인 상태)',
    render: () => (
        <ExtensionPageShell maxWidth={720} header={<PageHeader userName="you@example.com" />}>
            <HistoryView />
        </ExtensionPageShell>
    ),
};

export const AuthPlaceholder: Story = {
    name: '로그인 전 (좁은 폭)',
    render: () => (
        <ExtensionPageShell maxWidth={400} header={<PageHeader />}>
            <section aria-label="로그인 화면 자리">
                <p className="text-muted-foreground text-sm">
                    로그인 화면은 이후 이슈에서 구현됩니다.
                </p>
            </section>
        </ExtensionPageShell>
    ),
};
