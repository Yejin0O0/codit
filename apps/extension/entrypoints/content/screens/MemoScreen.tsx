import type { Ref } from 'react';

import { PanelShell } from '@/components/codit/panel-shell';
import { ResultBadge } from '@/components/codit/result-badge';
import { Button } from '@/components/ui/button';

import { MemoField } from '../components/MemoField';
import type { ResultType } from '../screens';
import type { WidgetDragHandlers } from '../useWidgetPosition';

interface MemoScreenProps {
    result: ResultType;
    step: string;
    memo: string;
    onMemoChange: (value: string) => void;
    memoOpen: boolean;
    onMemoOpenChange: (open: boolean) => void;
    onBack: () => void;
    onNext: () => void;
    onCollapse?: () => void;
    collapseControlRef?: Ref<HTMLButtonElement>;
    dragHandlers?: WidgetDragHandlers;
}

export function MemoScreen({
    result,
    step,
    memo,
    onMemoChange,
    memoOpen,
    onMemoOpenChange,
    onBack,
    onNext,
    onCollapse,
    collapseControlRef,
    dragHandlers,
}: MemoScreenProps) {
    return (
        <PanelShell
            title="메모"
            step={step}
            onCollapse={onCollapse}
            collapseControlRef={collapseControlRef}
            dragHandlers={dragHandlers}
            footer={
                <>
                    <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
                        뒤로
                    </Button>
                    <Button type="button" className="flex-1" onClick={onNext}>
                        다음
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-4">
                <ResultBadge result={result} className="w-fit" />

                <MemoField
                    result={result}
                    value={memo}
                    onChange={onMemoChange}
                    open={memoOpen}
                    onOpenChange={onMemoOpenChange}
                />
            </div>
        </PanelShell>
    );
}
