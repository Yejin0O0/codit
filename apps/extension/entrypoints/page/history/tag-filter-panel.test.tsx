import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TagFilterPanel } from './tag-filter-panel';
import { CATEGORIES_FX, CORE_TAGS_FX } from './test-fixtures';

async function openPanel(user: ReturnType<typeof userEvent.setup>) {
    const trigger = screen.queryByText(/태그 필터/);
    expect(trigger).not.toBeNull();
    await user.click(trigger!);
}

describe('TagFilterPanel', () => {
    it('새로 토글한 tag를 selectedTagIds에 병합하고 다른 그룹의 선택은 유지한다', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        render(
            <TagFilterPanel
                coreTags={CORE_TAGS_FX}
                categories={CATEGORIES_FX}
                selectedTagIds={['dp']} // 더보기 그룹의 DP 가 이미 선택됨
                onSelectedTagIdsChange={onChange}
            />,
        );

        await openPanel(user);

        const bfs = screen.queryByText('BFS'); // 핵심 그룹
        expect(bfs).not.toBeNull();
        await user.click(bfs!);

        expect(onChange).toHaveBeenCalledWith(expect.arrayContaining(['dp', 'bfs']));
    });

    it('해제한 tag만 제거하고 다른 그룹의 선택은 유지한다', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        render(
            <TagFilterPanel
                coreTags={CORE_TAGS_FX}
                categories={CATEGORIES_FX}
                selectedTagIds={['bfs', 'dp']}
                onSelectedTagIdsChange={onChange}
            />,
        );

        await openPanel(user);

        const bfs = screen.queryByText('BFS');
        expect(bfs).not.toBeNull();
        await user.click(bfs!); // BFS 해제

        expect(onChange).toHaveBeenCalledWith(['dp']);
    });
});
