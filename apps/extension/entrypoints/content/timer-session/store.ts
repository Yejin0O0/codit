import { createKeyedStore } from '@/lib/keyed-storage';

import { TIMER_SESSION_VERSION, type TimerSession } from './types';

const timerSessionStore = createKeyedStore<TimerSession>('timer-session', '타이머 세션');

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
    const raw = await timerSessionStore.read(problemId);
    if (isValidTimerSession(raw, Date.now())) {
        return raw;
    }
    return null;
}

export const writeTimerSession = timerSessionStore.write;
export const removeTimerSession = timerSessionStore.remove;

/**
 * 같은 problemId 에 대한 read-then-write 를 탭 간 직렬화한다.
 * Web Locks 는 same-origin(SWEA 페이지) 전역이라 두 탭이 동시에 "세션 없음" 을
 * 읽고 각자 다른 startedAt 으로 새 세션을 만드는 레이스를 막는다.
 * navigator.locks 미지원 환경에서는 fn 을 그대로 실행한다(fail-soft).
 */
export async function withProblemLock<T>(problemId: string, fn: () => Promise<T>): Promise<T> {
    const { locks } = navigator;
    if (!locks) {
        return fn();
    }
    return locks.request(`codit:timer-session:${problemId}`, fn);
}
