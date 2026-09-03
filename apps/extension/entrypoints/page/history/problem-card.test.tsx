import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ProblemCard } from './problem-card';
import { CATALOG_FX, PROBLEM_CORRECT, PROBLEM_HOLD, PROBLEM_WRONG } from './test-fixtures';

describe('ProblemCard', () => {
    it('problemId, 풀이 횟수, mm:ss 소요시간을 항상 표시한다', () => {
        render(<ProblemCard problem={PROBLEM_WRONG} tagCatalog={CATALOG_FX} onSelect={vi.fn()} />);

        expect(screen.queryByText(/2178/)).not.toBeNull();
        expect(screen.queryByText(/1회/)).not.toBeNull();
        expect(screen.queryByText('23:11')).not.toBeNull(); // 1391s
    });

    it('title, 날짜, tag chip이 있으면 표시한다', () => {
        render(<ProblemCard problem={PROBLEM_WRONG} tagCatalog={CATALOG_FX} onSelect={vi.fn()} />);

        expect(screen.queryByText('그래프 탐색')).not.toBeNull();
        expect(screen.queryByText(/2026-08-28/)).not.toBeNull();
        expect(screen.queryByText('BFS')).not.toBeNull();
    });

    it.each(['click', 'Enter', 'Space'] as const)(
        '%s 시 onSelect를 정확히 한 번 호출한다',
        async (mode) => {
            const onSelect = vi.fn();
            const user = userEvent.setup();
            render(
                <ProblemCard
                    problem={PROBLEM_CORRECT}
                    tagCatalog={CATALOG_FX}
                    onSelect={onSelect}
                />,
            );

            const target = screen.queryByRole('button');
            expect(target).not.toBeNull();
            target!.focus();

            if (mode === 'click') await user.click(target!);
            else await user.keyboard(mode === 'Enter' ? '{Enter}' : '[Space]');

            expect(onSelect).toHaveBeenCalledTimes(1);
        },
    );

    it('키보드 포커스가 가능한 활성화 대상을 노출한다', () => {
        render(
            <ProblemCard problem={PROBLEM_CORRECT} tagCatalog={CATALOG_FX} onSelect={vi.fn()} />,
        );

        const target = screen.queryByRole('button');
        expect(target).not.toBeNull();
        target!.focus();
        expect(target).toHaveFocus();
    });

    it('problem.title이 undefined이면 title 줄을 생략한다', () => {
        render(
            <ProblemCard problem={PROBLEM_CORRECT} tagCatalog={CATALOG_FX} onSelect={vi.fn()} />,
        );

        expect(screen.queryByText(/1859/)).not.toBeNull();
        expect(screen.queryByText('그래프 탐색')).toBeNull();
    });

    it('latestSolvedAt이 undefined이면 메타 줄에서 날짜를 생략한다', () => {
        render(<ProblemCard problem={PROBLEM_HOLD} tagCatalog={CATALOG_FX} onSelect={vi.fn()} />);

        expect(screen.queryByText(/1012/)).not.toBeNull();
        expect(screen.queryByText(/2026-/)).toBeNull();
    });

    it('tagIds가 비면 tag chip 행을 생략한다', () => {
        render(<ProblemCard problem={PROBLEM_HOLD} tagCatalog={CATALOG_FX} onSelect={vi.fn()} />);

        expect(screen.queryByText(/1012/)).not.toBeNull();
        expect(screen.queryByText('BFS')).toBeNull();
    });
});
