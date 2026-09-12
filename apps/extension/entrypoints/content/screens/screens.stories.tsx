import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { CORE_TAGS, TAG_CATEGORIES } from '@/lib/tag-catalog';

import { MemoScreen } from './MemoScreen';
import { ResultSelectScreen } from './ResultSelectScreen';
import { SaveSuccessScreen } from './SaveSuccessScreen';
import { TagSelectScreen } from './TagSelectScreen';
import { TimerScreen } from './TimerScreen';

/**
 * 위젯의 실제 화면 컴포넌트. 320px 프레임 안에서 렌더한다.
 * (타이머 진행·persistence 등 로직은 상위가 소유 — 여기선 prop 으로 고정값 주입)
 *
 * 각 스토리는 `args`/`argTypes`로 값을 노출한다 — 긴 제목·큰 elapsedSeconds 같은
 * 경계 케이스를 코드 수정 없이 Controls 패널에서 바로 바꿔볼 수 있어야 한다.
 * 컨트롤드 prop(value/memo/selectedTagIds 등)은 `useArgs()`로 Controls ↔ 캔버스 클릭이
 * 서로 반영되도록 양방향 바인딩한다.
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

type TimerStory = StoryObj<typeof TimerScreen>;
type ResultStory = StoryObj<typeof ResultSelectScreen>;
type MemoStory = StoryObj<typeof MemoScreen>;
type TagStory = StoryObj<typeof TagSelectScreen>;
type SuccessStory = StoryObj<typeof SaveSuccessScreen>;

export const 타이머: TimerStory = {
    args: {
        problemId: '1024',
        problemTitle: '1024. 최단 경로',
        elapsedSeconds: 754,
    },
    argTypes: {
        problemId: { control: 'text' },
        problemTitle: { control: 'text' },
        elapsedSeconds: { control: 'number' },
    },
    render: (args) => <TimerScreen {...args} onComplete={() => {}} />,
};

export const 결과_선택: ResultStory = {
    args: {
        elapsedSeconds: 754,
        value: 'CORRECT',
    },
    argTypes: {
        elapsedSeconds: { control: 'number' },
        value: { control: 'inline-radio', options: ['CORRECT', 'WRONG', 'HOLD'] },
    },
    render: function Render(args) {
        const [, updateArgs] = useArgs();
        return (
            <ResultSelectScreen {...args} onChange={(value) => updateArgs({ value })} onNext={() => {}} />
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('정답')).toHaveAttribute('data-state', 'on');

        await userEvent.click(canvas.getByText('오답'));

        // useArgs() 업데이트는 Storybook args 채널을 왕복하므로 클릭 직후 동기적으로
        // 반영되지 않는다 — waitFor 로 리렌더를 기다린다.
        await waitFor(() => {
            expect(canvas.getByText('오답')).toHaveAttribute('data-state', 'on');
            expect(canvas.getByText('정답')).toHaveAttribute('data-state', 'off');
        });
    },
};

export const 메모: MemoStory = {
    args: {
        result: 'CORRECT',
        step: '2 / 4',
        memo: '다익스트라로 풀었다',
        memoOpen: true,
    },
    argTypes: {
        result: { control: 'inline-radio', options: ['CORRECT', 'WRONG'] },
        step: { control: 'text' },
        memo: { control: 'text' },
        memoOpen: { control: 'boolean' },
    },
    render: function Render(args) {
        const [, updateArgs] = useArgs();
        return (
            <MemoScreen
                {...args}
                onMemoChange={(memo) => updateArgs({ memo })}
                onMemoOpenChange={(memoOpen) => updateArgs({ memoOpen })}
                onBack={() => {}}
                onNext={() => {}}
            />
        );
    },
};

export const 태그_선택: TagStory = {
    args: {
        step: '3 / 4',
        coreTags: CORE_TAGS,
        categories: TAG_CATEGORIES,
        customTags: [],
        selectedTagIds: ['dfs', 'greedy'],
    },
    argTypes: {
        step: { control: 'text' },
        // 배열이라 Controls 로 직접 못 바꾼다 — 캔버스에서 태그를 눌러 확인한다.
        selectedTagIds: { control: false },
        coreTags: { control: false },
        categories: { control: false },
        customTags: { control: false },
    },
    render: function Render(args) {
        const [, updateArgs] = useArgs();
        return (
            <TagSelectScreen
                {...args}
                onSelectedTagIdsChange={(selectedTagIds) => updateArgs({ selectedTagIds })}
                onAddCustomTag={() => Promise.resolve(true)}
                onBack={() => {}}
                onSave={() => {}}
            />
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('2개 선택됨')).toBeInTheDocument();

        await userEvent.click(canvas.getByText('구현'));

        await waitFor(() => {
            expect(canvas.getByText('3개 선택됨')).toBeInTheDocument();
        });
    },
};

export const 저장_완료: SuccessStory = {
    args: {
        result: 'CORRECT',
        elapsedSeconds: 754,
        memo: '다익스트라로 풀었다',
        tags: CORE_TAGS.slice(0, 3),
    },
    argTypes: {
        result: { control: 'inline-radio', options: ['CORRECT', 'WRONG', 'HOLD'] },
        elapsedSeconds: { control: 'number' },
        memo: { control: 'text' },
        tags: { control: false },
    },
    render: (args) => <SaveSuccessScreen {...args} />,
};
