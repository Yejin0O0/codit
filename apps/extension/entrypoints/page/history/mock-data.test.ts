import { MOCK_DETAILS, MOCK_PROBLEMS, resolveMockDetail } from './mock-data';

const sameSet = (a: string[], b: string[]) =>
    a.length === b.length && a.every((x) => b.includes(x));

describe('mock-data integrity', () => {
    it('MOCK_PROBLEMS와 MOCK_DETAILS를 서로 일관되게 유지한다(Product Rule)', () => {
        expect(MOCK_PROBLEMS.length).toBeGreaterThan(0);

        const entries = Object.entries(MOCK_DETAILS);
        expect(entries.length).toBeGreaterThan(0);

        for (const [problemId, detail] of entries) {
            const listItem = MOCK_PROBLEMS.find((p) => p.problemId === problemId);
            expect(listItem).toBeDefined();
            if (!listItem) continue;

            expect(listItem.attemptCount).toBe(detail.attempts.length);
            expect(detail.attempts.length).toBeGreaterThan(0);

            const latest = [...detail.attempts].sort((a, b) => b.seq - a.seq)[0]!;
            expect(listItem.latestResult).toBe(latest.result);
            expect(listItem.latestDurationSeconds).toBe(latest.durationSeconds);

            const attemptUnion = [...new Set(detail.attempts.flatMap((a) => a.tagIds))];
            expect(sameSet(detail.tagIds, attemptUnion)).toBe(true);
            expect(sameSet(listItem.tagIds, detail.tagIds)).toBe(true);
        }
    });

    it('알려진 problemId는 resolve하고 모르는 problemId는 null을 반환한다', () => {
        const knownId = Object.keys(MOCK_DETAILS)[0] ?? '';
        expect(resolveMockDetail(knownId)).not.toBeNull();
        expect(resolveMockDetail('__no_such_id__')).toBeNull();
    });
});
