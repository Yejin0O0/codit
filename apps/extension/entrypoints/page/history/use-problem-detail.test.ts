import { act, renderHook } from '@testing-library/react';

import { DETAIL_1859 } from './test-fixtures';
import { useProblemDetail } from './use-problem-detail';

describe('useProblemDetail', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('should resolve the detail for a known problemId via the injected resolver once ready', () => {
        const resolveDetail = vi.fn(() => DETAIL_1859);
        const { result } = renderHook(() =>
            useProblemDetail('1859', { resolveDetail, loadDelayMs: 10 }),
        );

        act(() => {
            vi.advanceTimersByTime(50);
        });

        expect(result.current.status).toBe('ready');
        expect(result.current.detail).toEqual(DETAIL_1859);
    });
});
