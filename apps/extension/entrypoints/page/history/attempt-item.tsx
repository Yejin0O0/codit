import { ResultBadge } from '@/components/codit/result-badge';
import { TagChipList } from '@/components/codit/tag-chip-list';
import { formatDuration } from '@/lib/format-duration';

import type { ProblemAttempt, TagOption } from './types';

interface AttemptItemProps {
    attempt: ProblemAttempt;
    tagCatalog: TagOption[];
}

export function AttemptItem({ attempt, tagCatalog }: AttemptItemProps) {
    return (
        <div className="flex flex-col gap-1.5 border-t py-3 first:border-t-0">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{attempt.seq}회차</span>
                <ResultBadge result={attempt.result} />
            </div>

            <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span>{formatDuration(attempt.durationSeconds)}</span>
                {attempt.recordedAt ? <span>{attempt.recordedAt}</span> : null}
            </div>

            <TagChipList tagIds={attempt.tagIds} catalog={tagCatalog} />

            {attempt.memo ? (
                <p className="text-xs">
                    <span className="text-muted-foreground">메모</span> {attempt.memo}
                </p>
            ) : null}
        </div>
    );
}
