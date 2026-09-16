import type { Meta, StoryObj } from '@storybook/react-vite';

import { ExtensionPageShell } from '@/components/codit/extension-page-shell';
import { PageHeader } from '@/components/codit/page-header';

import { resolveMockDetail, TAG_CATALOG } from './mock-data';
import { ProblemDetailView } from './problem-detail-view';

/**
 * [UI-L2 R10] 문제 상세(회차 히스토리) — Option 5(좌우 분할, 이슈 #102)의 실사용 조합.
 */
const meta: Meta = {
    title: 'Page/History Detail',
    parameters: { layout: 'fullscreen', backgrounds: { value: 'page' } },
};

export default meta;
type Story = StoryObj;

export const MultipleAttempts: Story = {
    name: '여러 회차 — 좌우 분할',
    render: () => (
        <ExtensionPageShell maxWidth={720} header={<PageHeader userName="you@example.com" />}>
            <ProblemDetailView
                problemId="1859"
                tagCatalog={TAG_CATALOG}
                resolveDetail={resolveMockDetail}
                loadDelayMs={0}
                onBack={() => {}}
            />
        </ExtensionPageShell>
    ),
};

export const SingleAttempt: Story = {
    name: '단일 회차 — 목록 없이 상세만',
    render: () => (
        <ExtensionPageShell maxWidth={720} header={<PageHeader userName="you@example.com" />}>
            <ProblemDetailView
                problemId="2178"
                tagCatalog={TAG_CATALOG}
                resolveDetail={resolveMockDetail}
                loadDelayMs={0}
                onBack={() => {}}
            />
        </ExtensionPageShell>
    ),
};
