import type { Meta, StoryObj } from '@storybook/react-vite';

import { CoditMark } from '@/components/codit/codit-mark';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/format-duration';

/**
 * R6 스파이크 — 접힌 타이머 pill의 running 펄스 신호 위치 비교용. **throwaway.**
 * 개발자가 `pulse` 노브로 none / before-time / on-mark 를 직접 보고 이슈 #81에서
 * 방향을 확정하면 이 파일은 삭제하고 정식 `collapsed-timer.stories.tsx`만 남긴다.
 *
 * - none        : 현행 (running 신호 없음)
 * - before-time : 시간 숫자 앞 민트 펄스 도트 (R1 TimerDisplay와 동일 패턴)
 * - on-mark     : C 마크 우상단에 오버레이 점
 */

type Pulse = 'none' | 'before-time' | 'on-mark';

interface SpikeArgs {
    pulse: Pulse;
    status: 'running' | 'stopped';
    seconds: number;
}

/** R1 TimerDisplay에서 쓰는 것과 동일한 민트 펄스 도트 마크업. */
function LiveDot({ className }: { className?: string }) {
    return (
        <span className={`relative flex size-1.5 ${className ?? ''}`} aria-hidden="true">
            <span className="bg-success absolute inline-flex size-full animate-ping rounded-full opacity-60" />
            <span className="bg-success relative inline-flex size-1.5 rounded-full" />
        </span>
    );
}

function CheckIcon() {
    return (
        <svg viewBox="0 0 20 20" fill="none" className="text-success size-5" aria-hidden="true">
            <path
                d="M5 10.5l3.2 3.2L15 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function ChevronUp() {
    return (
        <svg viewBox="0 0 16 16" fill="none" className="text-muted-foreground size-4" aria-hidden="true">
            <path
                d="M4 10l4-4 4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function PillSpike({ pulse, status, seconds }: SpikeArgs) {
    const running = status === 'running';
    const showDot = running && pulse !== 'none';

    return (
        <Button type="button" variant="outline" className="h-10 gap-2 rounded-full px-3.5 shadow-lg">
            <span className="relative inline-flex">
                <CoditMark className="text-primary" />
                {showDot && pulse === 'on-mark' ? (
                    <LiveDot className="absolute -top-0.5 -right-0.5" />
                ) : null}
            </span>

            {showDot && pulse === 'before-time' ? <LiveDot /> : null}

            <span className="text-base font-medium tabular-nums">{formatDuration(seconds)}</span>

            {status === 'stopped' ? <CheckIcon /> : null}
            <ChevronUp />
        </Button>
    );
}

const meta: Meta<SpikeArgs> = {
    title: 'Widget/스파이크/R6 접힌타이머',
    parameters: { layout: 'centered', backgrounds: { value: 'swea' } },
    args: { pulse: 'before-time', status: 'running', seconds: 754 },
    argTypes: {
        pulse: {
            control: 'inline-radio',
            options: ['none', 'before-time', 'on-mark'],
            description: 'running 펄스 도트 위치 (stopped엔 표시 안 됨)',
        },
        status: { control: 'inline-radio', options: ['running', 'stopped'] },
        seconds: { control: 'number' },
    },
    render: (args) => <PillSpike {...args} />,
};
export default meta;

type Story = StoryObj<SpikeArgs>;

/** 노브로 none / before-time / on-mark 를 전환하며 비교. */
export const 비교: Story = {};

/** 세 안을 나란히 (running). */
export const 나란히: Story = {
    parameters: { layout: 'padded' },
    render: (args) => (
        <div className="flex flex-col gap-4">
            {(['none', 'before-time', 'on-mark'] as const).map((pulse) => (
                <div key={pulse} className="flex items-center gap-3">
                    <span className="text-muted-foreground w-24 text-xs font-semibold">{pulse}</span>
                    <PillSpike {...args} pulse={pulse} status="running" />
                </div>
            ))}
            <div className="flex items-center gap-3">
                <span className="text-muted-foreground w-24 text-xs font-semibold">stopped</span>
                <PillSpike {...args} pulse="before-time" status="stopped" />
            </div>
        </div>
    ),
};
