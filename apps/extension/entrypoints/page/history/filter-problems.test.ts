import { filterProblems } from './filter-problems';
import { PROBLEM_CORRECT, PROBLEM_HOLD, PROBLEM_WRONG, PROBLEMS_FX } from './test-fixtures';

describe('filterProblems', () => {
    it('result가 ALL이고 tagIds가 비면 모든 problem을 반환한다', () => {
        expect(filterProblems(PROBLEMS_FX, { result: 'ALL', tagIds: [] })).toEqual(PROBLEMS_FX);
    });

    it('latestResult가 선택한 result와 같은 problem만 남긴다', () => {
        expect(filterProblems(PROBLEMS_FX, { result: 'WRONG', tagIds: [] })).toEqual([
            PROBLEM_WRONG,
        ]);
        expect(filterProblems(PROBLEMS_FX, { result: 'HOLD', tagIds: [] })).toEqual([PROBLEM_HOLD]);
    });

    it('선택한 tag 중 하나라도 problem의 union tagIds에 있으면 남긴다(OR)', () => {
        // bfs → PROBLEM_WRONG, dp → PROBLEM_CORRECT
        expect(filterProblems(PROBLEMS_FX, { result: 'ALL', tagIds: ['bfs', 'dp'] })).toEqual([
            PROBLEM_WRONG,
            PROBLEM_CORRECT,
        ]);
    });

    it('result 필터와 tag 필터를 AND로 결합한다', () => {
        expect(filterProblems(PROBLEMS_FX, { result: 'WRONG', tagIds: ['bfs'] })).toEqual([
            PROBLEM_WRONG,
        ]);
        // CORRECT + bfs → PROBLEM_CORRECT 는 bfs 없음 → []
        expect(filterProblems(PROBLEMS_FX, { result: 'CORRECT', tagIds: ['bfs'] })).toEqual([]);
    });

    it('입력이 비면 []을, 모든 problem이 매칭되면 전체 목록을 반환한다', () => {
        expect(filterProblems([], { result: 'ALL', tagIds: [] })).toEqual([]);
        expect(filterProblems(PROBLEMS_FX, { result: 'ALL', tagIds: [] })).toEqual(PROBLEMS_FX);
    });

    it('선택한 tag가 아무것도 매칭하지 않으면 []을, 매칭하면 해당 problem을 반환한다', () => {
        expect(filterProblems(PROBLEMS_FX, { result: 'ALL', tagIds: ['nope'] })).toEqual([]);
        expect(filterProblems(PROBLEMS_FX, { result: 'ALL', tagIds: ['bfs'] })).toEqual([
            PROBLEM_WRONG,
        ]);
    });

    it('입력 배열을 변경하지 않는다', () => {
        const input = [...PROBLEMS_FX];
        const out = filterProblems(input, { result: 'CORRECT', tagIds: [] });
        expect(out).toEqual([PROBLEM_CORRECT]);
        expect(input).toEqual(PROBLEMS_FX);
    });
});
