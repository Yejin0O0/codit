import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from './button';

const meta = {
    title: 'Primitives/Button',
    component: Button,
    args: { children: '완료' },
    argTypes: {
        variant: {
            control: 'inline-radio',
            options: ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'],
        },
        size: { control: 'inline-radio', options: ['sm', 'default', 'lg', 'icon'] },
    },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllVariants: Story = {
    render: () => (
        <div className="flex flex-wrap items-center gap-3">
            <Button>완료</Button>
            <Button variant="secondary">secondary</Button>
            <Button variant="outline">뒤로</Button>
            <Button variant="ghost">ghost</Button>
            <Button variant="destructive">삭제</Button>
            <Button variant="link">회원가입</Button>
        </div>
    ),
};

export const Sizes: Story = {
    render: () => (
        <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">sm</Button>
            <Button size="default">default</Button>
            <Button size="lg">lg</Button>
        </div>
    ),
};
