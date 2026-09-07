import { deriveInitialState, markCompleted } from './session';
import { TIMER_SESSION_VERSION, type TimerSession } from './types';

function makeSession(overrides: Partial<TimerSession> = {}): TimerSession {
    return {
        version: TIMER_SESSION_VERSION,
        problemId: 'PROB-1',
        startedAt: 1_000,
        status: 'running',
        stoppedAt: null,
        ...overrides,
    };
}

describe('deriveInitialState', () => {
    it('[정상] stored 있으면 그대로 반환', () => {
        const stored = makeSession({ startedAt: 5_000 });
        expect(deriveInitialState('PROB-1', stored, 9_000)).toEqual(stored);
    });

    it('[정상] stored 없으면 새 세션(running, stoppedAt null, startedAt now) 생성', () => {
        const result = deriveInitialState('PROB-1', null, 9_000);

        expect(result).toEqual({
            version: TIMER_SESSION_VERSION,
            problemId: 'PROB-1',
            startedAt: 9_000,
            status: 'running',
            stoppedAt: null,
        });
    });
});

describe('markCompleted', () => {
    it('[정상] status: stopped, stoppedAt: now 로 갱신하고, 원본 세션은 변경하지 않는다(순수 함수)', () => {
        const session = makeSession({ problemId: 'PROB-1', startedAt: 1_000 });
        const before = { ...session };

        const result = markCompleted(session, 8_000);

        expect(result).toEqual({
            version: TIMER_SESSION_VERSION,
            problemId: 'PROB-1',
            startedAt: 1_000,
            status: 'stopped',
            stoppedAt: 8_000,
        });
        expect(session).toEqual(before);
    });
});
