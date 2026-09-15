import type { Tag } from '../mockData';
import type { ResultType, Screen } from '../screens';

export const ATTEMPT_DRAFT_VERSION = 1 as const;

/** 결과 기록 초안이 저장되는 화면 — 'timer'(완료 전)·'success'(저장 후)는 제외. */
export type DraftScreen = Exclude<Screen, 'timer' | 'success'>;

/**
 * 완료 후 결과 기록 흐름의 입력 초안. 새로고침·탭 이동을 견딘다.
 * "저장" 도달 시 타이머 세션과 함께 제거된다.
 * (timer-persistence 의 TimerSession(순수 measurement)과는 별개 스토어)
 */
export interface AttemptDraft {
    version: typeof ATTEMPT_DRAFT_VERSION;
    problemId: string;
    screen: DraftScreen;
    result: ResultType | null;
    memo: string;
    memoOpen: boolean;
    selectedTagIds: string[];
    customTags: Tag[];
}
