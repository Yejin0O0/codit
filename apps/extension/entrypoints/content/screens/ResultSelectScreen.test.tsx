import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ResultSelectScreen } from './ResultSelectScreen';

const noop = () => {};

describe('ResultSelectScreen — R2 재설계', () => {
    it('경과 시간을 TimerDisplay(7xl)로 mm:ss 렌더한다', () => {
        render(
            <ResultSelectScreen elapsedSeconds={754} value={null} onChange={noop} onNext={noop} />,
        );

        const value = screen.getByText('12:34');
        expect(value.className).toMatch(/text-7xl/);
    });

    it('"풀이 시간" 캡션을 도트 없이 렌더한다 (이미 멈춘 타이머)', () => {
        render(
            <ResultSelectScreen elapsedSeconds={754} value={null} onChange={noop} onNext={noop} />,
        );

        const caption = screen.getByText('풀이 시간');
        expect(caption.parentElement?.querySelector('[aria-hidden="true"]')).toBeNull();
    });

    it('ResultToggleGroup 옵션(정답/오답/보류)을 렌더한다', () => {
        render(
            <ResultSelectScreen elapsedSeconds={754} value={null} onChange={noop} onNext={noop} />,
        );

        expect(screen.getByText('정답')).toBeInTheDocument();
        expect(screen.getByText('오답')).toBeInTheDocument();
        expect(screen.getByText('보류')).toBeInTheDocument();
    });

    it('오답 클릭 시 onChange("WRONG")을 호출한다', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        render(
            <ResultSelectScreen
                elapsedSeconds={754}
                value={null}
                onChange={onChange}
                onNext={noop}
            />,
        );

        await user.click(screen.getByText('오답'));

        expect(onChange).toHaveBeenCalledWith('WRONG');
    });

    it('값 선택 후 "다음" 클릭 시 onNext 를 호출한다', async () => {
        const onNext = vi.fn();
        const user = userEvent.setup();
        render(
            <ResultSelectScreen
                elapsedSeconds={754}
                value="CORRECT"
                onChange={noop}
                onNext={onNext}
            />,
        );

        await user.click(screen.getByRole('button', { name: '다음' }));

        expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('onCollapse 주입 시 접기 버튼을 렌더한다 (프레임 위임)', () => {
        render(
            <ResultSelectScreen
                elapsedSeconds={754}
                value={null}
                onChange={noop}
                onNext={noop}
                onCollapse={noop}
            />,
        );

        expect(screen.getByRole('button', { name: 'Codit 위젯 접기' })).toBeInTheDocument();
    });

    it('elapsedSeconds=0 이어도 TimerDisplay(7xl) 로 00:00 을 렌더한다', () => {
        render(<ResultSelectScreen elapsedSeconds={0} value={null} onChange={noop} onNext={noop} />);

        const value = screen.getByText('00:00');
        expect(value.className).toMatch(/text-7xl/);
    });

    it('헤더에 step 도트 인디케이터를 렌더하지 않는다', () => {
        const { container } = render(
            <ResultSelectScreen elapsedSeconds={754} value={null} onChange={noop} onNext={noop} />,
        );

        expect(container.querySelector('[data-filled]')).toBeNull();
    });

    it('기존 muted 문장("... 만에 풀이했어요.")을 렌더하지 않는다', () => {
        render(
            <ResultSelectScreen elapsedSeconds={754} value={null} onChange={noop} onNext={noop} />,
        );

        expect(screen.queryByText(/만에 풀이했어요/)).toBeNull();
    });

    it('value 가 null 이면 "다음" 버튼이 비활성화된다', () => {
        render(
            <ResultSelectScreen elapsedSeconds={754} value={null} onChange={noop} onNext={noop} />,
        );

        expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
    });

    it('비활성 상태에서 "다음" 클릭해도 onNext 를 호출하지 않는다', async () => {
        const onNext = vi.fn();
        const user = userEvent.setup();
        render(
            <ResultSelectScreen
                elapsedSeconds={754}
                value={null}
                onChange={noop}
                onNext={onNext}
            />,
        );

        await user.click(screen.getByRole('button', { name: '다음' }));

        expect(onNext).not.toHaveBeenCalled();
    });
});
