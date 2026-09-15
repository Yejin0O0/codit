import { useState } from 'react';

import { cn } from '@/lib/utils';

import { AttemptItem } from './attempt-item';
import type { AttemptResult, ProblemAttempt, TagOption } from './types';

interface AttemptTimelineProps {
    attempts: ProblemAttempt[];
    tagCatalog: TagOption[];
}

// ResultBadge와 같은 톤(success/destructive/warning) — 회차 목록에서 결과를 점 하나로 스캔.
const DOT_CLASS: Record<AttemptResult, string> = {
    CORRECT: 'bg-success',
    WRONG: 'bg-destructive',
    HOLD: 'bg-warning',
};

/**
 * [UI-L2 R10] 좌우 분할(Option 5, 이슈 #102) — 왼쪽 회차 목록에서 고르면
 * 오른쪽에 그 회차의 전체 상세(AttemptItem)를 보여준다. 기본 선택 = 최신 회차.
 */
export function AttemptTimeline({ attempts, tagCatalog }: AttemptTimelineProps) {
    const ordered = [...attempts].sort((a, b) => b.seq - a.seq);
    const [selectedSeq, setSelectedSeq] = useState(ordered[0]?.seq);
    const selected = ordered.find((a) => a.seq === selectedSeq) ?? ordered[0];

    if (!selected) {
        return null;
    }

    if (ordered.length === 1) {
        return <AttemptItem attempt={selected} tagCatalog={tagCatalog} />;
    }

    return (
        <div className="flex gap-4">
            <div role="group" aria-label="회차 목록" className="flex w-24 shrink-0 flex-col gap-1">
                {ordered.map((attempt) => {
                    const isSelected = attempt.seq === selected.seq;
                    return (
                        <button
                            key={attempt.seq}
                            type="button"
                            aria-current={isSelected ? 'true' : undefined}
                            onClick={() => setSelectedSeq(attempt.seq)}
                            className={cn(
                                'flex items-center justify-between rounded-md border px-2 py-1.5 text-xs',
                                isSelected
                                    ? 'border-primary bg-accent'
                                    : 'hover:bg-muted border-transparent',
                            )}
                        >
                            <span>{attempt.seq}회차</span>
                            <span
                                className={cn('size-1.5 rounded-full', DOT_CLASS[attempt.result])}
                                aria-hidden="true"
                            />
                        </button>
                    );
                })}
            </div>
            <div className="min-w-0 flex-1 border-l pl-4">
                <AttemptItem attempt={selected} tagCatalog={tagCatalog} />
            </div>
        </div>
    );
}
