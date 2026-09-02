import { useEffect, useState } from 'react';

import { MOCK_LOAD_DELAY_MS, resolveMockDetail } from './mock-data';
import type { ProblemHistoryDetail } from './types';

type LoadStatus = 'loading' | 'ready';

interface UseProblemDetailOptions {
    resolveDetail?: (problemId: string) => ProblemHistoryDetail | null;
    loadDelayMs?: number;
}

export function useProblemDetail(
    problemId: string,
    options?: UseProblemDetailOptions,
): {
    status: LoadStatus;
    detail: ProblemHistoryDetail | null;
} {
    const resolve = options?.resolveDetail ?? resolveMockDetail;
    const delay = options?.loadDelayMs ?? MOCK_LOAD_DELAY_MS;

    const [state, setState] = useState<{ status: LoadStatus; detail: ProblemHistoryDetail | null }>(
        { status: 'loading', detail: null },
    );

    useEffect(() => {
        const id = setTimeout(() => {
            setState({ status: 'ready', detail: resolve(problemId) });
        }, delay);

        return () => clearTimeout(id);
    }, [problemId, delay, resolve]);

    return state;
}
