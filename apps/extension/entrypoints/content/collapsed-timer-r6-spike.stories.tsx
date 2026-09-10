import type { Meta, StoryObj } from '@storybook/react-vite';

import { CoditMark } from '@/components/codit/codit-mark';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/format-duration';
import { cn } from '@/lib/utils';

/**
 * R6 스파이크 — 접힌 타이머 pill의 running("측정 중") 시각 신호 후보들. **throwaway.**
 * 개발자가 `signal` 노브로 훑어보고 이슈 #81에서 방향을 확정하면 이 파일은 삭제하고
 * 정식 `collapsed-timer.stories.tsx`만 남긴다.
 *
 * 제약: 40px pill · stopped의 success 체크와 충돌 없을 것 · `bg-success`(민트)가
 * "측정 중" 색 (R1 TimerDisplay와 동일) · `prefers-reduced-motion`은 tokens.css 전역
 * @media가 애니메이션을 죽이므로 여기선 고려 안 함.
 */

type Signal =
    | 'none' // 현행 — 신호 없음
    | 'ping-before' // 시간 앞 펄스 도트 (R1 패턴)
    | 'ping-after' // 시간 뒤(chevron 앞) 펄스 도트
    | 'ping-on-mark' // C 마크 우상단 오버레이 펄스 도트
    | 'dot-static' // 시간 앞 정적 도트 (무애니 — 저소음)
    | 'ring' // pill 전체에 민트 링이 맥동
    | 'mark-tint' // running이면 C 마크를 민트색으로 (색만, 무애니)
    | 'mark-breathe'; // C 마크가 opacity 맥동

interface SpikeArgs {
    signal: Signal;
    status: 'running' | 'stopped';
    seconds: number;
}

const SIGNALS: Signal[] = [
    'none',
    'ping-before',
    'ping-after',
    'ping-on-mark',
    'dot-static',
    'ring',
    'mark-tint',
    'mark-breathe',
];

/** R1 TimerDisplay와 동일한 민트 펄스 도트(후광 + 중심점). */
function LiveDot({ className }: { className?: string }) {
    return (
        <span className={cn('relative flex size-1.5', className)} aria-hidden="true">
            <span className="bg-success absolute inline-flex size-full animate-ping rounded-full opacity-60" />
            <span className="bg-success relative inline-flex size-1.5 rounded-full" />
        </span>
    );
}

function StaticDot() {
    return <span className="bg-success size-1.5 shrink-0 rounded-full" aria-hidden="true" />;
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

function PillSpike({ signal, status, seconds }: SpikeArgs) {
    const on = status === 'running' && signal !== 'none';

    const markClass = cn(
        on && signal === 'mark-tint' ? 'text-success' : 'text-primary',
        on && signal === 'mark-breathe' && 'animate-pulse',
    );

    return (
        <Button
            type="button"
            variant="outline"
            className={cn(
                'h-10 gap-2 rounded-full px-3.5 shadow-lg',
                on && signal === 'ring' && 'ring-success/50 animate-pulse ring-2',
            )}
        >
            <span className="relative inline-flex">
                <CoditMark className={markClass} />
                {on && signal === 'ping-on-mark' ? (
                    <LiveDot className="absolute -top-0.5 -right-0.5" />
                ) : null}
            </span>

            {on && signal === 'ping-before' ? <LiveDot /> : null}
            {on && signal === 'dot-static' ? <StaticDot /> : null}

            <span className="text-base font-medium tabular-nums">{formatDuration(seconds)}</span>

            {on && signal === 'ping-after' ? <LiveDot /> : null}
            {status === 'stopped' ? <CheckIcon /> : null}
            <ChevronUp />
        </Button>
    );
}

const meta: Meta<SpikeArgs> = {
    title: 'Widget/스파이크/R6 접힌타이머',
    parameters: { layout: 'centered', backgrounds: { value: 'swea' } },
    args: { signal: 'ping-before', status: 'running', seconds: 754 },
    argTypes: {
        signal: {
            control: 'select',
            options: SIGNALS,
            description: 'running "측정 중" 시각 신호 후보 (stopped엔 표시 안 됨)',
        },
        status: { control: 'inline-radio', options: ['running', 'stopped'] },
        seconds: { control: 'number' },
    },
    render: (args) => <PillSpike {...args} />,
};
export default meta;

type Story = StoryObj<SpikeArgs>;

/** 노브로 신호 후보를 하나씩 전환하며 비교. */
export const 비교: Story = {};

/** 8개 후보를 running 상태로 나란히 + 맨 아래 stopped 대조. */
export const 나란히: Story = {
    parameters: { layout: 'padded' },
    render: (args) => (
        <div className="flex flex-col gap-3">
            {SIGNALS.map((signal) => (
                <div key={signal} className="flex items-center gap-3">
                    <span className="text-muted-foreground w-28 text-xs font-semibold">{signal}</span>
                    <PillSpike {...args} signal={signal} status="running" />
                </div>
            ))}
            <div className="mt-2 flex items-center gap-3 border-t pt-3">
                <span className="text-muted-foreground w-28 text-xs font-semibold">stopped (대조)</span>
                <PillSpike {...args} signal="ping-before" status="stopped" />
            </div>
        </div>
    ),
};
