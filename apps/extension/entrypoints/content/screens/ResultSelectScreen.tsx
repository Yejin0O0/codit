import type { Ref } from 'react';

import { PanelShell } from '@/components/codit/panel-shell';
import { TimerDisplay } from '@/components/codit/timer-display';
import { Button } from '@/components/ui/button';

import { ResultToggleGroup } from '../components/ResultToggleGroup';
import type { ResultType } from '../screens';
import type { WidgetDragHandlers } from '../useWidgetPosition';

interface ResultSelectScreenProps {
    elapsedSeconds: number;
    value: ResultType | null;
    onChange: (value: ResultType) => void;
    onNext: () => void;
    onCollapse?: () => void;
    collapseControlRef?: Ref<HTMLButtonElement>;
    dragHandlers?: WidgetDragHandlers;
}

export function ResultSelectScreen({
    elapsedSeconds,
    value,
    onChange,
    onNext,
    onCollapse,
    collapseControlRef,
    dragHandlers,
}: ResultSelectScreenProps) {
    return (
        <PanelShell
            title="결과 선택"
            onCollapse={onCollapse}
            collapseControlRef={collapseControlRef}
            dragHandlers={dragHandlers}
            footer={
                <Button type="button" className="w-full" disabled={value === null} onClick={onNext}>
                    다음
                </Button>
            }
        >
            <div className="flex flex-col items-center gap-4">
                <TimerDisplay seconds={elapsedSeconds} caption="풀이 시간" />
                <ResultToggleGroup value={value} onChange={onChange} />
            </div>
        </PanelShell>
    );
}
