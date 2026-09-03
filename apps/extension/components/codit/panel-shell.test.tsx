import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PanelShell } from './panel-shell';

describe('PanelShell', () => {
    it('onCollapse 가 주어지면 aria-label="Codit 타이머 접기" 버튼을 렌더한다', () => {
        render(
            <PanelShell title="풀이 타이머" onCollapse={vi.fn()}>
                <div>body</div>
            </PanelShell>,
        );

        expect(screen.getByRole('button', { name: 'Codit 타이머 접기' })).toBeInTheDocument();
    });

    it('접기 버튼 클릭 시 onCollapse 를 한 번 호출한다', async () => {
        const onCollapse = vi.fn();
        const user = userEvent.setup();
        render(
            <PanelShell title="풀이 타이머" onCollapse={onCollapse}>
                <div>body</div>
            </PanelShell>,
        );

        await user.click(screen.getByRole('button', { name: 'Codit 타이머 접기' }));

        expect(onCollapse).toHaveBeenCalledTimes(1);
    });

    it('step 과 접기 버튼이 함께 주어지면 둘 다 렌더한다', () => {
        render(
            <PanelShell title="메모" step="2 / 3" onCollapse={vi.fn()}>
                <div>body</div>
            </PanelShell>,
        );

        expect(screen.getByText('2 / 3')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Codit 타이머 접기' })).toBeInTheDocument();
    });

    it('접기 버튼 내부 SVG 는 aria-hidden 이다', () => {
        render(
            <PanelShell title="풀이 타이머" onCollapse={vi.fn()}>
                <div>body</div>
            </PanelShell>,
        );

        const svg = screen.getByRole('button', { name: 'Codit 타이머 접기' }).querySelector('svg');
        expect(svg).not.toBeNull();
        expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('onCollapse 가 있어도 title / children / footer 렌더는 정상이다', () => {
        render(
            <PanelShell title="풀이 타이머" onCollapse={vi.fn()} footer={<span>footer-x</span>}>
                <div>body-x</div>
            </PanelShell>,
        );

        expect(screen.getByText('풀이 타이머')).toBeInTheDocument();
        expect(screen.getByText('body-x')).toBeInTheDocument();
        expect(screen.getByText('footer-x')).toBeInTheDocument();
    });

    it('onCollapse 미주입 시 접기 버튼을 렌더하지 않는다', () => {
        render(
            <PanelShell title="풀이 타이머">
                <div>body</div>
            </PanelShell>,
        );

        expect(screen.queryByRole('button', { name: 'Codit 타이머 접기' })).toBeNull();
    });

    it('onCollapse 미주입 시 헤더는 title(+step)만 담고 기존 레이아웃을 유지한다', () => {
        const { container } = render(
            <PanelShell title="메모" step="2 / 3">
                <div>body</div>
            </PanelShell>,
        );

        expect(screen.getByText('메모')).toBeInTheDocument();
        expect(screen.getByText('2 / 3')).toBeInTheDocument();
        const header = container.querySelector('.border-b');
        expect(header?.querySelector('button')).toBeNull();
    });
});
