import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useTimer } from './useTimer';

describe('useTimer', () => {
    let now = 0;

    beforeEach(() => {
        now = 0;
        // setInterval 만 가짜로 — Date.now 는 아래에서 직접 제어한다.
        vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
        vi.spyOn(Date, 'now').mockImplementation(() => now);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('초기 elapsedSeconds는 0이다', () => {
        const { result } = renderHook(() => useTimer());

        expect(result.current.elapsedSeconds).toBe(0);
    });

    it('실제로 1초가 지나면 1을 반환한다', () => {
        const { result } = renderHook(() => useTimer());

        act(() => {
            now = 1000;
            vi.advanceTimersByTime(500);
        });

        expect(result.current.elapsedSeconds).toBe(1);
    });

    it('실제로 5초가 지나면 5를 반환한다', () => {
        const { result } = renderHook(() => useTimer());

        act(() => {
            now = 5000;
            vi.advanceTimersByTime(500);
        });

        expect(result.current.elapsedSeconds).toBe(5);
    });

    it('interval callback이 병합되어도 실제 경과시간 기준으로 계산한다', () => {
        const { result } = renderHook(() => useTimer());

        // 5초의 실제 시간이 흘렀지만 interval 콜백은 단 한 번만 실행된다 (스로틀링 상황)
        act(() => {
            now = 5000;
            vi.advanceTimersToNextTimer();
        });

        // 콜백 실행 횟수(1회)가 아니라 실제 경과 시간(5초)을 반영한다
        expect(result.current.elapsedSeconds).toBe(5);
    });

    it('tick 사이에 stop해도 실제 경과시간 기준으로 elapsedSeconds를 고정한다', () => {
        const { result } = renderHook(() => useTimer());

        act(() => {
            now = 7000;
            vi.advanceTimersByTime(500);
        });
        expect(result.current.elapsedSeconds).toBe(7);

        // 마지막 tick 이후 2.9초가 더 흘렀지만 다음 tick 은 아직 안 온 시점에 stop
        act(() => {
            now = 9900;
            result.current.stop();
        });

        expect(result.current.elapsedSeconds).toBe(9);
    });

    it('unmount 시 interval을 정리한다', () => {
        const { unmount } = renderHook(() => useTimer());
        expect(vi.getTimerCount()).toBe(1);

        unmount();

        expect(vi.getTimerCount()).toBe(0);
    });
});
