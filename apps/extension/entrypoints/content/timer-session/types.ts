export const TIMER_SESSION_VERSION = 1 as const;

/** 새로고침·탭 이동을 견디는 풀이 타이머의 최소 측정 정보. (timer-persistence prd ADR-2) */
export interface TimerSession {
    version: typeof TIMER_SESSION_VERSION;
    problemId: string;
    startedAt: number;
    status: 'running' | 'stopped';
    stoppedAt: number | null;
}
