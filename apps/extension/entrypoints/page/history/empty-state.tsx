import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    variant: 'empty' | 'filtered-empty' | 'not-found';
    action?: { label: string; onClick: () => void };
}

const MESSAGE: Record<EmptyStateProps['variant'], { title: string; hint?: string }> = {
    empty: {
        title: '아직 기록된 문제풀이가 없어요',
        hint: 'SWEA에서 문제를 풀면 여기에 기록이 쌓여요',
    },
    'filtered-empty': { title: '조건에 맞는 문제가 없어요' },
    'not-found': { title: '이 문제의 풀이 기록을 찾을 수 없어요' },
};

export function EmptyState({ variant, action }: EmptyStateProps) {
    const { title, hint } = MESSAGE[variant];

    return (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center text-sm">
            <p>{title}</p>
            {hint ? <p className="text-xs">{hint}</p> : null}
            {action ? (
                <Button type="button" variant="ghost" onClick={action.onClick}>
                    {action.label}
                </Button>
            ) : null}
        </div>
    );
}
