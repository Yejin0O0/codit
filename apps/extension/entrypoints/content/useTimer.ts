import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 경과 시간(초)을 벽시계(Date.now) 기준으로 계산한다.
 *
 * setInterval 콜백은 "1초를 더하는" 역할이 아니라 "화면을 다시 계산하게 하는"
 * 역할만 한다. 콜백이 지연/병합되어도(백그라운드 스로틀링, 절전 등) 표시값은
 * 항상 `floor((now - startedAt) / 1000)` 로, 실제 경과 시간과 어긋나지 않는다.
 *
 * "완료" 시 stop() 으로 정지한다. stop() 은 마지막 tick 이후 흐른 시간까지
 * 반영해 최종 elapsedSeconds 를 Date.now() 기준으로 정확히 고정한다.
 * (일시정지/재개/리셋, reload 복원은 제공하지 않는다)
 */
export function useTimer(_init?: { startedAt: number; stoppedAt: number | null }) {
    const startedAtRef = useRef<number | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [running, setRunning] = useState(true);

    useEffect(() => {
        if (!running) {
            return;
        }

        if (startedAtRef.current === null) {
            startedAtRef.current = Date.now();
        }
        const startedAt = startedAtRef.current;

        const recompute = () => {
            setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
        };

        recompute();
        const id = setInterval(recompute, 500);

        return () => clearInterval(id);
    }, [running]);

    const stop = useCallback(() => {
        if (startedAtRef.current !== null) {
            setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
        }
        setRunning(false);
    }, []);

    return { elapsedSeconds, stop };
}
