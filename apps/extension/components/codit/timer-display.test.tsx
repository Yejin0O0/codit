import { render, screen } from '@testing-library/react';

import { TimerDisplay } from './timer-display';

describe('TimerDisplay', () => {
    it('seconds 를 formatDuration(mm:ss) 텍스트로 렌더한다', () => {
        render(<TimerDisplay seconds={75} />);

        expect(screen.getByText('01:15')).toBeInTheDocument();
    });

    it('1시간 넘는 seconds 는 h:mm:ss 로 롤오버해 자릿수 폭증을 막는다', () => {
        render(<TimerDisplay seconds={7505} />);

        expect(screen.getByText('2:05:05')).toBeInTheDocument();
    });

    it('타이머 값 요소에 text-7xl 클래스가 있다', () => {
        const { container } = render(<TimerDisplay seconds={0} />);

        const value = screen.getByText('00:00');
        expect(value.className).toMatch(/text-7xl/);
        expect(container.querySelector('.text-5xl')).toBeNull();
    });

    it('running + caption → 캡션 앞에 aria-hidden 펄스 도트를 렌더한다', () => {
        render(<TimerDisplay seconds={0} caption="측정 중" running />);

        const caption = screen.getByText('측정 중');
        const dot = caption.parentElement?.querySelector('[aria-hidden="true"]');
        expect(dot).not.toBeNull();
        // 도트가 캡션 텍스트보다 DOM 순서상 앞
        expect(
            dot!.compareDocumentPosition(caption) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
    });

    it('caption 만(running 없음) → 도트 없이 캡션 텍스트만 렌더한다', () => {
        const { container } = render(<TimerDisplay seconds={0} caption="측정 중" />);

        expect(screen.getByText('측정 중')).toBeInTheDocument();
        expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    });

    it('caption 미주입 → 캡션/도트를 렌더하지 않는다', () => {
        const { container } = render(<TimerDisplay seconds={0} running />);

        expect(container.querySelector('p')).toBeNull();
        expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    });
});
