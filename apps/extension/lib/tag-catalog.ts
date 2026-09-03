// 제품 Tag taxonomy 의 Extension 내부 공통 Source of Truth.
// Timer(Floating Widget)와 Problem History 가 모두 이 값을 참조한다 — 각 feature 가
// 물리 복제하지 않는다. 실제 백엔드(GET /api/tags) 연동은 이후 단계에서 교체한다.

export interface TagOption {
    id: string;
    name: string;
}

export interface TagCategory {
    title: string;
    tags: TagOption[];
}

// 기본 노출 핵심 태그 11종 (docs/features/timer/ui-design.md)
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

// "더보기"로 펼쳐지는 나머지 태그. 7개 대분류 섹션.
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
            {
                id: 'shortest-path',
                name: '최단경로(다익스트라/플로이드-워셜/벨만-포드)',
            },
            { id: 'mst', name: '최소 신장 트리(크루스칼/프림)' },
            { id: 'topological-sort', name: '위상 정렬' },
        ],
    },
    {
        title: '알고리즘 설계 기법',
        tags: [{ id: 'divide-conquer', name: '분할 정복' }],
    },
    {
        title: '문자열 알고리즘',
        tags: [{ id: 'string-search', name: '문자열 탐색(패턴 매칭, KMP 등)' }],
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

// 평탄화된 전체 카탈로그 — tag id → name 역조회용.
export const TAG_CATALOG: TagOption[] = [
    ...CORE_TAGS,
    ...TAG_CATEGORIES.flatMap((category) => category.tags),
];
