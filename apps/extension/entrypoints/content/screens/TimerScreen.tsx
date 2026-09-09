import type { Ref } from 'react';

import { PanelShell } from '@/components/codit/panel-shell';
import { TimerDisplay } from '@/components/codit/timer-display';
import { Button } from '@/components/ui/button';

import type { WidgetDragHandlers } from '../useWidgetPosition';

interface TimerScreenProps {
    problemId: string;
    problemTitle?: string | null;
    elapsedSeconds: number;
    onComplete: () => void;
    onCollapse?: () => void;
    collapseControlRef?: Ref<HTMLButtonElement>;
    dragHandlers?: WidgetDragHandlers;
}

/** 제목이 있으면 제목만, 없으면 problemId 로 폴백한다. */
function problemLabel(problemId: string, problemTitle?: string | null): string {
    if (problemTitle) {
        return problemTitle;
    }
    return `문제 #${problemId}`;
}

export function TimerScreen({
    problemId,
    problemTitle,
    elapsedSeconds,
    onComplete,
    onCollapse,
    collapseControlRef,
    dragHandlers,
}: TimerScreenProps) {
    return (
        <PanelShell
            title={problemLabel(problemId, problemTitle)}
            onCollapse={onCollapse}
            collapseControlRef={collapseControlRef}
            dragHandlers={dragHandlers}
            footer={
                <Button type="button" className="w-full" onClick={onComplete}>
                    완료
                </Button>
            }
        >
            <div className="flex flex-col items-center gap-3">
                <TimerDisplay seconds={elapsedSeconds} caption="측정 중" running />
            </div>
        </PanelShell>
    );
}
