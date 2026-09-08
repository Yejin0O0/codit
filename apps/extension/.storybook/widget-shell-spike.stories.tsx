import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type CSSProperties, type ReactNode } from 'react';

import { PanelShell } from '@/components/codit/panel-shell';
import { Button } from '@/components/ui/button';

/**
 * R0 위젯 프레임 재설계 — 시각 스파이크 (throwaway).
 * 이슈 #52 / 에픽 #51. tdd 들어가기 전에 `PanelShell` 레이아웃 방향을 눈으로 고르는 도구.
 * 왼쪽 = 현재 `PanelShell`(실물). 오른쪽 = 재설계안(노브로 조정).
 * 정했으면 조합을 Claude에게 알려주면 ui-design.md 확정 → tdd-red.
 */

type Separator = 'divider-full' | 'spacing' | 'hairline-inset';
type StepStyle = 'text' | 'dots' | 'bar';
type Density = 'compact' | 'default' | 'roomy';
type Shape = 'timer' | 'memo' | 'success';

const SEP_LABEL: Record<Separator, string> = {
    'divider-full': 'A 전폭 divider (현재)',
    spacing: 'B 여백만',
    'hairline-inset': 'C inset hairline',
};
const STEP_LABEL: Record<StepStyle, string> = {
    text: '텍스트 2 / 4 (현재)',
    dots: '도트 ● ● ○ ○',
    bar: '프로그레스 바',
};
const DENSITY_PAD: Record<Density, { head: string; body: string }> = {
    compact: { head: 'px-4 py-2', body: 'px-4 py-3' },
    default: { head: 'px-4 py-2.5', body: 'px-4 py-4' },
    roomy: { head: 'px-4 py-3.5', body: 'px-4 py-5' },
};

function StepIndicator({ style, n, total }: { style: StepStyle; n: number; total: number }) {
    if (style === 'text') {
        return (
            <span className="text-muted-foreground text-xs font-medium tabular-nums">
                {n} / {total}
            </span>
        );
    }
    if (style === 'dots') {
        return (
            <span className="flex items-center gap-1" aria-label={`${n} / ${total} 단계`}>
                {Array.from({ length: total }, (_, i) => (
                    <span
                        key={i}
                        className={
                            i < n
                                ? 'bg-primary size-1.5 rounded-full'
                                : 'border-input size-1.5 rounded-full border'
                        }
                    />
                ))}
            </span>
        );
    }
    return null; // bar 는 헤더 하단에 별도 렌더
}

function SpikeShell({
    separator,
    stepStyle,
    density,
    title,
    step,
    children,
    footer,
}: {
    separator: Separator;
    stepStyle: StepStyle;
    density: Density;
    title: string;
    step?: { n: number; total: number };
    children: ReactNode;
    footer?: ReactNode;
}) {
    const pad = DENSITY_PAD[density];
    const headBorder =
        separator === 'divider-full'
            ? 'border-b'
            : separator === 'hairline-inset'
              ? 'border-b border-border/60 mx-4 !px-0'
              : '';
    const footBorder =
        separator === 'divider-full'
            ? 'border-t'
            : separator === 'hairline-inset'
              ? 'border-t border-border/60 mx-4 !px-0'
              : '';
    const headTone = separator === 'spacing' ? 'bg-muted/30' : '';

    return (
        <div className="bg-card text-card-foreground w-[320px] overflow-hidden rounded-xl border shadow-lg">
            <div className={`${pad.head} ${headBorder} ${headTone} flex items-center justify-between`}>
                <h2 className="text-sm font-semibold">{title}</h2>
                <span className="flex items-center gap-2">
                    {step && stepStyle !== 'bar' ? (
                        <StepIndicator style={stepStyle} n={step.n} total={step.total} />
                    ) : null}
                    <span className="text-muted-foreground -mr-1 flex size-6 items-center justify-center">
                        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-4">
                            <path
                                d="M4 6l4 4 4-4"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                </span>
            </div>
            {step && stepStyle === 'bar' ? (
                <div className="bg-muted h-0.5 w-full">
                    <div
                        className="bg-primary h-full"
                        style={{ width: `${(step.n / step.total) * 100}%` }}
                    />
                </div>
            ) : null}

            <div className={pad.body}>{children}</div>

            {footer ? (
                <div className={`${pad.head} ${footBorder} ${headTone} flex gap-2`}>{footer}</div>
            ) : null}
        </div>
    );
}

// ---- 대표 본문 3종 (프레임 형태 A/B/C 판단용 — 실제 화면 콘텐츠 아님) ----

function TimerBody() {
    return (
        <div className="flex flex-col items-center gap-4">
            <span className="text-muted-foreground text-xs font-medium">문제 #1024</span>
            <span className="text-foreground text-4xl font-semibold tabular-nums">12:34</span>
            <span className="text-muted-foreground text-xs">측정 중</span>
        </div>
    );
}
function MemoBody() {
    return (
        <div className="flex flex-col gap-2">
            <p className="text-sm">메모</p>
            <div className="border-input text-muted-foreground min-h-20 rounded-md border px-3 py-2 text-sm">
                다익스트라로 풀었다…
            </div>
        </div>
    );
}
function SuccessBody() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-2 py-1">
                <span className="bg-success/10 text-success flex size-10 items-center justify-center rounded-full">
                    <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden="true">
                        <path
                            d="M5 10.5l3.2 3.2L15 7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </span>
                <p className="text-sm font-semibold">저장되었어요</p>
            </div>
            <dl className="bg-muted/50 flex flex-col gap-2 rounded-lg p-3 text-sm">
                <div className="flex justify-between">
                    <dt className="text-muted-foreground">결과</dt>
                    <dd className="font-medium">정답</dd>
                </div>
                <div className="flex justify-between">
                    <dt className="text-muted-foreground">풀이 시간</dt>
                    <dd className="font-medium tabular-nums">12:34</dd>
                </div>
            </dl>
        </div>
    );
}

function currentShell(shape: Shape) {
    if (shape === 'timer') {
        return (
            <PanelShell
                title="풀이 타이머"
                onCollapse={() => {}}
                footer={
                    <Button type="button" className="w-full">
                        완료
                    </Button>
                }
            >
                <TimerBody />
            </PanelShell>
        );
    }
    if (shape === 'memo') {
        return (
            <PanelShell
                title="메모"
                step="2 / 4"
                onCollapse={() => {}}
                footer={
                    <>
                        <Button type="button" variant="outline" className="flex-1">
                            뒤로
                        </Button>
                        <Button type="button" className="flex-1">
                            다음
                        </Button>
                    </>
                }
            >
                <MemoBody />
            </PanelShell>
        );
    }
    return (
        <PanelShell title="저장 완료" onCollapse={() => {}}>
            <SuccessBody />
        </PanelShell>
    );
}

function proposedShell(
    shape: Shape,
    separator: Separator,
    stepStyle: StepStyle,
    density: Density,
) {
    if (shape === 'timer') {
        return (
            <SpikeShell
                separator={separator}
                stepStyle={stepStyle}
                density={density}
                title="풀이 타이머"
                footer={
                    <Button type="button" className="w-full">
                        완료
                    </Button>
                }
            >
                <TimerBody />
            </SpikeShell>
        );
    }
    if (shape === 'memo') {
        return (
            <SpikeShell
                separator={separator}
                stepStyle={stepStyle}
                density={density}
                title="메모"
                step={{ n: 2, total: 4 }}
                footer={
                    <>
                        <Button type="button" variant="outline" className="flex-1">
                            뒤로
                        </Button>
                        <Button type="button" className="flex-1">
                            다음
                        </Button>
                    </>
                }
            >
                <MemoBody />
            </SpikeShell>
        );
    }
    return (
        <SpikeShell
            separator={separator}
            stepStyle={stepStyle}
            density={density}
            title="저장 완료"
        >
            <SuccessBody />
        </SpikeShell>
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
    const [separator, setSeparator] = useState<Separator>('hairline-inset');
    const [stepStyle, setStepStyle] = useState<StepStyle>('dots');
    const [density, setDensity] = useState<Density>('default');
    const [shape, setShape] = useState<Shape>('memo');

    return (
        <div style={{ font: '13px/1.5 system-ui', padding: 20 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
                <Knob label="구분">
                    {(['divider-full', 'spacing', 'hairline-inset'] as const).map((s) => (
                        <button key={s} style={chip(separator === s)} onClick={() => setSeparator(s)}>
                            {SEP_LABEL[s]}
                        </button>
                    ))}
                </Knob>
                <Knob label="진행 단계">
                    {(['text', 'dots', 'bar'] as const).map((s) => (
                        <button key={s} style={chip(stepStyle === s)} onClick={() => setStepStyle(s)}>
                            {STEP_LABEL[s]}
                        </button>
                    ))}
                </Knob>
                <Knob label="밀도">
                    {(['compact', 'default', 'roomy'] as const).map((d) => (
                        <button key={d} style={chip(density === d)} onClick={() => setDensity(d)}>
                            {d}
                        </button>
                    ))}
                </Knob>
                <Knob label="프레임 형태">
                    {(['timer', 'memo', 'success'] as const).map((s) => (
                        <button key={s} style={chip(shape === s)} onClick={() => setShape(s)}>
                            {s}
                        </button>
                    ))}
                </Knob>
            </div>

            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <figure style={{ margin: 0 }}>
                    <figcaption style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>
                        현재 (실 PanelShell)
                    </figcaption>
                    {currentShell(shape)}
                </figure>
                <figure style={{ margin: 0 }}>
                    <figcaption style={{ color: '#5B5BD6', fontSize: 12, marginBottom: 8 }}>
                        재설계안 — {SEP_LABEL[separator]} · {STEP_LABEL[stepStyle]} · {density}
                    </figcaption>
                    {proposedShell(shape, separator, stepStyle, density)}
                </figure>
            </div>

            <p style={{ color: '#888', fontSize: 12, marginTop: 24, maxWidth: 520 }}>
                흰 배경 = SWEA 문제 페이지 맥락. 조합 정하면 Claude에게 "구분 C · 도트 · default" 식으로
                알려주면 ui-design.md 확정 → tdd. (이 스토리는 확정 후 삭제)
            </p>
        </div>
    );
}

function Knob({ label, children }: { label: string; children: ReactNode }) {
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
    title: 'Foundations/R0 프레임 스파이크',
    component: Spike,
    parameters: { layout: 'fullscreen', a11y: { test: 'off' }, backgrounds: { value: 'swea' } },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const 프레임_비교: Story = {};
