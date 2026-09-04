import { storage } from 'wxt/utils/storage';

import { TIMER_SESSION_VERSION, type TimerSession } from './types';

function timerSessionKey(problemId: string): `session:timer-session:${string}` {
    return `session:timer-session:${problemId}`;
}

export function isValidTimerSession(value: unknown, now: number): value is TimerSession {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const candidate = value as Record<string, unknown>;

    if (candidate.version !== TIMER_SESSION_VERSION) {
        return false;
    }
    if (typeof candidate.startedAt !== 'number') {
        return false;
    }
    if (candidate.startedAt > now) {
        return false;
    }
    if (candidate.status === 'stopped') {
        if (typeof candidate.stoppedAt !== 'number') {
            return false;
        }
        if (candidate.stoppedAt < candidate.startedAt) {
            return false;
        }
    }

    return true;
}

export async function readTimerSession(problemId: string): Promise<TimerSession | null> {
    try {
        const raw = await storage.getItem(timerSessionKey(problemId));
        if (isValidTimerSession(raw, Date.now())) {
            return raw;
        }
        return null;
    } catch {
        console.warn('[codit] 타이머 세션 읽기에 실패했습니다');
        return null;
    }
}

export async function writeTimerSession(problemId: string, session: TimerSession): Promise<void> {
    try {
        await storage.setItem(timerSessionKey(problemId), session);
    } catch {
        console.warn('[codit] 타이머 세션 저장에 실패했습니다');
    }
}

export async function removeTimerSession(problemId: string): Promise<void> {
    try {
        await storage.removeItem(timerSessionKey(problemId));
    } catch {
        console.warn('[codit] 타이머 세션 삭제에 실패했습니다');
    }
}
