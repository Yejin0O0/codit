import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';


import { ToggleGroup, ToggleGroupItem } from './toggle-group';

const meta: Meta = {
    title: 'Primitives/ToggleGroup',
    parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj;

export const SingleSelect: Story = {
    render: function Render() {
        const [value, setValue] = useState('all');
        return (
            <ToggleGroup
                type="single"
                variant="outline"
                value={value}
                onValueChange={(v) => v && setValue(v)}
            >
                <ToggleGroupItem value="all">전체</ToggleGroupItem>
                <ToggleGroupItem value="correct">정답</ToggleGroupItem>
                <ToggleGroupItem value="wrong">오답</ToggleGroupItem>
                <ToggleGroupItem value="hold">보류</ToggleGroupItem>
            </ToggleGroup>
        );
    },
};

export const MultiSelect: Story = {
    render: function Render() {
        const [value, setValue] = useState<string[]>(['dfs']);
        return (
            <ToggleGroup type="multiple" variant="outline" value={value} onValueChange={setValue}>
                <ToggleGroupItem value="dfs">DFS</ToggleGroupItem>
                <ToggleGroupItem value="bfs">BFS</ToggleGroupItem>
                <ToggleGroupItem value="greedy">그리디</ToggleGroupItem>
                <ToggleGroupItem value="dp">DP</ToggleGroupItem>
            </ToggleGroup>
        );
    },
};
