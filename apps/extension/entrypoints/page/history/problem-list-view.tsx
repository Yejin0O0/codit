import { Button } from '@/components/ui/button';

import { EmptyState } from './empty-state';
import { filterProblems } from './filter-problems';
import { ProblemCard } from './problem-card';
import { ResultFilterToggleGroup } from './result-filter-toggle-group';
import { ListSkeleton } from './skeletons';
import { TagFilterPanel } from './tag-filter-panel';
import type { ProblemHistoryListItem, ResultFilter, TagCategory, TagOption } from './types';

interface ProblemListViewProps {
    status: 'loading' | 'ready';
    problems: ProblemHistoryListItem[];
    resultFilter: ResultFilter;
    selectedTagIds: string[];
    coreTags: TagOption[];
    categories: TagCategory[];
    tagCatalog: TagOption[];
    onResultFilterChange: (next: ResultFilter) => void;
    onSelectedTagIdsChange: (next: string[]) => void;
    onClearFilters: () => void;
    onSelectProblem: (problemId: string) => void;
}

export function ProblemListView({
    status,
    problems,
    resultFilter,
    selectedTagIds,
    coreTags,
    categories,
    tagCatalog,
    onResultFilterChange,
    onSelectedTagIdsChange,
    onClearFilters,
    onSelectProblem,
}: ProblemListViewProps) {
    const filtered = filterProblems(problems, {
        result: resultFilter,
        tagIds: selectedTagIds,
    });
    const filtersActive = resultFilter !== 'ALL' || selectedTagIds.length > 0;
    const isFilteredEmpty = status === 'ready' && problems.length > 0 && filtered.length === 0;

    return (
        <div className="flex flex-col gap-4">
            <p className="text-lg font-semibold">내 문제풀이</p>

            <ResultFilterToggleGroup value={resultFilter} onChange={onResultFilterChange} />
            <TagFilterPanel
                coreTags={coreTags}
                categories={categories}
                selectedTagIds={selectedTagIds}
                onSelectedTagIdsChange={onSelectedTagIdsChange}
            />

            {filtersActive && !isFilteredEmpty ? (
                <Button type="button" variant="ghost" className="w-fit" onClick={onClearFilters}>
                    필터 해제
                </Button>
            ) : null}

            {status === 'loading' ? (
                <ListSkeleton />
            ) : problems.length === 0 ? (
                <EmptyState variant="empty" />
            ) : filtered.length === 0 ? (
                <EmptyState
                    variant="filtered-empty"
                    action={{ label: '필터 해제', onClick: onClearFilters }}
                />
            ) : (
                <div className="flex flex-col gap-2">
                    {filtered.map((problem) => (
                        <ProblemCard
                            key={problem.problemId}
                            problem={problem}
                            tagCatalog={tagCatalog}
                            onSelect={() => onSelectProblem(problem.problemId)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
