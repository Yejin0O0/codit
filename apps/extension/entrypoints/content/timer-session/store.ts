import type { TimerSession } from './types';

export function isValidTimerSession(_value: unknown, _now: number): _value is TimerSession {
    return false;
}

export async function readTimerSession(_problemId: string): Promise<TimerSession | null> {
    return null;
}

export async function writeTimerSession(_problemId: string, _session: TimerSession): Promise<void> {}

export async function removeTimerSession(_problemId: string): Promise<void> {}
