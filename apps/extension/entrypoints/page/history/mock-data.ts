import type { ProblemHistoryDetail, ProblemHistoryListItem } from './types';

// Tag taxonomy 는 Extension 공통 SoT(@/lib/tag-catalog)를 재노출한다 — History 는 복제하지 않는다.
export { CORE_TAGS, TAG_CATALOG, TAG_CATEGORIES } from '@/lib/tag-catalog';

export const MOCK_LOAD_DELAY_MS = 400;

// mock detail 이 SoT — list item 은 여기서 파생해 contract integrity 를 보장한다.
const MOCK_DETAIL_LIST: ProblemHistoryDetail[] = [
    {
        problemId: '1859',
        title: '타일 채우기 문제',
        latestResult: 'CORRECT',
        attemptCount: 3,
        tagIds: ['implementation', 'dp'],
        attempts: [
            {
                seq: 1,
                result: 'WRONG',
                durationSeconds: 1391,
                tagIds: ['implementation'],
                recordedAt: '2026-08-15',
            },
            {
                seq: 2,
                result: 'WRONG',
                durationSeconds: 920,
                tagIds: ['implementation'],
                memo: '시간 초과. 완전탐색으로 접근한 게 문제.',
                recordedAt: '2026-08-22',
            },
            {
                seq: 3,
                result: 'CORRECT',
                durationSeconds: 692,
                tagIds: ['implementation', 'dp'],
                memo: 'DP 점화식을 다시 세우니 통과. 경계조건 주의.',
                recordedAt: '2026-08-30',
            },
        ],
    },
    {
        problemId: '2178',
        latestResult: 'WRONG',
        attemptCount: 1,
        tagIds: ['bfs'],
        attempts: [
            {
                seq: 1,
                result: 'WRONG',
                durationSeconds: 1391,
                tagIds: ['bfs'],
                recordedAt: '2026-08-28',
            },
        ],
    },
    {
        problemId: '1012',
        latestResult: 'HOLD',
        attemptCount: 2,
        tagIds: ['math-number-theory'],
        attempts: [
            {
                seq: 1,
                result: 'WRONG',
                durationSeconds: 700,
                tagIds: ['math-number-theory'],
            },
            {
                seq: 2,
                result: 'HOLD',
                durationSeconds: 520,
                tagIds: [],
            },
        ],
    },
];

function toListItem(detail: ProblemHistoryDetail): ProblemHistoryListItem {
    const latest = [...detail.attempts].sort((a, b) => b.seq - a.seq)[0]!;

    return {
        problemId: detail.problemId,
        title: detail.title,
        latestResult: latest.result,
        attemptCount: detail.attempts.length,
        latestDurationSeconds: latest.durationSeconds,
        latestSolvedAt: latest.recordedAt,
        tagIds: detail.tagIds,
    };
}

export const MOCK_DETAILS: Record<string, ProblemHistoryDetail> = Object.fromEntries(
    MOCK_DETAIL_LIST.map((detail) => [detail.problemId, detail]),
);

export const MOCK_PROBLEMS: ProblemHistoryListItem[] = MOCK_DETAIL_LIST.map(toListItem);

export function resolveMockDetail(problemId: string): ProblemHistoryDetail | null {
    return MOCK_DETAILS[problemId] ?? null;
}
