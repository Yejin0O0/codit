import { tagColorClass, tagColorFamily } from './tag-colors';

describe('tag-colors', () => {
    it.each([
        // CORE
        ['implementation', 'core'],
        ['bfs', 'core'],
        // 자료구조 → blue
        ['linked-list', 'blue'],
        // 탐색·완전탐색 / 그래프 → orange
        ['backtracking', 'orange'],
        ['shortest-path', 'orange'],
        // 알고리즘 설계 기법 / 수학 → violet
        ['divide-conquer', 'violet'],
        ['math-number-theory', 'violet'],
        // 문자열 알고리즘 / 고급 → magenta
        ['string-search', 'magenta'],
        ['np-complete', 'magenta'],
        // 카탈로그에 없는 id → custom
        ['unknown-user-tag', 'custom'],
    ] as const)('%s 는 %s 패밀리로 분류된다', (tagId, family) => {
        expect(tagColorFamily(tagId)).toBe(family);
    });

    it('CORE 태그는 filled primary 클래스를 반환한다', () => {
        expect(tagColorClass('bfs')).toBe('bg-primary text-primary-foreground');
    });

    it('CUSTOM(미매핑) 태그는 secondary 클래스를 반환한다', () => {
        expect(tagColorClass('unknown-user-tag')).toBe('bg-secondary text-secondary-foreground');
    });

    it('같은 패밀리의 카테고리 태그는 같은 클래스를 반환한다 (탐색·그래프 = orange)', () => {
        expect(tagColorClass('backtracking')).toBe(tagColorClass('shortest-path'));
    });

    it('서로 다른 패밀리는 서로 다른 클래스를 반환한다', () => {
        const classes = new Set([
            tagColorClass('linked-list'), // blue
            tagColorClass('backtracking'), // orange
            tagColorClass('divide-conquer'), // violet
            tagColorClass('string-search'), // magenta
            tagColorClass('bfs'), // core
        ]);
        expect(classes.size).toBe(5);
    });
});
