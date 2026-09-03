import { PanelShell } from '@/components/codit/panel-shell';
import { TimerDisplay } from '@/components/codit/timer-display';
import { Button } from '@/components/ui/button';

interface TimerScreenProps {
    problemId: string;
    elapsedSeconds: number;
    onComplete: () => void;
}

export function TimerScreen({ problemId, elapsedSeconds, onComplete }: TimerScreenProps) {
    return (
        <PanelShell
            title="풀이 타이머"
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
