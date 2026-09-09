import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// UI-local union — history/types.ts 를 import 하지 않는다 (역방향 의존 금지).
type ResultBadgeResult = 'CORRECT' | 'WRONG' | 'HOLD';

interface ResultBadgeProps {
    result: ResultBadgeResult;
    className?: string;
}

const LABELS: Record<ResultBadgeResult, string> = {
    CORRECT: '정답',
    WRONG: '오답',
    HOLD: '보류',
};

const TONE: Record<ResultBadgeResult, string> = {
    CORRECT: 'border-success bg-success text-success-foreground',
    WRONG: 'border-destructive bg-destructive text-destructive-foreground',
    HOLD: 'border-warning bg-warning text-warning-foreground',
};

export function ResultBadge({ result, className }: ResultBadgeProps) {
    return <Badge className={cn(TONE[result], className)}>{LABELS[result]}</Badge>;
}
