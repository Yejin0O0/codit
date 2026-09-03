import { render, screen } from '@testing-library/react';

import { TagChipList } from './tag-chip-list';

const CATALOG = [
    { id: 'bfs', name: 'BFS' },
    { id: 'dp', name: 'DP' },
];

describe('TagChipList', () => {
    it('카탈로그에 있는 tagId마다 chip을 표시하고 목록이 비면 아무것도 표시하지 않는다', () => {
        const { container, rerender } = render(
            <TagChipList tagIds={['bfs', 'dp']} catalog={CATALOG} />,
        );

        expect(screen.queryByText('BFS')).not.toBeNull();
        expect(screen.queryByText('DP')).not.toBeNull();

        rerender(<TagChipList tagIds={[]} catalog={CATALOG} />);
        expect(container.firstChild).toBeNull();
    });

    it('카탈로그에 없는 tagId는 오류 없이 건너뛴다', () => {
        render(<TagChipList tagIds={['bfs', 'ghost-tag']} catalog={CATALOG} />);

        expect(screen.queryByText('BFS')).not.toBeNull();
        expect(screen.queryByText('ghost-tag')).toBeNull();
    });
});
