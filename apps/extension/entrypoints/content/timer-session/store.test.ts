import { storage } from 'wxt/utils/storage';

import {
    isValidTimerSession,
    readTimerSession,
    removeTimerSession,
    writeTimerSession,
} from './store';
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

describe('isValidTimerSession', () => {
    it('[정상] 정상 TimerSession 객체는 유효하다', () => {
        expect(isValidTimerSession(makeSession(), 2_000)).toBe(true);
    });

    it('[경계] stoppedAt === startedAt(0초 경과)은 유효하다', () => {
        const session = makeSession({ status: 'stopped', stoppedAt: 1_000 });
        expect(isValidTimerSession(session, 2_000)).toBe(true);
    });

    it('[예외] version 불일치는 무효', () => {
        const session = { ...makeSession(), version: 999 };
        expect(isValidTimerSession(session, 2_000)).toBe(false);
    });

    it('[예외] startedAt 이 now 보다 미래면 무효', () => {
        const session = makeSession({ startedAt: 5_000 });
        expect(isValidTimerSession(session, 2_000)).toBe(false);
    });

    it('[예외] stoppedAt < startedAt 이면 무효', () => {
        const session = makeSession({ status: 'stopped', startedAt: 2_000, stoppedAt: 1_000 });
        expect(isValidTimerSession(session, 3_000)).toBe(false);
    });
});

describe('readTimerSession / writeTimerSession / removeTimerSession', () => {
    it('[정상] writeTimerSession 으로 저장하면 storage 에 값이 들어간다', async () => {
        const session = makeSession();
        await writeTimerSession('PROB-1', session);

        const raw = await storage.getItem('session:timer-session:PROB-1');
        expect(raw).toEqual(session);
    });

    it('[정상] readTimerSession — 저장된 유효 세션이 있으면 그대로 반환한다', async () => {
        const session = makeSession();
        await storage.setItem('session:timer-session:PROB-1', session);

        expect(await readTimerSession('PROB-1')).toEqual(session);
    });

    it('[정상] removeTimerSession — 저장된 값을 지운다', async () => {
        const session = makeSession();
        await storage.setItem('session:timer-session:PROB-1', session);

        await removeTimerSession('PROB-1');

        expect(await storage.getItem('session:timer-session:PROB-1')).toBeNull();
    });

    it('[정상] readTimerSession — 서로 다른 problemId 는 독립된 키로 저장·조회된다', async () => {
        const sessionA = makeSession({ problemId: 'PROB-A', startedAt: 1_000 });
        const sessionB = makeSession({ problemId: 'PROB-B', startedAt: 2_000 });
        await writeTimerSession('PROB-A', sessionA);
        await writeTimerSession('PROB-B', sessionB);

        expect(await readTimerSession('PROB-A')).toEqual(sessionA);
        expect(await readTimerSession('PROB-B')).toEqual(sessionB);
    });

    it('[경계] 저장값이 없으면 null, console.warn 은 호출되지 않는다', async () => {
        const other = makeSession({ problemId: 'OTHER' });
        await writeTimerSession('OTHER', other);
        expect(await readTimerSession('OTHER')).toEqual(other);

        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(await readTimerSession('NO-SESSION-ID')).toBeNull();
        expect(warn).not.toHaveBeenCalled();
    });

    it('[예외] readTimerSession — storage 접근이 throw 하면 console.warn 후 null', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(storage, 'getItem').mockRejectedValueOnce(new Error('access denied'));

        expect(await readTimerSession('PROB-1')).toBeNull();
        expect(warn).toHaveBeenCalled();
    });

    it('[예외] writeTimerSession — storage 접근이 throw 해도 throw 하지 않고 warn 만 남긴다', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(storage, 'setItem').mockRejectedValueOnce(new Error('quota'));

        await expect(writeTimerSession('PROB-1', makeSession())).resolves.not.toThrow();
        expect(warn).toHaveBeenCalled();
    });
});
