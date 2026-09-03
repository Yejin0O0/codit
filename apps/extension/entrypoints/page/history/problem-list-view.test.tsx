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
    it('ready이고 필터 결과가 비어 있지 않으면 ProblemCard 목록을 표시한다', () => {
        render(<ProblemListView {...baseProps} />);

        expect(screen.queryByText(/2178/)).not.toBeNull();
        expect(screen.queryByText(/1859/)).not.toBeNull();
    });

    it('status가 loading이면 ProblemCard 대신 ListSkeleton을 표시한다', () => {
        const { container } = render(<ProblemListView {...baseProps} status="loading" />);

        expect(container.querySelector('[data-slot="skeleton"]')).not.toBeNull();
        expect(screen.queryByText(/2178/)).toBeNull();
    });

    it('원본 problems 배열이 비면 empty 상태를 표시한다', () => {
        render(<ProblemListView {...baseProps} problems={[]} />);

        expect(screen.queryByText(/아직 기록된 문제풀이가 없어요/)).not.toBeNull();
    });

    it('원본에는 항목이 있으나 필터에 아무것도 안 걸리면 filtered-empty 상태와 "필터 해제"를 표시한다', () => {
        render(<ProblemListView {...baseProps} selectedTagIds={['no-such-tag']} />);

        expect(screen.queryByText(/조건에 맞는 문제가 없어요/)).not.toBeNull();
        expect(screen.queryByRole('button', { name: /필터 해제/ })).not.toBeNull();
    });

    it('resultFilter가 ALL이고 선택한 tag가 없으면 필터 해제 컨트롤을 숨긴다', () => {
        render(<ProblemListView {...baseProps} />);

        expect(screen.queryByText(/2178/)).not.toBeNull(); // populated
        expect(screen.queryByRole('button', { name: /필터 해제/ })).toBeNull();
    });

    it('"필터 해제"를 클릭하면 onClearFilters를 호출한다', async () => {
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
