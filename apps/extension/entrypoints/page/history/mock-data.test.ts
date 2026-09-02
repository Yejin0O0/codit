import { MOCK_DETAILS, MOCK_PROBLEMS, resolveMockDetail } from './mock-data';

const sameSet = (a: string[], b: string[]) =>
    a.length === b.length && a.every((x) => b.includes(x));

describe('mock-data integrity', () => {
    it('should keep MOCK_PROBLEMS and MOCK_DETAILS mutually consistent (Product Rule)', () => {
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

    it('should resolve a known problemId and return null for an unknown one', () => {
        const knownId = Object.keys(MOCK_DETAILS)[0] ?? '';
        expect(resolveMockDetail(knownId)).not.toBeNull();
        expect(resolveMockDetail('__no_such_id__')).toBeNull();
    });
});
