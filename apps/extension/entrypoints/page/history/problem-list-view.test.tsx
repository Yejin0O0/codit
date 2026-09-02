import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ProblemListView } from './problem-list-view';
import { CATALOG_FX, CATEGORIES_FX, CORE_TAGS_FX, PROBLEMS_FX } from './test-fixtures';

const baseProps = {
    status: 'ready' as const,
    problems: PROBLEMS_FX,
    resultFilter: 'ALL' as const,
    selectedTagIds: [] as string[],
    coreTags: CORE_TAGS_FX,
    categories: CATEGORIES_FX,
    tagCatalog: CATALOG_FX,
    onResultFilterChange: vi.fn(),
    onSelectedTagIdsChange: vi.fn(),
    onClearFilters: vi.fn(),
    onSelectProblem: vi.fn(),
};

describe('ProblemListView', () => {
    it('should render a ProblemCard list when ready and the filtered result is non-empty', () => {
        render(<ProblemListView {...baseProps} />);

        expect(screen.queryByText(/2178/)).not.toBeNull();
        expect(screen.queryByText(/1859/)).not.toBeNull();
    });

    it('should render ListSkeleton (not ProblemCards) when status is loading', () => {
        const { container } = render(<ProblemListView {...baseProps} status="loading" />);

        expect(container.querySelector('[data-slot="skeleton"]')).not.toBeNull();
        expect(screen.queryByText(/2178/)).toBeNull();
    });

    it('should render the empty state when the source problems array is empty', () => {
        render(<ProblemListView {...baseProps} problems={[]} />);

        expect(screen.queryByText(/아직 기록된 문제풀이가 없어요/)).not.toBeNull();
    });

    it('should render the filtered-empty state + 필터 해제 when filters match nothing but source has items', () => {
        render(<ProblemListView {...baseProps} selectedTagIds={['no-such-tag']} />);

        expect(screen.queryByText(/조건에 맞는 문제가 없어요/)).not.toBeNull();
        expect(screen.queryByRole('button', { name: /필터 해제/ })).not.toBeNull();
    });

    it('should hide the clear-filters control when resultFilter is ALL and no tag is selected', () => {
        render(<ProblemListView {...baseProps} />);

        expect(screen.queryByText(/2178/)).not.toBeNull(); // populated
        expect(screen.queryByRole('button', { name: /필터 해제/ })).toBeNull();
    });

    it('should call onClearFilters when 필터 해제 is clicked', async () => {
        const onClearFilters = vi.fn();
        const user = userEvent.setup();
        render(
            <ProblemListView
                {...baseProps}
                resultFilter="WRONG"
                selectedTagIds={['no-such-tag']}
                onClearFilters={onClearFilters}
            />,
        );

        const btn = screen.queryByRole('button', { name: /필터 해제/ });
        expect(btn).not.toBeNull();

        await user.click(btn!);
        expect(onClearFilters).toHaveBeenCalledTimes(1);
    });
});
