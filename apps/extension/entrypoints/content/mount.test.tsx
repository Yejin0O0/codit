import { afterEach, describe, expect, it, vi } from 'vitest';
import { storage } from 'wxt/utils/storage';

// 번들 CSS(Tailwind @import) 는 이 단위 테스트의 관심사가 아니다.
vi.mock('./style.css?inline', () => ({ default: ':host { display: block; }' }));

import { mountCoditWidget } from './mount';
import * as sessionStore from './timer-session/store';
import { TIMER_SESSION_VERSION, type TimerSession } from './timer-session/types';

const PROBLEM_ID = 'AZ8R8haaeYnHBITH';
const PROBLEM_URL = `https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=${PROBLEM_ID}`;
const NON_PROBLEM_URL = 'https://swexpertacademy.com/main/main.do';

function flushMicrotasks(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
});

describe('mountCoditWidget', () => {
    it('contestProbId가 없으면 DOM을 만들지 않는다', () => {
        const childCountBefore = document.body.childElementCount;

        const mounted = mountCoditWidget(NON_PROBLEM_URL);

        expect(mounted).toBe(false);
        expect(document.getElementById('codit-root')).toBeNull();
        expect(document.body.childElementCount).toBe(childCountBefore);
    });

    it('SWEA 문제 페이지에서는 Shadow DOM 위젯 root를 mount한다', () => {
        const mounted = mountCoditWidget(PROBLEM_URL);

        expect(mounted).toBe(true);
        const root = document.getElementById('codit-root');
        expect(root).not.toBeNull();
        expect(root!.shadowRoot).not.toBeNull();
    });

    it('root가 이미 있으면 다시 mount하지 않는다', () => {
        mountCoditWidget(PROBLEM_URL);
        const mountedAgain = mountCoditWidget(PROBLEM_URL);

        expect(mountedAgain).toBe(false);
        expect(document.querySelectorAll('#codit-root')).toHaveLength(1);
    });
});

describe('mountCoditWidget — timer-session 복원', () => {
    function appDivText(): string {
        const root = document.getElementById('codit-root');
        const appDiv = root!.shadowRoot!.querySelector('div:last-of-type');
        return appDiv?.textContent ?? '';
    }

    it('[정상] 세션이 없으면 새로 생성해 storage 에 저장하고, 그 값으로 App이 뜬다', async () => {
        mountCoditWidget(PROBLEM_URL);
        await flushMicrotasks();

        const stored = await storage.getItem(`session:timer-session:${PROBLEM_ID}`);
        expect(stored).toMatchObject({ problemId: PROBLEM_ID, status: 'running' });
        expect(appDivText()).toContain(`문제 #${PROBLEM_ID}`);
    });

    it('[정상] 저장된 세션이 있으면 그 값을 사용하고 재생성(write) 하지 않는다', async () => {
        const existing: TimerSession = {
            version: TIMER_SESSION_VERSION,
            problemId: PROBLEM_ID,
            startedAt: Date.now() - 5_000,
            status: 'running',
            stoppedAt: null,
        };
        await storage.setItem(`session:timer-session:${PROBLEM_ID}`, existing);
        const writeSpy = vi.spyOn(sessionStore, 'writeTimerSession');

        mountCoditWidget(PROBLEM_URL);
        await flushMicrotasks();

        expect(writeSpy).not.toHaveBeenCalled();
    });

    it('[예외] storage 접근이 실패해도 위젯은 정상 mount 되고 새 세션으로 시작한다', async () => {
        vi.spyOn(storage, 'getItem').mockRejectedValue(new Error('access denied'));

        const mounted = mountCoditWidget(PROBLEM_URL);
        await flushMicrotasks();

        expect(mounted).toBe(true);
        expect(appDivText()).toContain(`문제 #${PROBLEM_ID}`);
    });
});
