// feature-local view-model 타입의 Source of Truth.
// components/codit/** 을 import 하지 않는다. TagOption / TagCategory 도 여기가 SoT.

export interface TagOption {
    id: string;
    name: string;
}
export interface TagCategory {
    title: string;
    tags: TagOption[];
}

export type AttemptResult = 'CORRECT' | 'WRONG' | 'HOLD';
export type ResultFilter = 'ALL' | AttemptResult;

export const RESULT_LABELS: Record<AttemptResult, string> = {
    CORRECT: '정답',
    WRONG: '오답',
    HOLD: '보류',
};
export const RESULT_FILTER_LABELS: Record<ResultFilter, string> = {
    ALL: '전체',
    CORRECT: '정답',
    WRONG: '오답',
    HOLD: '보류',
};

export interface ProblemAttempt {
    seq: number;
    result: AttemptResult;
    durationSeconds: number;
    tagIds: string[];
    memo?: string;
    recordedAt?: string;
}
export interface ProblemHistoryListItem {
    problemId: string;
    title?: string;
    latestResult: AttemptResult;
    attemptCount: number;
    latestDurationSeconds: number;
    latestSolvedAt?: string;
    tagIds: string[];
}
export interface ProblemHistoryDetail {
    problemId: string;
    title?: string;
    latestResult: AttemptResult;
    attemptCount: number;
    tagIds: string[];
    attempts: ProblemAttempt[];
}
