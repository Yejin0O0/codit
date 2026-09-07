import { TIMER_SESSION_VERSION, type TimerSession } from './types';

export function deriveInitialState(
    problemId: string,
    stored: TimerSession | null,
    now: number,
): TimerSession {
    if (stored) {
        return stored;
    }

    return {
        version: TIMER_SESSION_VERSION,
        problemId,
        startedAt: now,
        status: 'running',
        stoppedAt: null,
    };
}

export function markCompleted(session: TimerSession, now: number): TimerSession {
    return { ...session, status: 'stopped', stoppedAt: now };
}
