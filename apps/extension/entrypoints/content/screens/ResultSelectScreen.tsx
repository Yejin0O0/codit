import type { Ref } from 'react';

import { PanelShell } from '@/components/codit/panel-shell';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/format-duration';

import { ResultToggleGroup } from '../components/ResultToggleGroup';
import type { ResultType } from '../screens';

interface ResultSelectScreenProps {
    elapsedSeconds: number;
    value: ResultType | null;
    onChange: (value: ResultType) => void;
    onNext: () => void;
    onCollapse?: () => void;
    collapseControlRef?: Ref<HTMLButtonElement>;
}

export function ResultSelectScreen({
    elapsedSeconds,
    value,
    onChange,
    onNext,
    onCollapse,
    collapseControlRef,
}: ResultSelectScreenProps) {
    return (
        <PanelShell
            title="결과 선택"
            onCollapse={onCollapse}
            collapseControlRef={collapseControlRef}
            footer={
                <Button type="button" className="w-full" disabled={value === null} onClick={onNext}>
                    다음
                </Button>
            }
        >
            <div className="flex flex-col gap-4">
                <p className="text-muted-foreground text-sm">
                    <span className="text-foreground font-semibold tabular-nums">
                        {formatDuration(elapsedSeconds)}
                    </span>{' '}
                    만에 풀이했어요.
                </p>
                <ResultToggleGroup value={value} onChange={onChange} />
            </div>
        </PanelShell>
    );
}
