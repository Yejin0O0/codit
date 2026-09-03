import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CollapsedTimer } from './collapsed-timer';

describe('CollapsedTimer', () => {
    it('status 가 running 이면 mm:ss 를 렌더하고 check 아이콘은 없다', () => {
        const { container } = render(
            <CollapsedTimer seconds={135} status="running" onExpand={vi.fn()} />,
        );

        expect(screen.getByText('02:15')).toBeInTheDocument();
        // Codit 마크 + 펼치기 chevron = 2개 (check 없음)
        expect(container.querySelectorAll('svg')).toHaveLength(2);
        expect(container.querySelector('svg path[d="M5 10.5l3.2 3.2L15 7"]')).toBeNull();
    });

    it('status 가 stopped 이면 mm:ss 와 함께 check 아이콘을 렌더한다', () => {
        const { container } = render(
            <CollapsedTimer seconds={450} status="stopped" onExpand={vi.fn()} />,
        );

        expect(screen.getByText('07:30')).toBeInTheDocument();
        // Codit 마크 + check + 펼치기 chevron = 3개
        expect(container.querySelectorAll('svg')).toHaveLength(3);
        expect(container.querySelector('svg path[d="M5 10.5l3.2 3.2L15 7"]')).not.toBeNull();
    });

    it('펼치기 chevron(chevron-up) SVG 가 running / stopped 모두에서 상시 렌더된다', () => {
        for (const status of ['running', 'stopped'] as const) {
            const { container, unmount } = render(
                <CollapsedTimer seconds={60} status={status} onExpand={vi.fn()} />,
            );
            expect(container.querySelector('svg path[d="M4 10l4-4 4 4"]')).not.toBeNull();
            unmount();
        }
    });

    it('주어진 seconds 를 mm:ss 로 표시한다', () => {
        render(<CollapsedTimer seconds={75} status="running" onExpand={vi.fn()} />);

        expect(screen.getByText('01:15')).toBeInTheDocument();
    });

    it('클릭 시 onExpand 를 한 번 호출한다', async () => {
        const onExpand = vi.fn();
        const user = userEvent.setup();
        render(<CollapsedTimer seconds={0} status="running" onExpand={onExpand} />);

        await user.click(screen.getByRole('button'));

        expect(onExpand).toHaveBeenCalledTimes(1);
    });

    it('Enter 와 Space 로 onExpand 를 호출한다', async () => {
        const onExpand = vi.fn();
        const user = userEvent.setup();
        render(<CollapsedTimer seconds={0} status="running" onExpand={onExpand} />);

        screen.getByRole('button').focus();
        await user.keyboard('{Enter}');
        await user.keyboard('[Space]');

        expect(onExpand).toHaveBeenCalledTimes(2);
    });

    it('running 이면 accessible name 에 펼치기 동작 + 경과 시간 + 현재 mm:ss 를 포함한다', () => {
        render(<CollapsedTimer seconds={135} status="running" onExpand={vi.fn()} />);

        const btn = screen.getByRole('button');
        expect(btn).toHaveAccessibleName(/펼치기/);
        expect(btn).toHaveAccessibleName(/경과 시간/);
        expect(btn).toHaveAccessibleName(/02:15/);
    });

    it('stopped 이면 accessible name 에 펼치기 + 완료됨 + 풀이 시간 + mm:ss 를 포함한다', () => {
        render(<CollapsedTimer seconds={450} status="stopped" onExpand={vi.fn()} />);

        const btn = screen.getByRole('button');
        expect(btn).toHaveAccessibleName(/펼치기/);
        expect(btn).toHaveAccessibleName(/완료됨/);
        expect(btn).toHaveAccessibleName(/풀이 시간/);
        expect(btn).toHaveAccessibleName(/07:30/);
    });

    it('seconds 가 0 이면 00:00 을 렌더한다', () => {
        render(<CollapsedTimer seconds={0} status="running" onExpand={vi.fn()} />);

        expect(screen.getByText('00:00')).toBeInTheDocument();
    });

    it('running ↔ stopped 전환 시 버튼은 하나이고 보이는 mm:ss 텍스트 노드가 유지된다', () => {
        const { rerender } = render(
            <CollapsedTimer seconds={135} status="running" onExpand={vi.fn()} />,
        );
        expect(screen.getAllByRole('button')).toHaveLength(1);
        expect(screen.getByText('02:15')).toBeInTheDocument();

        rerender(<CollapsedTimer seconds={135} status="stopped" onExpand={vi.fn()} />);
        expect(screen.getAllByRole('button')).toHaveLength(1);
        expect(screen.getByText('02:15')).toBeInTheDocument();
    });

    it('장식 SVG(Codit 마크·check)는 aria-hidden 이라 accessible name 에 섞이지 않는다', () => {
        const { container } = render(
            <CollapsedTimer seconds={450} status="stopped" onExpand={vi.fn()} />,
        );

        const svgs = [...container.querySelectorAll('svg')];
        expect(svgs.length).toBeGreaterThan(0);
        svgs.forEach((svg) => expect(svg).toHaveAttribute('aria-hidden', 'true'));
    });

    it('pill 버튼에 aria-live 속성이 없다', () => {
        render(<CollapsedTimer seconds={0} status="running" onExpand={vi.fn()} />);

        expect(screen.getByRole('button')).not.toHaveAttribute('aria-live');
    });
});
