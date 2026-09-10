import { storage } from 'wxt/utils/storage';

import {
    isValidAttemptDraft,
    readAttemptDraft,
    removeAttemptDraft,
    writeAttemptDraft,
} from './store';
import { ATTEMPT_DRAFT_VERSION, type AttemptDraft } from './types';

const PROBLEM_ID = 'PROB-1';

function draftKey(problemId: string): `session:attempt-draft:${string}` {
    return `session:attempt-draft:${problemId}`;
}

function makeDraft(overrides: Partial<AttemptDraft> = {}): AttemptDraft {
    return {
        version: ATTEMPT_DRAFT_VERSION,
        problemId: PROBLEM_ID,
        screen: 'result',
        result: null,
        memo: '',
        memoOpen: false,
        selectedTagIds: [],
        customTags: [],
        ...overrides,
    };
}

describe('isValidAttemptDraft', () => {
    it('[정상] 정상 draft 객체는 유효하다', () => {
        expect(isValidAttemptDraft(makeDraft({ result: 'WRONG', screen: 'memo' }))).toBe(true);
    });

    it("[정상] screen 'result' 는 result 가 null 이어도 유효하다", () => {
        expect(isValidAttemptDraft(makeDraft({ screen: 'result', result: null }))).toBe(true);
    });

    it("[경계] screen 'memo' 에 result 'WRONG' 이면 유효하다", () => {
        expect(isValidAttemptDraft(makeDraft({ screen: 'memo', result: 'WRONG' }))).toBe(true);
    });

    it('[예외] version 불일치는 무효', () => {
        expect(isValidAttemptDraft({ ...makeDraft(), version: 999 })).toBe(false);
    });

    it("[예외] screen 'memo' 인데 result 가 null 이면 무효", () => {
        expect(isValidAttemptDraft(makeDraft({ screen: 'memo', result: null }))).toBe(false);
    });

    it("[예외] screen 'tags' 인데 result 가 null 이면 무효", () => {
        expect(isValidAttemptDraft(makeDraft({ screen: 'tags', result: null }))).toBe(false);
    });

    it("[예외] screen 이 'timer' 또는 'success' 면 무효", () => {
        expect(isValidAttemptDraft({ ...makeDraft(), screen: 'timer' })).toBe(false);
        expect(isValidAttemptDraft({ ...makeDraft(), screen: 'success' })).toBe(false);
    });

    it('[예외] 객체가 아니거나 null 이면 무효', () => {
        expect(isValidAttemptDraft(null)).toBe(false);
        expect(isValidAttemptDraft('draft')).toBe(false);
    });

    it('[예외] selectedTagIds 가 문자열 배열이 아니면 무효', () => {
        expect(isValidAttemptDraft({ ...makeDraft(), selectedTagIds: 'dfs' })).toBe(false);
        expect(isValidAttemptDraft({ ...makeDraft(), selectedTagIds: [1, 2] })).toBe(false);
    });

    it('[예외] result 가 허용값이 아니면 무효', () => {
        expect(isValidAttemptDraft({ ...makeDraft(), result: 'MAYBE' })).toBe(false);
    });
});

describe('readAttemptDraft / writeAttemptDraft / removeAttemptDraft', () => {
    it('[정상] write 한 draft 를 read 하면 같은 값을 돌려준다', async () => {
        const draft = makeDraft({
            screen: 'tags',
            result: 'CORRECT',
            memo: '이분탐색 경계',
            memoOpen: true,
            selectedTagIds: ['dfs'],
            customTags: [{ id: 'custom:x', name: 'x' }],
        });
        await writeAttemptDraft(PROBLEM_ID, draft);

        expect(await readAttemptDraft(PROBLEM_ID)).toEqual(draft);
    });

    it('[정상] 저장된 게 없으면 read 는 null 을 돌려준다', async () => {
        expect(await readAttemptDraft(PROBLEM_ID)).toBeNull();
    });

    it('[경계] 손상값(memo 화면 + result null)이 저장돼 있으면 read 는 null 을 돌려준다', async () => {
        await storage.setItem(draftKey(PROBLEM_ID), makeDraft({ screen: 'memo', result: null }));

        expect(await readAttemptDraft(PROBLEM_ID)).toBeNull();
    });

    it('[정상] remove 후 read 하면 null 이다', async () => {
        await writeAttemptDraft(PROBLEM_ID, makeDraft());
        await removeAttemptDraft(PROBLEM_ID);

        expect(await readAttemptDraft(PROBLEM_ID)).toBeNull();
    });

    it('[예외] storage.getItem 이 throw 하면 read 는 null 을 돌려주고 경고를 남긴다', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(storage, 'getItem').mockRejectedValueOnce(new Error('boom'));

        expect(await readAttemptDraft(PROBLEM_ID)).toBeNull();
        expect(warn).toHaveBeenCalled();

        vi.restoreAllMocks();
    });

    it('[예외] storage.setItem 이 throw 해도 write 는 throw 하지 않는다', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(storage, 'setItem').mockRejectedValueOnce(new Error('quota'));

        await expect(writeAttemptDraft(PROBLEM_ID, makeDraft())).resolves.toBeUndefined();

        vi.restoreAllMocks();
    });

    it('[예외] storage.removeItem 이 throw 해도 remove 는 throw 하지 않는다', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(storage, 'removeItem').mockRejectedValueOnce(new Error('boom'));

        await expect(removeAttemptDraft(PROBLEM_ID)).resolves.toBeUndefined();

        vi.restoreAllMocks();
    });
});
