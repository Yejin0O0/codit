import type { Meta, StoryObj } from '@storybook/react-vite';

import { CollapsedTimer } from './collapsed-timer';

const meta = {
    title: 'Widget/CollapsedTimer',
    component: CollapsedTimer,
    args: { seconds: 754, status: 'running', onExpand: () => {} },
    argTypes: {
        status: { control: 'inline-radio', options: ['running', 'stopped'] },
        seconds: { control: 'number' },
    },
    parameters: { layout: 'centered', backgrounds: { value: 'swea' } },
} satisfies Meta<typeof CollapsedTimer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Running: Story = {};
export const Stopped: Story = { args: { status: 'stopped' } };

export const Both: Story = {
    render: () => (
        <div className="flex gap-4">
            <CollapsedTimer seconds={754} status="running" onExpand={() => {}} />
            <CollapsedTimer seconds={754} status="stopped" onExpand={() => {}} />
        </div>
    ),
};
