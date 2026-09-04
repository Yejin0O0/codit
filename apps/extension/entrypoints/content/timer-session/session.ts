import type { TimerSession } from './types';

export function deriveInitialState(
    _problemId: string,
    _stored: TimerSession | null,
    _now: number,
): TimerSession {
    return {
        version: 1,
        problemId: '',
        startedAt: 0,
        status: 'running',
        stoppedAt: null,
    };
}

export function markCompleted(session: TimerSession, _now: number): TimerSession {
    return session;
}
