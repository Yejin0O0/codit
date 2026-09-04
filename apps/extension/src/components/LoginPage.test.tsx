import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LoginPage from './LoginPage';

describe('LoginPage', () => {
    it('Google 로그인 버튼이 표시되어야 한다', () => {
        render(<LoginPage onLoginWithGoogle={vi.fn()} isLoading={false} />);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('Google 로그인 버튼 클릭 시 onLoginWithGoogle이 호출되어야 한다', async () => {
        const onLoginWithGoogle = vi.fn();
        const user = userEvent.setup();
        render(<LoginPage onLoginWithGoogle={onLoginWithGoogle} isLoading={false} />);
        await user.click(screen.getByRole('button'));
        expect(onLoginWithGoogle).toHaveBeenCalledTimes(1);
    });

    it('isLoading이 true일 때 버튼이 비활성화되어야 한다', () => {
        render(<LoginPage onLoginWithGoogle={vi.fn()} isLoading={true} />);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('error가 있으면 에러 메시지가 표시되어야 한다', () => {
        render(<LoginPage onLoginWithGoogle={vi.fn()} isLoading={false} error="로그인 실패" />);
        expect(screen.getByRole('alert')).toHaveTextContent('로그인 실패');
    });

    it('error가 없으면 에러 메시지가 표시되지 않아야 한다', () => {
        render(<LoginPage onLoginWithGoogle={vi.fn()} isLoading={false} />);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
});
