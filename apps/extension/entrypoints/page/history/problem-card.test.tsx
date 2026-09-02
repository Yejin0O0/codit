import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ProblemCard } from './problem-card';
import { CATALOG_FX, PROBLEM_CORRECT, PROBLEM_HOLD, PROBLEM_WRONG } from './test-fixtures';

describe('ProblemCard', () => {
    it('should always render problemId, attempt count and mm:ss duration', () => {
        render(<ProblemCard problem={PROBLEM_WRONG} tagCatalog={CATALOG_FX} onSelect={vi.fn()} />);

        expect(screen.queryByText(/2178/)).not.toBeNull();
        expect(screen.queryByText(/1회/)).not.toBeNull();
        expect(screen.queryByText('23:11')).not.toBeNull(); // 1391s
    });

    it('should render title, date and tag chips when present', () => {
        render(<ProblemCard problem={PROBLEM_WRONG} tagCatalog={CATALOG_FX} onSelect={vi.fn()} />);

        expect(screen.queryByText('그래프 탐색')).not.toBeNull();
        expect(screen.queryByText(/2026-08-28/)).not.toBeNull();
        expect(screen.queryByText('BFS')).not.toBeNull();
    });

    it.each(['click', 'Enter', 'Space'] as const)(
        'should call onSelect exactly once on %s',
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

    it('should expose a keyboard-focusable activation target', () => {
        render(
            <ProblemCard problem={PROBLEM_CORRECT} tagCatalog={CATALOG_FX} onSelect={vi.fn()} />,
        );

        const target = screen.queryByRole('button');
        expect(target).not.toBeNull();
        target!.focus();
        expect(target).toHaveFocus();
    });

    it('should omit the title line when problem.title is undefined', () => {
        render(
            <ProblemCard problem={PROBLEM_CORRECT} tagCatalog={CATALOG_FX} onSelect={vi.fn()} />,
        );

        expect(screen.queryByText(/1859/)).not.toBeNull();
        expect(screen.queryByText('그래프 탐색')).toBeNull();
    });

    it('should omit the date from the meta line when latestSolvedAt is undefined', () => {
        render(<ProblemCard problem={PROBLEM_HOLD} tagCatalog={CATALOG_FX} onSelect={vi.fn()} />);

        expect(screen.queryByText(/1012/)).not.toBeNull();
        expect(screen.queryByText(/2026-/)).toBeNull();
    });

    it('should omit the tag chip row when tagIds is empty', () => {
        render(<ProblemCard problem={PROBLEM_HOLD} tagCatalog={CATALOG_FX} onSelect={vi.fn()} />);

        expect(screen.queryByText(/1012/)).not.toBeNull();
        expect(screen.queryByText('BFS')).toBeNull();
    });
});
