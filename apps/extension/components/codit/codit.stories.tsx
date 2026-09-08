import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';


import { CORE_TAGS } from '@/lib/tag-catalog';

import { BrandHeader } from './brand-header';
import { PanelShell } from './panel-shell';
import { ResultBadge } from './result-badge';
import { TagChipList } from './tag-chip-list';
import { TagToggleGroup } from './tag-toggle-group';
import { TimerDisplay } from './timer-display';

const meta: Meta = {
    title: 'Codit',
    parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj;

export const ResultBadges: Story = {
    render: () => (
        <div className="flex gap-3">
            <ResultBadge result="CORRECT" />
            <ResultBadge result="WRONG" />
            <ResultBadge result="HOLD" />
        </div>
    ),
};

export const Timer: Story = {
    render: () => <TimerDisplay seconds={754} caption="측정 중" />,
};

export const Brand: Story = {
    render: () => (
        <div className="flex flex-col gap-4">
            <BrandHeader variant="full" />
            <BrandHeader variant="compact" />
        </div>
    ),
};

export const Tags: Story = {
    render: function Render() {
        const [selected, setSelected] = useState<string[]>(['dfs', 'greedy']);
        return (
            <div className="flex w-72 flex-col gap-4">
                <TagChipList tagIds={['dfs', 'greedy', 'dp']} catalog={CORE_TAGS} />
                <TagToggleGroup
                    items={CORE_TAGS.slice(0, 6)}
                    value={selected}
                    onValueChange={setSelected}
                    ariaLabel="태그 선택"
                />
            </div>
        );
    },
};

export const Panel: Story = {
    render: () => (
        <div className="w-[320px]">
            <PanelShell title="결과 선택" step="1 / 4">
                <div className="flex flex-col gap-4">
                    <TimerDisplay seconds={754} caption="풀이 시간" />
                    <p className="text-muted-foreground text-sm">PanelShell 은 위젯 모든 화면의 공통 프레임입니다.</p>
                </div>
            </PanelShell>
        </div>
    ),
};
