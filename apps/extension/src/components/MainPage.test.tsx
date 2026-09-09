import { render, screen } from '@testing-library/react';
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
});
