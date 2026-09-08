import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';


import { CORE_TAGS, TAG_CATEGORIES } from '@/lib/tag-catalog';

import type { ResultType } from '../screens';

import { MemoScreen } from './MemoScreen';
import { ResultSelectScreen } from './ResultSelectScreen';
import { SaveSuccessScreen } from './SaveSuccessScreen';
import { TagSelectScreen } from './TagSelectScreen';
import { TimerScreen } from './TimerScreen';

/**
 * 위젯의 실제 화면 컴포넌트. 320px 프레임 안에서 렌더한다.
 * (타이머 진행·persistence 등 로직은 상위가 소유 — 여기선 prop 으로 고정값 주입)
 */
const meta: Meta = {
    title: 'Widget/화면',
    decorators: [
        (Story) => (
            <div className="w-[320px]">
                <Story />
            </div>
        ),
    ],
    parameters: { layout: 'centered', backgrounds: { value: 'swea' } },
};
export default meta;
type Story = StoryObj;

export const 타이머: Story = {
    render: () => (
        <TimerScreen
            problemId="1024"
            problemTitle="1024. 최단 경로"
            elapsedSeconds={754}
            onComplete={() => {}}
        />
    ),
};

export const 결과_선택: Story = {
    render: function Render() {
        const [value, setValue] = useState<ResultType | null>('CORRECT');
        return <ResultSelectScreen elapsedSeconds={754} value={value} onChange={setValue} onNext={() => {}} />;
    },
};

export const 메모: Story = {
    render: function Render() {
        const [memo, setMemo] = useState('다익스트라로 풀었다');
        const [open, setOpen] = useState(true);
        return (
            <MemoScreen
                result="CORRECT"
                step="2 / 4"
                memo={memo}
                onMemoChange={setMemo}
                memoOpen={open}
                onMemoOpenChange={setOpen}
                onBack={() => {}}
                onNext={() => {}}
            />
        );
    },
};

export const 태그_선택: Story = {
    render: function Render() {
        const [ids, setIds] = useState<string[]>(['dfs', 'greedy']);
        return (
            <TagSelectScreen
                step="3 / 4"
                coreTags={CORE_TAGS}
                categories={TAG_CATEGORIES}
                customTags={[]}
                selectedTagIds={ids}
                onSelectedTagIdsChange={setIds}
                onAddCustomTag={() => {}}
                onBack={() => {}}
                onSave={() => {}}
            />
        );
    },
};

export const 저장_완료: Story = {
    render: () => (
        <SaveSuccessScreen
            result="CORRECT"
            elapsedSeconds={754}
            memo="다익스트라로 풀었다"
            tags={CORE_TAGS.slice(0, 3)}
        />
    ),
};
