import { useCallback, useEffect, useState } from 'react';

/**
 * 경과 시간(초)을 1초 간격으로 증가시킨다.
 * "완료" 시 stop() 으로 정지하며, 이후 값은 고정된다.
 * (일시정지/재개/리셋은 확정 기능이 아니므로 제공하지 않는다)
 */
export function useTimer() {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [running, setRunning] = useState(true);

    useEffect(() => {
        if (!running) {
            return;
        }

        const id = setInterval(() => {
            setElapsedSeconds((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(id);
    }, [running]);

    const stop = useCallback(() => setRunning(false), []);

    return { elapsedSeconds, stop };
}
