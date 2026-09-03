// 테스트 전용 fixtures (vitest include 패턴 밖 — 실행 대상 아님).
import type {
    ProblemAttempt,
    ProblemHistoryDetail,
    ProblemHistoryListItem,
    TagCategory,
    TagOption,
} from './types';

export const TAG_BFS: TagOption = { id: 'bfs', name: 'BFS' };
export const TAG_DP: TagOption = { id: 'dp', name: 'DP' };
export const TAG_IMPL: TagOption = { id: 'impl', name: '구현' };
export const TAG_GRAPH: TagOption = { id: 'graph', name: '그래프' };

export const CORE_TAGS_FX: TagOption[] = [TAG_BFS, TAG_IMPL];
export const CATEGORIES_FX: TagCategory[] = [{ title: '고급', tags: [TAG_DP, TAG_GRAPH] }];
export const CATALOG_FX: TagOption[] = [TAG_BFS, TAG_DP, TAG_IMPL, TAG_GRAPH];

/** latestResult = WRONG, 제목/날짜/태그 모두 있음 */
export const PROBLEM_WRONG: ProblemHistoryListItem = {
    problemId: '2178',
    title: '그래프 탐색',
    latestResult: 'WRONG',
    attemptCount: 1,
    latestDurationSeconds: 1391,
    latestSolvedAt: '2026-08-28',
    tagIds: ['graph', 'bfs'],
};

/** latestResult = CORRECT, 제목 없음, 날짜 있음 */
export const PROBLEM_CORRECT: ProblemHistoryListItem = {
    problemId: '1859',
    latestResult: 'CORRECT',
    attemptCount: 3,
    latestDurationSeconds: 692,
    latestSolvedAt: '2026-08-30',
    tagIds: ['impl', 'dp'],
};

/** latestResult = HOLD, 제목/날짜/태그 전부 없음 */
export const PROBLEM_HOLD: ProblemHistoryListItem = {
    problemId: '1012',
    latestResult: 'HOLD',
    attemptCount: 2,
    latestDurationSeconds: 520,
    tagIds: [],
};

export const PROBLEMS_FX: ProblemHistoryListItem[] = [PROBLEM_WRONG, PROBLEM_CORRECT, PROBLEM_HOLD];

export const ATTEMPT_1: ProblemAttempt = {
    seq: 1,
    result: 'WRONG',
    durationSeconds: 1391,
    tagIds: ['impl'],
};
export const ATTEMPT_2: ProblemAttempt = {
    seq: 2,
    result: 'WRONG',
    durationSeconds: 920,
    tagIds: ['impl'],
    memo: '시간 초과',
    recordedAt: '2026-08-22',
};
export const ATTEMPT_3: ProblemAttempt = {
    seq: 3,
    result: 'CORRECT',
    durationSeconds: 692,
    tagIds: ['impl', 'dp'],
    memo: '점화식 다시 세워 통과',
    recordedAt: '2026-08-30',
};

/** attempts 는 일부러 오름차순 — 컴포넌트가 내림차순 정렬해야 함 */
export const DETAIL_1859: ProblemHistoryDetail = {
    problemId: '1859',
    latestResult: 'CORRECT',
    attemptCount: 3,
    tagIds: ['impl', 'dp'],
    attempts: [ATTEMPT_1, ATTEMPT_2, ATTEMPT_3],
};
