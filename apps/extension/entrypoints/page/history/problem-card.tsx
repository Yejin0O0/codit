import { ResultBadge } from '@/components/codit/result-badge';
import { TagChipList } from '@/components/codit/tag-chip-list';
import { Card } from '@/components/ui/card';
import { formatDuration } from '@/lib/format-duration';

import type { ProblemHistoryListItem, TagOption } from './types';

interface ProblemCardProps {
    problem: ProblemHistoryListItem;
    tagCatalog: TagOption[];
    onSelect: () => void;
}

export function ProblemCard({ problem, tagCatalog, onSelect }: ProblemCardProps) {
    return (
        <button type="button" onClick={onSelect} className="w-full text-left">
            <Card className="hover:border-ring gap-2 p-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">#{problem.problemId}</span>
                    <ResultBadge result={problem.latestResult} />
                </div>

                {problem.title ? <p className="text-sm">{problem.title}</p> : null}

                <p className="text-muted-foreground text-xs">
                    <span>{`풀이 ${problem.attemptCount}회`}</span>
                    {' · '}
                    <span>{formatDuration(problem.latestDurationSeconds)}</span>
                    {problem.latestSolvedAt ? (
                        <>
                            {' · '}
                            <span>{problem.latestSolvedAt}</span>
                        </>
                    ) : null}
                </p>

                <TagChipList tagIds={problem.tagIds} catalog={tagCatalog} />
            </Card>
        </button>
    );
}
