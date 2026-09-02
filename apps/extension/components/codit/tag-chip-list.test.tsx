import { render, screen } from '@testing-library/react';

import { TagChipList } from './tag-chip-list';

const CATALOG = [
    { id: 'bfs', name: 'BFS' },
    { id: 'dp', name: 'DP' },
];

describe('TagChipList', () => {
    it('should render a chip per known tagId and nothing when the list is empty', () => {
        const { container, rerender } = render(
            <TagChipList tagIds={['bfs', 'dp']} catalog={CATALOG} />,
        );

        expect(screen.queryByText('BFS')).not.toBeNull();
        expect(screen.queryByText('DP')).not.toBeNull();

        rerender(<TagChipList tagIds={[]} catalog={CATALOG} />);
        expect(container.firstChild).toBeNull();
    });

    it('should skip a tagId that is not in the catalog without crashing', () => {
        render(<TagChipList tagIds={['bfs', 'ghost-tag']} catalog={CATALOG} />);

        expect(screen.queryByText('BFS')).not.toBeNull();
        expect(screen.queryByText('ghost-tag')).toBeNull();
    });
});
