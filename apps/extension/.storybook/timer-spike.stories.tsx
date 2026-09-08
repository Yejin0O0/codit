import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type CSSProperties } from 'react';

import { PanelShell } from '@/components/codit/panel-shell';
import { Button } from '@/components/ui/button';
import { TimerScreen } from '@/entrypoints/content/screens/TimerScreen';

/**
 * R1 위젯 Timer 화면 재설계 — 시각 스파이크 (throwaway).
 * 이슈 #54 / 에픽 #51. 왼쪽 = 현재 TimerScreen(실물). 오른쪽 = 재설계안(노브).
 * 정했으면 조합을 알려주면 ui-design 확정 → tdd. (확정 후 삭제)
 */

type Header = 'fixed' | 'title';
type ProblemView = 'caption' | 'prominent';
type TimerSize = 'md' | 'lg' | 'xl';
type Running = 'text' | 'dot-text' | 'dot';

const HEADER_LABEL: Record<Header, string> = {
    fixed: '"풀이 타이머" 고정 (현재)',
    title: '문제 제목을 헤더에',
};
const PROBLEM_LABEL: Record<ProblemView, string> = {
    caption: '본문 위 작게 (현재)',
    prominent: '본문 위 크게(강조)',
};
const TIMER_LABEL: Record<TimerSize, string> = { md: '5xl (현재)', lg: '6xl', xl: '7xl' };
const RUNNING_LABEL: Record<Running, string> = {
    text: '"측정 중" 텍스트 (현재)',
    'dot-text': '펄스 도트 + "측정 중"',
    dot: '펄스 도트만',
};
const TIMER_CLS: Record<TimerSize, string> = {
    md: 'text-5xl',
    lg: 'text-6xl',
    xl: 'text-7xl',
};

const PROBLEM_TITLE = '1024. 최단 경로';
const SECONDS = 754; // 12:34
const MMSS = '12:34';

function RunningIndicator({ mode }: { mode: Running }) {
    const dot = (
        <span className="bg-success relative flex size-1.5">
            <span className="bg-success absolute inline-flex size-full animate-ping rounded-full opacity-60" />
            <span className="bg-success relative inline-flex size-1.5 rounded-full" />
        </span>
    );
    if (mode === 'text') {
        return <span className="text-muted-foreground text-xs">측정 중</span>;
    }
    if (mode === 'dot') {
        return dot;
    }
    return (
        <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
            {dot} 측정 중
        </span>
    );
}

function SpikeTimer({
    header,
    problemView,
    timerSize,
    running,
}: {
    header: Header;
    problemView: ProblemView;
    timerSize: TimerSize;
    running: Running;
}) {
    const title = header === 'title' ? PROBLEM_TITLE : '풀이 타이머';
    const showProblemInBody = header === 'fixed';

    return (
        <PanelShell
            title={title}
            onCollapse={() => {}}
            footer={
                <Button type="button" className="w-full">
                    완료
                </Button>
            }
        >
            <div className="flex flex-col items-center gap-3">
                {showProblemInBody ? (
                    <span
                        className={
                            problemView === 'prominent'
                                ? 'text-foreground text-sm font-semibold'
                                : 'text-muted-foreground text-xs font-medium'
                        }
                    >
                        {PROBLEM_TITLE}
                    </span>
                ) : null}
                <div
                    className={`${TIMER_CLS[timerSize]} text-foreground font-semibold tracking-tight tabular-nums`}
                >
                    {MMSS}
                </div>
                <RunningIndicator mode={running} />
            </div>
        </PanelShell>
    );
}

const chip = (active: boolean): CSSProperties => ({
    font: '500 11px system-ui',
    padding: '5px 9px',
    borderRadius: 7,
    border: '1px solid #ccc',
    background: active ? '#5B5BD6' : '#fff',
    color: active ? '#fff' : '#333',
    cursor: 'pointer',
});

function Spike() {
    const [header, setHeader] = useState<Header>('fixed');
    const [problemView, setProblemView] = useState<ProblemView>('caption');
    const [timerSize, setTimerSize] = useState<TimerSize>('md');
    const [running, setRunning] = useState<Running>('text');

    return (
        <div style={{ font: '13px/1.5 system-ui', padding: 20 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
                <Knob label="헤더">
                    {(['fixed', 'title'] as const).map((h) => (
                        <button key={h} style={chip(header === h)} onClick={() => setHeader(h)}>
                            {HEADER_LABEL[h]}
                        </button>
                    ))}
                </Knob>
                <Knob label="문제 라벨 (헤더=고정일 때)">
                    {(['caption', 'prominent'] as const).map((p) => (
                        <button
                            key={p}
                            style={chip(problemView === p)}
                            onClick={() => setProblemView(p)}
                        >
                            {PROBLEM_LABEL[p]}
                        </button>
                    ))}
                </Knob>
                <Knob label="타이머 크기">
                    {(['md', 'lg', 'xl'] as const).map((t) => (
                        <button
                            key={t}
                            style={chip(timerSize === t)}
                            onClick={() => setTimerSize(t)}
                        >
                            {TIMER_LABEL[t]}
                        </button>
                    ))}
                </Knob>
                <Knob label="러닝 표시">
                    {(['text', 'dot-text', 'dot'] as const).map((r) => (
                        <button key={r} style={chip(running === r)} onClick={() => setRunning(r)}>
                            {RUNNING_LABEL[r]}
                        </button>
                    ))}
                </Knob>
            </div>

            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <figure style={{ margin: 0 }}>
                    <figcaption style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>
                        현재 (실 TimerScreen)
                    </figcaption>
                    <div style={{ width: 320 }}>
                        <TimerScreen
                            problemId="1024"
                            problemTitle={PROBLEM_TITLE}
                            elapsedSeconds={SECONDS}
                            onComplete={() => {}}
                            onCollapse={() => {}}
                        />
                    </div>
                </figure>
                <figure style={{ margin: 0 }}>
                    <figcaption style={{ color: '#5B5BD6', fontSize: 12, marginBottom: 8 }}>
                        재설계안
                    </figcaption>
                    <div style={{ width: 320 }}>
                        <SpikeTimer
                            header={header}
                            problemView={problemView}
                            timerSize={timerSize}
                            running={running}
                        />
                    </div>
                </figure>
            </div>

            <p style={{ color: '#888', fontSize: 12, marginTop: 24, maxWidth: 520 }}>
                흰 배경 = SWEA 문제 페이지 맥락. 조합 정하면 "헤더 title · 타이머 lg · 도트+텍스트" 식으로 알려주세요.
            </p>
        </div>
    );
}

function Knob({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 5 }}>
                {label}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{children}</div>
        </div>
    );
}

const meta: Meta<typeof Spike> = {
    title: 'Foundations/R1 Timer 스파이크',
    component: Spike,
    parameters: { layout: 'fullscreen', a11y: { test: 'off' }, backgrounds: { value: 'swea' } },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const 타이머_비교: Story = {};
