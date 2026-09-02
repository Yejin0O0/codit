import { filterProblems } from './filter-problems';
import { PROBLEM_CORRECT, PROBLEM_HOLD, PROBLEM_WRONG, PROBLEMS_FX } from './test-fixtures';

describe('filterProblems', () => {
    it('should return all problems when result is ALL and tagIds is empty', () => {
        expect(filterProblems(PROBLEMS_FX, { result: 'ALL', tagIds: [] })).toEqual(PROBLEMS_FX);
    });

    it('should keep only problems whose latestResult equals the selected result', () => {
        expect(filterProblems(PROBLEMS_FX, { result: 'WRONG', tagIds: [] })).toEqual([
            PROBLEM_WRONG,
        ]);
        expect(filterProblems(PROBLEMS_FX, { result: 'HOLD', tagIds: [] })).toEqual([PROBLEM_HOLD]);
    });

    it('should keep a problem when any selected tag is in its union tagIds (OR)', () => {
        // bfs → PROBLEM_WRONG, dp → PROBLEM_CORRECT
        expect(filterProblems(PROBLEMS_FX, { result: 'ALL', tagIds: ['bfs', 'dp'] })).toEqual([
            PROBLEM_WRONG,
            PROBLEM_CORRECT,
        ]);
    });

    it('should combine result and tag filters with AND', () => {
        expect(filterProblems(PROBLEMS_FX, { result: 'WRONG', tagIds: ['bfs'] })).toEqual([
            PROBLEM_WRONG,
        ]);
        // CORRECT + bfs → PROBLEM_CORRECT 는 bfs 없음 → []
        expect(filterProblems(PROBLEMS_FX, { result: 'CORRECT', tagIds: ['bfs'] })).toEqual([]);
    });

    it('should return [] for empty input and the full list when every problem matches', () => {
        expect(filterProblems([], { result: 'ALL', tagIds: [] })).toEqual([]);
        expect(filterProblems(PROBLEMS_FX, { result: 'ALL', tagIds: [] })).toEqual(PROBLEMS_FX);
    });

    it('should return [] when a selected tag matches nothing and the match when it does', () => {
        expect(filterProblems(PROBLEMS_FX, { result: 'ALL', tagIds: ['nope'] })).toEqual([]);
        expect(filterProblems(PROBLEMS_FX, { result: 'ALL', tagIds: ['bfs'] })).toEqual([
            PROBLEM_WRONG,
        ]);
    });

    it('should not mutate the input array', () => {
        const input = [...PROBLEMS_FX];
        const out = filterProblems(input, { result: 'CORRECT', tagIds: [] });
        expect(out).toEqual([PROBLEM_CORRECT]);
        expect(input).toEqual(PROBLEMS_FX);
    });
});
