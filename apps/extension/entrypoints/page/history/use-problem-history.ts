import { useEffect, useState } from 'react';

import { MOCK_LOAD_DELAY_MS, MOCK_PROBLEMS } from './mock-data';
import type { ProblemHistoryListItem } from './types';

type LoadStatus = 'loading' | 'ready';

interface UseProblemHistoryOptions {
    problems?: ProblemHistoryListItem[];
    loadDelayMs?: number;
}

export function useProblemHistory(options?: UseProblemHistoryOptions): {
    status: LoadStatus;
    problems: ProblemHistoryListItem[];
} {
    const problems = options?.problems ?? MOCK_PROBLEMS;
    const delay = options?.loadDelayMs ?? MOCK_LOAD_DELAY_MS;

    const [status, setStatus] = useState<LoadStatus>('loading');

    useEffect(() => {
        const id = setTimeout(() => setStatus('ready'), delay);

        return () => clearTimeout(id);
    }, [delay]);

    return { status, problems };
}
