import { useState } from 'react';

import { CORE_TAGS, TAG_CATALOG, TAG_CATEGORIES } from './mock-data';
import { ProblemDetailView } from './problem-detail-view';
import { ProblemListView } from './problem-list-view';
import type { ProblemHistoryDetail, ProblemHistoryListItem, ResultFilter } from './types';
import { useProblemHistory } from './use-problem-history';

interface HistoryViewProps {
    problems?: ProblemHistoryListItem[];
    resolveDetail?: (problemId: string) => ProblemHistoryDetail | null;
    loadDelayMs?: number;
}

export function HistoryView({ problems, resolveDetail, loadDelayMs }: HistoryViewProps = {}) {
    const { status, problems: loaded } = useProblemHistory({ problems, loadDelayMs });

    const [view, setView] = useState<'list' | 'detail'>('list');
    const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
    const [resultFilter, setResultFilter] = useState<ResultFilter>('ALL');
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

    return (
        <section aria-label="내 문제풀이" className="flex flex-col gap-4">
            {view === 'detail' && selectedProblemId !== null ? (
                <ProblemDetailView
                    problemId={selectedProblemId}
                    tagCatalog={TAG_CATALOG}
                    resolveDetail={resolveDetail}
                    loadDelayMs={loadDelayMs}
                    onBack={() => setView('list')}
                />
            ) : (
                <ProblemListView
                    status={status}
                    problems={loaded}
                    resultFilter={resultFilter}
                    selectedTagIds={selectedTagIds}
                    coreTags={CORE_TAGS}
                    categories={TAG_CATEGORIES}
                    tagCatalog={TAG_CATALOG}
                    onResultFilterChange={setResultFilter}
                    onSelectedTagIdsChange={setSelectedTagIds}
                    onClearFilters={() => {
                        setResultFilter('ALL');
                        setSelectedTagIds([]);
                    }}
                    onSelectProblem={(id) => {
                        setSelectedProblemId(id);
                        setView('detail');
                    }}
                />
            )}
        </section>
    );
}
