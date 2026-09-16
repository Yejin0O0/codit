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

    it('[UI-L2 R9] CORE 태그(bfs)는 filled primary 톤, 카테고리 태그는 매핑된 hue 패밀리 클래스를 받는다', () => {
        const catalog = [
            { id: 'bfs', name: 'BFS' },
            { id: 'linked-list', name: '연결 리스트' },
            { id: 'custom-user-tag', name: '내가 만든 태그' },
        ];
        render(
            <TagChipList tagIds={['bfs', 'linked-list', 'custom-user-tag']} catalog={catalog} />,
        );

        // filled primary — 파스텔 4색(카테고리) 중 어느 것과도 안 헷갈리도록 톤 자체를 다르게.
        expect(screen.getByText('BFS')).toHaveClass('bg-primary', 'text-primary-foreground');
        expect(screen.getByText('연결 리스트')).toHaveClass('bg-tag-blue', 'text-tag-blue-foreground');
        expect(screen.getByText('내가 만든 태그')).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });
});
