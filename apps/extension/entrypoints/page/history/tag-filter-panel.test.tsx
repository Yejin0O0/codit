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
    it('should merge a newly toggled tag into selectedTagIds while keeping other groups selections', async () => {
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

    it('should drop only the deselected tag and keep the other group selection', async () => {
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
