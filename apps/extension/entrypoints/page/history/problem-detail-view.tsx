import { Button } from '@/components/ui/button';

import { AttemptTimeline } from './attempt-timeline';
import { EmptyState } from './empty-state';
import { ProblemSummary } from './problem-summary';
import { DetailSkeleton } from './skeletons';
import type { ProblemHistoryDetail, TagOption } from './types';
import { useProblemDetail } from './use-problem-detail';

interface ProblemDetailViewProps {
    problemId: string;
    tagCatalog: TagOption[];
    resolveDetail?: (problemId: string) => ProblemHistoryDetail | null;
    loadDelayMs?: number;
    onBack: () => void;
}

export function ProblemDetailView({
    problemId,
    tagCatalog,
    resolveDetail,
    loadDelayMs,
    onBack,
}: ProblemDetailViewProps) {
    const { status, detail } = useProblemDetail(problemId, { resolveDetail, loadDelayMs });

    const backLink = (
        <Button type="button" variant="ghost" className="w-fit" onClick={onBack}>
            ← 목록으로
        </Button>
    );

    return (
        <div className="flex flex-col gap-3">
            {backLink}

            {status === 'loading' ? (
                <DetailSkeleton />
            ) : detail === null ? (
                <EmptyState variant="not-found" action={{ label: '목록으로', onClick: onBack }} />
            ) : (
                <>
                    <ProblemSummary detail={detail} tagCatalog={tagCatalog} />
                    <AttemptTimeline attempts={detail.attempts} tagCatalog={tagCatalog} />
                </>
            )}
        </div>
    );
}
