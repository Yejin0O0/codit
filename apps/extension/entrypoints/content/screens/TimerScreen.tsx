import type { Ref } from 'react';

import { PanelShell } from '@/components/codit/panel-shell';
import { TimerDisplay } from '@/components/codit/timer-display';
import { Button } from '@/components/ui/button';

import type { WidgetDragHandlers } from '../useWidgetPosition';

interface TimerScreenProps {
    problemId: string;
    elapsedSeconds: number;
    onComplete: () => void;
    onCollapse?: () => void;
    collapseControlRef?: Ref<HTMLButtonElement>;
    dragHandlers?: WidgetDragHandlers;
}

export function TimerScreen({
    problemId,
    elapsedSeconds,
    onComplete,
    onCollapse,
    collapseControlRef,
    dragHandlers,
}: TimerScreenProps) {
    return (
        <PanelShell
            title="풀이 타이머"
            onCollapse={onCollapse}
            collapseControlRef={collapseControlRef}
            dragHandlers={dragHandlers}
            footer={
                <Button type="button" className="w-full" onClick={onComplete}>
                    완료
                </Button>
            }
        >
            <div className="flex flex-col items-center gap-4">
                <span className="text-muted-foreground text-xs font-medium">문제 #{problemId}</span>
                <TimerDisplay seconds={elapsedSeconds} caption="측정 중" />
            </div>
        </PanelShell>
    );
}
