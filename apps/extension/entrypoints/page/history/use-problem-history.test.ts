import { act, renderHook } from '@testing-library/react';

import { MOCK_PROBLEMS } from './mock-data';
import { PROBLEM_CORRECT } from './test-fixtures';
import { useProblemHistory } from './use-problem-history';

describe('useProblemHistory', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('loading에서 ready로 전환하고 주입된 problems를 노출한다', () => {
        const { result } = renderHook(() =>
            useProblemHistory({ problems: [PROBLEM_CORRECT], loadDelayMs: 10 }),
        );

        act(() => {
            vi.advanceTimersByTime(50);
        });

        expect(result.current.status).toBe('ready');
        expect(result.current.problems).toEqual([PROBLEM_CORRECT]);
    });

    it('problems 옵션이 없으면 ready 후 기본값 MOCK_PROBLEMS를 노출한다', () => {
        const { result } = renderHook(() => useProblemHistory({ loadDelayMs: 10 }));

        act(() => {
            vi.advanceTimersByTime(50);
        });

        expect(result.current.status).toBe('ready');
        expect(result.current.problems).toBe(MOCK_PROBLEMS);
    });

    it('주입된 problems가 []이면 빈 배열인 채로 ready에 도달한다', () => {
        const { result } = renderHook(() => useProblemHistory({ problems: [], loadDelayMs: 10 }));

        act(() => {
            vi.advanceTimersByTime(50);
        });

        expect(result.current.status).toBe('ready');
        expect(result.current.problems).toEqual([]);
    });
});
