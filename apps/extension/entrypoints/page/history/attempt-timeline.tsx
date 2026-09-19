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
 * 좌우 분할 — 왼쪽 회차 목록에서 고르면 오른쪽에 선택된 회차의 AttemptItem 전체 상세를 보여준다.
 * 기본 선택 = 최신 회차. 회차 1개면 목록 없이 AttemptItem 단독 표시.
 */
export function AttemptTimeline({ attempts, tagCatalog }: AttemptTimelineProps) {
    const ordered = [...attempts].sort((a, b) => b.seq - a.seq);
    const latestSeq = ordered[0]?.seq;
    const [selectedSeq, setSelectedSeq] = useState(latestSeq);

    // attempts prop이 갱신돼도 컴포넌트가 리마운트되지 않는 경로(폴링/낙관적 업데이트)에서
    // "기본 선택 = 최신 회차"가 깨지지 않도록, 최신 seq가 바뀌면 렌더 중에 선택을 다시 맞춘다
    // (effect가 아니라 렌더 중 state 조정 — react-hooks/set-state-in-effect 회피).
    const [trackedLatestSeq, setTrackedLatestSeq] = useState(latestSeq);
    if (latestSeq !== trackedLatestSeq) {
        setTrackedLatestSeq(latestSeq);
        setSelectedSeq(latestSeq);
    }

    const selected = ordered.find((a) => a.seq === selectedSeq) ?? ordered[0];

    if (!selected) {
        return null;
    }

    if (ordered.length === 1) {
        return (
            <div className="flex flex-col">
                <AttemptItem attempt={selected} tagCatalog={tagCatalog} />
            </div>
        );
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
