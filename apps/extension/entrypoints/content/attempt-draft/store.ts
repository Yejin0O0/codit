import { storage } from 'wxt/utils/storage';

import { ATTEMPT_DRAFT_VERSION, type AttemptDraft, type DraftScreen } from './types';

function attemptDraftKey(problemId: string): `session:attempt-draft:${string}` {
    return `session:attempt-draft:${problemId}`;
}

const DRAFT_SCREENS: readonly DraftScreen[] = ['result', 'memo', 'tags'];
const ALLOWED_RESULTS: readonly string[] = ['CORRECT', 'WRONG', 'HOLD'];

/** 결과 기록 초안이 저장되는 화면인가 — App 의 저장 트리거와 초안 검증이 공유한다. */
export function isDraftScreen(screen: unknown): screen is DraftScreen {
    return typeof screen === 'string' && (DRAFT_SCREENS as readonly string[]).includes(screen);
}

function isTagShape(value: unknown): boolean {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const tag = value as Record<string, unknown>;
    return typeof tag.id === 'string' && typeof tag.name === 'string';
}

export function isValidAttemptDraft(value: unknown): value is AttemptDraft {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const candidate = value as Record<string, unknown>;

    if (candidate.version !== ATTEMPT_DRAFT_VERSION) {
        return false;
    }
    if (typeof candidate.problemId !== 'string' || candidate.problemId.length === 0) {
        return false;
    }
    if (!isDraftScreen(candidate.screen)) {
        return false;
    }
    if (
        candidate.result !== null &&
        (typeof candidate.result !== 'string' || !ALLOWED_RESULTS.includes(candidate.result))
    ) {
        return false;
    }
    // memo·tags 화면은 result 가 반드시 있어야 App 이 그 화면을 렌더한다(손상 draft 격리).
    if ((candidate.screen === 'memo' || candidate.screen === 'tags') && candidate.result === null) {
        return false;
    }
    if (typeof candidate.memo !== 'string') {
        return false;
    }
    if (typeof candidate.memoOpen !== 'boolean') {
        return false;
    }
    if (
        !Array.isArray(candidate.selectedTagIds) ||
        candidate.selectedTagIds.some((id) => typeof id !== 'string')
    ) {
        return false;
    }
    if (!Array.isArray(candidate.customTags) || !candidate.customTags.every(isTagShape)) {
        return false;
    }

    return true;
}

export async function readAttemptDraft(problemId: string): Promise<AttemptDraft | null> {
    try {
        const raw = await storage.getItem(attemptDraftKey(problemId));
        if (isValidAttemptDraft(raw)) {
            return raw;
        }
        return null;
    } catch {
        console.warn('[codit] 결과 기록 초안 읽기에 실패했습니다');
        return null;
    }
}

export async function writeAttemptDraft(problemId: string, draft: AttemptDraft): Promise<void> {
    try {
        await storage.setItem(attemptDraftKey(problemId), draft);
    } catch {
        console.warn('[codit] 결과 기록 초안 저장에 실패했습니다');
    }
}

export async function removeAttemptDraft(problemId: string): Promise<void> {
    try {
        await storage.removeItem(attemptDraftKey(problemId));
    } catch {
        console.warn('[codit] 결과 기록 초안 삭제에 실패했습니다');
    }
}
