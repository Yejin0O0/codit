import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TimerScreen } from './TimerScreen';

const noop = () => {};

describe('TimerScreen — R1 재설계', () => {
    it('problemTitle 주입 시 헤더 heading(level 2)에 그 제목을 표시한다', () => {
        render(
            <TimerScreen
                problemId="1024"
                problemTitle="1024. 최단 경로"
                elapsedSeconds={0}
                onComplete={noop}
            />,
        );

        expect(
            screen.getByRole('heading', { level: 2, name: '1024. 최단 경로' }),
        ).toBeInTheDocument();
    });

    it('problemTitle 없으면 헤더 heading 에 "문제 #{id}" 폴백을 표시한다', () => {
        render(<TimerScreen problemId="1024" elapsedSeconds={0} onComplete={noop} />);

        expect(screen.getByRole('heading', { level: 2, name: '문제 #1024' })).toBeInTheDocument();
    });

    it('"풀이 타이머" 텍스트를 렌더하지 않는다', () => {
        render(<TimerScreen problemId="1024" elapsedSeconds={0} onComplete={noop} />);

        expect(screen.queryByText('풀이 타이머')).toBeNull();
    });

    it('제목을 heading 한 곳에만 표시한다 (본문 중복 없음)', () => {
        render(
            <TimerScreen
                problemId="1024"
                problemTitle="1024. 최단 경로"
                elapsedSeconds={0}
                onComplete={noop}
            />,
        );

        expect(screen.getAllByText('1024. 최단 경로')).toHaveLength(1);
    });

    it('경과 시간 mm:ss 를 렌더한다', () => {
        render(<TimerScreen problemId="1024" elapsedSeconds={125} onComplete={noop} />);

        expect(screen.getByText('02:05')).toBeInTheDocument();
    });

    it('"측정 중" 캡션과 그 앞의 aria-hidden 펄스 도트를 함께 렌더한다', () => {
        render(<TimerScreen problemId="1024" elapsedSeconds={0} onComplete={noop} />);

        const caption = screen.getByText('측정 중');
        // 캡션 줄 안에 펄스 도트가 형제로 있어야 한다 (헤더의 마크/chevron 아님)
        expect(caption.parentElement?.querySelector('[aria-hidden="true"]')).not.toBeNull();
    });

    it('"완료" 클릭 시 onComplete 를 호출한다', async () => {
        const onComplete = vi.fn();
        const user = userEvent.setup();
        render(<TimerScreen problemId="1024" elapsedSeconds={0} onComplete={onComplete} />);

        await user.click(screen.getByRole('button', { name: '완료' }));

        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('onCollapse 주입 시 접기 버튼을 렌더한다 (프레임 위임)', () => {
        render(
            <TimerScreen
                problemId="1024"
                elapsedSeconds={0}
                onComplete={noop}
                onCollapse={noop}
            />,
        );

        expect(
            screen.getByRole('button', { name: 'Codit 위젯 접기' }),
        ).toBeInTheDocument();
    });
});
