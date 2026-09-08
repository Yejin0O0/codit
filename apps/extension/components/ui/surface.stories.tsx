import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';
import { Skeleton } from './skeleton';

const meta: Meta = {
    title: 'Primitives/Surface',
    parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj;

export const CardStory: Story = {
    name: 'Card',
    render: () => (
        <Card className="w-72">
            <CardHeader>
                <CardTitle>1024. 최단 경로</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
                2일 전 · 12:34 · 정답
            </CardContent>
        </Card>
    ),
};

export const CollapsibleStory: Story = {
    name: 'Collapsible',
    render: () => (
        <Collapsible className="w-72">
            <CollapsibleTrigger className="text-primary text-sm underline-offset-4 hover:underline">
                더보기
            </CollapsibleTrigger>
            <CollapsibleContent className="text-muted-foreground pt-2 text-sm">
                펼쳐진 태그 목록이 여기 표시됩니다.
            </CollapsibleContent>
        </Collapsible>
    ),
};

export const SkeletonStory: Story = {
    name: 'Skeleton',
    render: () => (
        <div className="flex w-64 flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-20 w-full" />
        </div>
    ),
};
