import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MainPage from './MainPage';

describe('MainPage', () => {
    it('로그아웃 버튼이 표시되어야 한다', () => {
        render(<MainPage onLogout={vi.fn()} />);
        expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();
    });

    it('로그아웃 버튼 클릭 시 onLogout이 호출되어야 한다', async () => {
        const onLogout = vi.fn().mockResolvedValue(undefined);
        const user = userEvent.setup();
        render(<MainPage onLogout={onLogout} />);
        await user.click(screen.getByRole('button', { name: '로그아웃' }));
        expect(onLogout).toHaveBeenCalledTimes(1);
    });

    it('로그아웃 처리 중에는 버튼이 비활성화되어 중복 클릭을 막아야 한다', async () => {
        let resolveLogout: () => void = () => {};
        const onLogout = vi.fn(
            () =>
                new Promise<void>((resolve) => {
                    resolveLogout = resolve;
                }),
        );
        const user = userEvent.setup();
        render(<MainPage onLogout={onLogout} />);
        const button = screen.getByRole('button', { name: '로그아웃' });

        await user.click(button);
        expect(button).toBeDisabled();

        await user.click(button);
        expect(onLogout).toHaveBeenCalledTimes(1);

        resolveLogout();
        await waitFor(() => expect(button).not.toBeDisabled());
    });

    it('onLogout이 실패해도 버튼이 다시 활성화되어야 한다', async () => {
        // React는 onClick 핸들러가 반환한 Promise를 추적하지 않으므로, 이 reject는
        // React 바깥에서 unhandled rejection으로 표면화된다 — 여기서는 그 자체가 아니라
        // finally로 버튼이 재활성화되는지만 검증하므로 1회성으로 흡수한다.
        const swallowRejection = () => {};
        process.once('unhandledRejection', swallowRejection);

        const onLogout = vi.fn().mockRejectedValue(new Error('network error'));
        const user = userEvent.setup();
        render(<MainPage onLogout={onLogout} />);
        const button = screen.getByRole('button', { name: '로그아웃' });

        await user.click(button);

        await waitFor(() => expect(button).not.toBeDisabled());
        process.removeListener('unhandledRejection', swallowRejection);
    });
});
