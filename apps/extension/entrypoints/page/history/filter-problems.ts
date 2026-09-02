import type { ProblemHistoryListItem, ResultFilter } from './types';

export function filterProblems(
    problems: ProblemHistoryListItem[],
    filters: { result: ResultFilter; tagIds: string[] },
): ProblemHistoryListItem[] {
    return problems.filter((problem) => {
        const resultMatch = filters.result === 'ALL' || problem.latestResult === filters.result;
        const tagMatch =
            filters.tagIds.length === 0 ||
            filters.tagIds.some((tagId) => problem.tagIds.includes(tagId));

        return resultMatch && tagMatch;
    });
}
