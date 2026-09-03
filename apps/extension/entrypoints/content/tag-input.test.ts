import { CORE_TAGS, TAG_CATALOG } from '@/lib/tag-catalog';

import { resolveCustomTagInput, toCustomTagId } from './tag-input';

describe('toCustomTagId', () => {
    it('should lowercase, trim and dash-join whitespace', () => {
        expect(toCustomTagId('  Segment Tree  ')).toBe('custom:segment-tree');
    });
});

describe('resolveCustomTagInput', () => {
    const dfs = CORE_TAGS.find((tag) => tag.id === 'dfs')!;

    it('should return null for an empty or whitespace-only input', () => {
        expect(resolveCustomTagInput('', TAG_CATALOG)).toBeNull();
        expect(resolveCustomTagInput('   ', TAG_CATALOG)).toBeNull();
    });

    it('should select the existing predefined tag when the same tag name is entered manually', () => {
        const resolved = resolveCustomTagInput('DFS', TAG_CATALOG);

        expect(resolved).not.toBeNull();
        expect(resolved!.isNew).toBe(false);
        expect(resolved!.tag).toEqual(dfs);
        // custom:dfs 같은 존재하지 않는 id 를 만들면 안 된다
        expect(resolved!.tag.id).toBe('dfs');
        expect(resolved!.tag.id).not.toBe('custom:dfs');
    });

    it('should match an existing tag name case-insensitively', () => {
        const resolved = resolveCustomTagInput('dfs', TAG_CATALOG);

        expect(resolved!.isNew).toBe(false);
        expect(resolved!.tag.id).toBe('dfs');
    });

    it('should reuse an already-added custom tag instead of creating a duplicate', () => {
        const existingCustom = { id: 'custom:my-tag', name: 'My Tag' };

        const resolved = resolveCustomTagInput('my tag', [...TAG_CATALOG, existingCustom]);

        expect(resolved!.isNew).toBe(false);
        expect(resolved!.tag).toEqual(existingCustom);
    });

    it('should create a new custom tag when no existing tag matches', () => {
        const resolved = resolveCustomTagInput('  Segment Tree  ', TAG_CATALOG);

        expect(resolved!.isNew).toBe(true);
        expect(resolved!.tag).toEqual({ id: 'custom:segment-tree', name: 'Segment Tree' });
    });
});
