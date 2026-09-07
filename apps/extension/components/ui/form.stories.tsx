import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';

const meta: Meta = {
    title: 'Primitives/Form',
    parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj;

export const Fields: Story = {
    render: () => (
        <div className="flex w-72 flex-col gap-4">
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="tag">태그</Label>
                <Input id="tag" placeholder="태그를 입력하세요" />
            </div>
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="memo">메모</Label>
                <Textarea id="memo" placeholder="이 문제에서 배운 것…" />
            </div>
            <Input aria-label="비활성" placeholder="disabled" disabled />
            <Input aria-invalid defaultValue="잘못된 값" />
        </div>
    ),
};
