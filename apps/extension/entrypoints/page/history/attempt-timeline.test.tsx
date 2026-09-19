import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AttemptTimeline } from './attempt-timeline';
import { ATTEMPT_1, ATTEMPT_2, ATTEMPT_3, CATALOG_FX } from './test-fixtures';

describe('AttemptTimeline', () => {
    it('attempts 길이가 1이면 회차 목록 없이 AttemptItem 하나만 표시한다', () => {
        render(<AttemptTimeline attempts={[ATTEMPT_2]} tagCatalog={CATALOG_FX} />);

        expect(screen.queryAllByText(/회차/).length).toBe(1);
        expect(screen.queryByText(/2회차/)).not.toBeNull();
        expect(screen.queryByRole('group', { name: '회차 목록' })).toBeNull();
    });

    it('attempts 길이가 1이면 AttemptItem이 wrapper의 첫 자식이라 상단 구분선이 생략된다', () => {
        const { container } = render(
            <AttemptTimeline attempts={[ATTEMPT_2]} tagCatalog={CATALOG_FX} />,
        );

        const attemptItemRoot = screen.getByText(/2회차/).closest('div')!.parentElement!;
        expect(attemptItemRoot).toBe(container.firstElementChild!.firstElementChild);
    });

    it('여러 회차면 회차 목록(사이드바)을 seq 내림차순으로 표시하고, 기본으로 최신 회차 상세를 보여준다', () => {
        render(
            <AttemptTimeline
                attempts={[ATTEMPT_1, ATTEMPT_2, ATTEMPT_3]}
                tagCatalog={CATALOG_FX}
            />,
        );

        const list = screen.getByRole('group', { name: '회차 목록' });
        const buttons = within(list).getAllByRole('button');
        expect(buttons.map((b) => b.textContent)).toEqual([
            expect.stringContaining('3회차'),
            expect.stringContaining('2회차'),
            expect.stringContaining('1회차'),
        ]);
        expect(buttons[0]).toHaveAttribute('aria-current', 'true');

        // 상세 패널 = 최신(3회차) — 메모까지 보이는 건 AttemptItem(상세)에서만 렌더된다.
        expect(screen.queryByText(/점화식 다시 세워 통과/)).not.toBeNull();
    });

    it('다른 회차 버튼을 클릭하면 상세 패널이 그 회차로 바뀐다', async () => {
        const user = userEvent.setup();
        render(
            <AttemptTimeline
                attempts={[ATTEMPT_1, ATTEMPT_2, ATTEMPT_3]}
                tagCatalog={CATALOG_FX}
            />,
        );

        const list = screen.getByRole('group', { name: '회차 목록' });
        await user.click(within(list).getByText('1회차'));

        expect(within(list).getByText('1회차').closest('button')).toHaveAttribute(
            'aria-current',
            'true',
        );
        expect(screen.queryByText(/점화식 다시 세워 통과/)).toBeNull();
        expect(screen.queryByText(/시간 초과/)).toBeNull();
    });

    it('언마운트 없이 attempts가 갱신되고 최신 회차가 바뀌면 선택도 새 최신 회차로 다시 맞춘다', () => {
        const { rerender } = render(
            <AttemptTimeline attempts={[ATTEMPT_1, ATTEMPT_2]} tagCatalog={CATALOG_FX} />,
        );

        const newLatest = { ...ATTEMPT_3, seq: 5 };
        rerender(<AttemptTimeline attempts={[ATTEMPT_1, ATTEMPT_2, newLatest]} tagCatalog={CATALOG_FX} />);

        const list = screen.getByRole('group', { name: '회차 목록' });
        expect(within(list).getByText('5회차').closest('button')).toHaveAttribute(
            'aria-current',
            'true',
        );
    });

    it('정렬 시 입력 attempts 배열을 변경하지 않는다', () => {
        const input = [ATTEMPT_1, ATTEMPT_2, ATTEMPT_3];
        const snapshot = [...input];

        render(<AttemptTimeline attempts={input} tagCatalog={CATALOG_FX} />);

        expect(input).toEqual(snapshot);
        expect(input[0]).toBe(ATTEMPT_1);
    });

    it('회차 버튼을 Tab으로 포커스하고 Enter를 누르면 선택이 전환된다', async () => {
        const user = userEvent.setup();
        render(
            <AttemptTimeline
                attempts={[ATTEMPT_1, ATTEMPT_2, ATTEMPT_3]}
                tagCatalog={CATALOG_FX}
            />,
        );

        const list = screen.getByRole('group', { name: '회차 목록' });
        const firstAttemptButton = within(list).getByText('1회차').closest('button')!;

        firstAttemptButton.focus();
        await user.keyboard('{Enter}');

        expect(firstAttemptButton).toHaveAttribute('aria-current', 'true');
        expect(screen.queryByText(/점화식 다시 세워 통과/)).toBeNull();
    });

    it('회차 버튼의 점 색은 ResultBadge와 같은 톤(success/destructive/warning)이다', () => {
        const holdAttempt = { ...ATTEMPT_2, seq: 4, result: 'HOLD' as const, memo: undefined };
        render(
            <AttemptTimeline
                attempts={[ATTEMPT_1, ATTEMPT_3, holdAttempt]}
                tagCatalog={CATALOG_FX}
            />,
        );

        const list = screen.getByRole('group', { name: '회차 목록' });
        const dotFor = (label: string) =>
            within(list)
                .getByText(label)
                .closest('button')!
                .querySelector('span[aria-hidden="true"]')!;

        expect(dotFor('1회차')).toHaveClass('bg-destructive'); // WRONG
        expect(dotFor('3회차')).toHaveClass('bg-success'); // CORRECT
        expect(dotFor('4회차')).toHaveClass('bg-warning'); // HOLD
    });

    it('회차 목록은 role="group" + aria-current — role="tab"은 쓰지 않는다 (의도적 선택)', () => {
        render(
            <AttemptTimeline
                attempts={[ATTEMPT_1, ATTEMPT_2, ATTEMPT_3]}
                tagCatalog={CATALOG_FX}
            />,
        );

        const list = screen.getByRole('group', { name: '회차 목록' });
        expect(list).toHaveAttribute('role', 'group');
        expect(screen.queryByRole('tab')).toBeNull();
        expect(screen.queryByRole('tablist')).toBeNull();
    });
});
