import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';

import { PanelShell } from './panel-shell';

/** 헤더 요소 — 제목 텍스트의 가장 가까운 div. h2/span 어느 쪽이어도 동작. */
const headerOf = (title: string) => screen.getByText(title).closest('div') as HTMLElement;

describe('PanelShell — 회귀 가드 (동작 불변)', () => {
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

    it('onCollapse 미주입 시 헤더에 버튼이 없다', () => {
        render(
            <PanelShell title="메모" step="2 / 3">
                <div>body</div>
            </PanelShell>,
        );

        expect(headerOf('메모').querySelector('button')).toBeNull();
    });

    it('collapseControlRef 로 접기 버튼 요소에 접근할 수 있다', () => {
        const ref = createRef<HTMLButtonElement>();
        render(
            <PanelShell title="풀이 타이머" onCollapse={vi.fn()} collapseControlRef={ref}>
                <div>body</div>
            </PanelShell>,
        );

        expect(ref.current).toBe(screen.getByRole('button', { name: 'Codit 타이머 접기' }));
    });
});

describe('PanelShell — 제목 시맨틱 (신규)', () => {
    it('title 을 heading(level 2)으로 렌더한다', () => {
        render(
            <PanelShell title="풀이 타이머">
                <div>body</div>
            </PanelShell>,
        );

        expect(
            screen.queryByRole('heading', { level: 2, name: '풀이 타이머' }),
        ).toBeInTheDocument();
    });
});

describe('PanelShell — step 도트 (신규)', () => {
    it('step="2 / 4" → 도트 4개, 앞 2개 data-filled="true" / 뒤 2개 "false"', () => {
        render(
            <PanelShell title="메모" step="2 / 4">
                <div>body</div>
            </PanelShell>,
        );

        const group = screen.queryByLabelText('2 / 4 단계');
        expect(group).toBeInTheDocument();
        const dots = group!.querySelectorAll('[data-filled]');
        expect(dots).toHaveLength(4);
        expect(group!.querySelectorAll('[data-filled="true"]')).toHaveLength(2);
        expect(group!.querySelectorAll('[data-filled="false"]')).toHaveLength(2);
        expect(dots[0]).toHaveAttribute('data-filled', 'true');
        expect(dots[3]).toHaveAttribute('data-filled', 'false');
    });

    it('step="3 / 3" → 도트 3개 전부 data-filled="true"', () => {
        render(
            <PanelShell title="태그 선택" step="3 / 3">
                <div>body</div>
            </PanelShell>,
        );

        const group = screen.queryByLabelText('3 / 3 단계');
        expect(group).toBeInTheDocument();
        expect(group!.querySelectorAll('[data-filled]')).toHaveLength(3);
        expect(group!.querySelectorAll('[data-filled="true"]')).toHaveLength(3);
    });

    it('step="1 / 1" → 도트 1개, data-filled="true"', () => {
        render(
            <PanelShell title="메모" step="1 / 1">
                <div>body</div>
            </PanelShell>,
        );

        const group = screen.queryByLabelText('1 / 1 단계');
        expect(group).toBeInTheDocument();
        const dots = group!.querySelectorAll('[data-filled]');
        expect(dots).toHaveLength(1);
        expect(dots[0]).toHaveAttribute('data-filled', 'true');
    });

    it('step + onCollapse 동시 주입 → 도트 그룹과 접기 버튼을 둘 다 렌더한다', () => {
        render(
            <PanelShell title="메모" step="2 / 3" onCollapse={vi.fn()}>
                <div>body</div>
            </PanelShell>,
        );

        expect(screen.queryByLabelText('2 / 3 단계')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Codit 타이머 접기' })).toBeInTheDocument();
    });

    it('step 미주입 시 도트 그룹을 렌더하지 않는다', () => {
        render(
            <PanelShell title="풀이 타이머">
                <div>body</div>
            </PanelShell>,
        );

        expect(screen.queryByLabelText(/단계$/)).toBeNull();
    });

    it('step="곧 완료" (형식 불일치) → 원문 텍스트를 렌더하고 도트는 없다', () => {
        render(
            <PanelShell title="메모" step="곧 완료">
                <div>body</div>
            </PanelShell>,
        );

        expect(screen.getByText('곧 완료')).toBeInTheDocument();
        expect(screen.queryByLabelText(/단계$/)).toBeNull();
    });

    it('step="5 / 3" (n > N) → 파싱 실패로 원문 텍스트를 렌더한다', () => {
        render(
            <PanelShell title="메모" step="5 / 3">
                <div>body</div>
            </PanelShell>,
        );

        expect(screen.getByText('5 / 3')).toBeInTheDocument();
        expect(screen.queryByLabelText('5 / 3 단계')).toBeNull();
    });

    it('step="0 / 3" (n = 0) → 파싱 실패로 원문 텍스트를 렌더한다', () => {
        render(
            <PanelShell title="메모" step="0 / 3">
                <div>body</div>
            </PanelShell>,
        );

        expect(screen.getByText('0 / 3')).toBeInTheDocument();
        expect(screen.queryByLabelText(/단계$/)).toBeNull();
    });
});

describe('PanelShell — 레이아웃 (구분 A: divider 유지)', () => {
    it('헤더에 border-b, footer 컨테이너에 border-t 가 있다', () => {
        render(
            <PanelShell title="풀이 타이머" footer={<span>footer-x</span>}>
                <div>body-x</div>
            </PanelShell>,
        );

        expect(headerOf('풀이 타이머').className).toMatch(/border-b/);
        const footer = screen.getByText('footer-x').parentElement as HTMLElement;
        expect(footer.className).toMatch(/border-t/);
    });
});

describe('PanelShell drag handle (#19)', () => {
    const header = () => headerOf('풀이 타이머');

    it('dragHandlers 가 주어지면 헤더 pointerdown 시 onPointerDown 을 호출한다', () => {
        const onPointerDown = vi.fn();
        render(
            <PanelShell title="풀이 타이머" onCollapse={vi.fn()} dragHandlers={{ onPointerDown }}>
                <div>body</div>
            </PanelShell>,
        );

        fireEvent.pointerDown(header(), { clientX: 10, clientY: 10 });

        expect(onPointerDown).toHaveBeenCalledTimes(1);
    });

    it('dragHandlers 가 주어지면 헤더에 grab 커서 클래스가 있다', () => {
        render(
            <PanelShell title="풀이 타이머" dragHandlers={{ onPointerDown: vi.fn() }}>
                <div>body</div>
            </PanelShell>,
        );

        expect(header().className).toMatch(/grab/);
    });

    it('pointerdown 대상이 접기 버튼이면 onPointerDown 을 호출하지 않는다', () => {
        const onPointerDown = vi.fn();
        render(
            <PanelShell title="풀이 타이머" onCollapse={vi.fn()} dragHandlers={{ onPointerDown }}>
                <div>body</div>
            </PanelShell>,
        );

        fireEvent.pointerDown(screen.getByRole('button', { name: 'Codit 타이머 접기' }), {
            clientX: 10,
            clientY: 10,
        });

        expect(onPointerDown).not.toHaveBeenCalled();
    });

    it('dragHandlers 가 없으면 헤더에 grab 커서 클래스가 없다', () => {
        render(
            <PanelShell title="풀이 타이머">
                <div>body</div>
            </PanelShell>,
        );

        expect(header().className).not.toMatch(/grab/);
    });
});
