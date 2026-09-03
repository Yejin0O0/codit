import { ResultBadge } from '@/components/codit/result-badge';
import { TagChipList } from '@/components/codit/tag-chip-list';

import type { ProblemHistoryDetail, TagOption } from './types';

interface ProblemSummaryProps {
    detail: Pick<
        ProblemHistoryDetail,
        'problemId' | 'title' | 'latestResult' | 'attemptCount' | 'tagIds'
    >;
    tagCatalog: TagOption[];
}

export function ProblemSummary({ detail, tagCatalog }: ProblemSummaryProps) {
    return (
        <div className="flex flex-col gap-2">
            <p className="text-lg font-semibold">문제 #{detail.problemId}</p>
            {detail.title ? <p className="text-sm">{detail.title}</p> : null}

            <div className="flex items-center gap-3 text-sm">
                <ResultBadge result={detail.latestResult} />
                <span className="text-muted-foreground">총 풀이 횟수 {detail.attemptCount}회</span>
            </div>

            <TagChipList tagIds={detail.tagIds} catalog={tagCatalog} />
        </div>
    );
}
