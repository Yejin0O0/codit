import type { ProblemHistoryDetail, ProblemHistoryListItem, TagCategory, TagOption } from './types';

export const MOCK_LOAD_DELAY_MS = 400;

// History feature-local tag taxonomy (Timer taxonomy 를 물리 복제 — 공통 SoT 승격은 후속).
export const CORE_TAGS: TagOption[] = [
    { id: 'implementation', name: '구현' },
    { id: 'simulation', name: '시뮬레이션' },
    { id: 'brute-force', name: '완전 검색' },
    { id: 'greedy', name: '그리디' },
    { id: 'bfs', name: 'BFS' },
    { id: 'dfs', name: 'DFS' },
    { id: 'sorting', name: '정렬' },
    { id: 'dp', name: '동적 계획법(DP)' },
    { id: 'array', name: '배열' },
    { id: 'string', name: '문자열' },
    { id: 'stack-queue', name: '스택/큐' },
];

export const TAG_CATEGORIES: TagCategory[] = [
    {
        title: '자료구조',
        tags: [
            { id: 'linked-list', name: '연결 리스트' },
            { id: 'tree', name: '트리' },
            { id: 'list', name: '리스트(List)' },
            { id: 'hash', name: '해시' },
        ],
    },
    {
        title: '탐색·완전탐색',
        tags: [
            { id: 'backtracking', name: '백트래킹' },
            { id: 'binary-search', name: '이분 탐색' },
        ],
    },
    {
        title: '그래프',
        tags: [
            { id: 'shortest-path', name: '최단경로' },
            { id: 'mst', name: '최소 신장 트리' },
            { id: 'topological-sort', name: '위상 정렬' },
        ],
    },
    {
        title: '알고리즘 설계 기법',
        tags: [{ id: 'divide-conquer', name: '분할 정복' }],
    },
    {
        title: '문자열 알고리즘',
        tags: [{ id: 'string-search', name: '문자열 탐색' }],
    },
    {
        title: '수학',
        tags: [{ id: 'math-number-theory', name: '수학/정수론' }],
    },
    {
        title: '고급',
        tags: [
            { id: 'np-complete', name: 'NP-Complete' },
            { id: 'approximation', name: '근사 알고리즘' },
        ],
    },
];

export const TAG_CATALOG: TagOption[] = [
    ...CORE_TAGS,
    ...TAG_CATEGORIES.flatMap((category) => category.tags),
];

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
