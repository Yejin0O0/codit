import { act, renderHook } from '@testing-library/react';

import { MOCK_PROBLEMS } from './mock-data';
import { PROBLEM_CORRECT } from './test-fixtures';
import { useProblemHistory } from './use-problem-history';

describe('useProblemHistory', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('should move from loading to ready and expose the injected problems', () => {
        const { result } = renderHook(() =>
            useProblemHistory({ problems: [PROBLEM_CORRECT], loadDelayMs: 10 }),
        );

        act(() => {
            vi.advanceTimersByTime(50);
        });

        expect(result.current.status).toBe('ready');
        expect(result.current.problems).toEqual([PROBLEM_CORRECT]);
    });

    it('should default to MOCK_PROBLEMS once ready when no problems option is given', () => {
        const { result } = renderHook(() => useProblemHistory({ loadDelayMs: 10 }));

        act(() => {
            vi.advanceTimersByTime(50);
        });

        expect(result.current.status).toBe('ready');
        expect(result.current.problems).toBe(MOCK_PROBLEMS);
    });

    it('should reach ready with an empty array when injected problems is []', () => {
        const { result } = renderHook(() => useProblemHistory({ problems: [], loadDelayMs: 10 }));

        act(() => {
            vi.advanceTimersByTime(50);
        });

        expect(result.current.status).toBe('ready');
        expect(result.current.problems).toEqual([]);
    });
});
