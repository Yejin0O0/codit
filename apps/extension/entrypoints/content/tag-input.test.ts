import { CORE_TAGS, TAG_CATALOG } from '@/lib/tag-catalog';

import { resolveCustomTagInput, toCustomTagId } from './tag-input';

describe('toCustomTagId', () => {
    it('앞뒤 공백을 제거하고 소문자로 바꾸며 공백을 하이픈으로 잇는다', () => {
        expect(toCustomTagId('  Segment Tree  ')).toBe('custom:segment-tree');
    });
});

describe('resolveCustomTagInput', () => {
    const dfs = CORE_TAGS.find((tag) => tag.id === 'dfs')!;

    it('입력이 비었거나 공백뿐이면 null을 반환한다', () => {
        expect(resolveCustomTagInput('', TAG_CATALOG)).toBeNull();
        expect(resolveCustomTagInput('   ', TAG_CATALOG)).toBeNull();
    });

    it('predefined tag와 같은 이름을 직접 입력하면 기존 tag를 선택한다', () => {
        const resolved = resolveCustomTagInput('DFS', TAG_CATALOG);

        expect(resolved).not.toBeNull();
        expect(resolved!.isNew).toBe(false);
        expect(resolved!.tag).toEqual(dfs);
        // custom:dfs 같은 존재하지 않는 id 를 만들면 안 된다
        expect(resolved!.tag.id).toBe('dfs');
        expect(resolved!.tag.id).not.toBe('custom:dfs');
    });

    it('기존 tag 이름을 대소문자 구분 없이 매칭한다', () => {
        const resolved = resolveCustomTagInput('dfs', TAG_CATALOG);

        expect(resolved!.isNew).toBe(false);
        expect(resolved!.tag.id).toBe('dfs');
    });

    it('이미 추가한 custom tag가 있으면 중복 생성하지 않고 재사용한다', () => {
        const existingCustom = { id: 'custom:my-tag', name: 'My Tag' };

        const resolved = resolveCustomTagInput('my tag', [...TAG_CATALOG, existingCustom]);

        expect(resolved!.isNew).toBe(false);
        expect(resolved!.tag).toEqual(existingCustom);
    });

    it('일치하는 기존 tag가 없으면 새 custom tag를 만든다', () => {
        const resolved = resolveCustomTagInput('  Segment Tree  ', TAG_CATALOG);

        expect(resolved!.isNew).toBe(true);
        expect(resolved!.tag).toEqual({ id: 'custom:segment-tree', name: 'Segment Tree' });
    });
});
