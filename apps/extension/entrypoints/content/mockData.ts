// 이 파일의 데이터는 전부 mock 이다.
// 실제 Timer Domain / 태그 카탈로그 연동은 이후 단계에서 교체한다.

export interface Tag {
    id: string;
    name: string;
}

export interface TagCategory {
    title: string;
    tags: Tag[];
}

export const MOCK_PROBLEM = {
    problemId: '1859',
};

// 기본 노출 핵심 태그 11종 (docs/features/timer/ui-design.md)
export const CORE_TAGS: Tag[] = [
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

// "더보기"로 펼쳐지는 나머지 태그. 최신 기능 요구사항의 태그 카탈로그.
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
