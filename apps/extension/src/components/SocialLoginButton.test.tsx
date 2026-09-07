import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SocialLoginButton from './SocialLoginButton';

describe('SocialLoginButton', () => {
    it('provider에 맞는 라벨과 아이콘이 렌더링되어야 한다', () => {
        render(
            <SocialLoginButton
                provider="GOOGLE"
                onClick={vi.fn()}
                isLoading={false}
            />
        );
        expect(screen.getByText(/google/i)).toBeInTheDocument();
    });

    it('isLoading이 false일 때 클릭 시 onClick이 호출되어야 한다', async () => {
        const onClick = vi.fn();
        const user = userEvent.setup();
        render(
            <SocialLoginButton
                provider="GOOGLE"
                onClick={onClick}
                isLoading={false}
            />
        );
        await user.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('isLoading이 true일 때 스피너가 표시되고 버튼이 비활성화되어야 한다', () => {
        render(
            <SocialLoginButton
                provider="GOOGLE"
                onClick={vi.fn()}
                isLoading={true}
            />
        );
        expect(screen.getByRole('button')).toBeDisabled();
        expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('isLoading이 true일 때 클릭해도 onClick이 호출되지 않아야 한다', async () => {
        const onClick = vi.fn();
        const user = userEvent.setup();
        render(
            <SocialLoginButton
                provider="GOOGLE"
                onClick={onClick}
                isLoading={true}
            />
        );
        await user.click(screen.getByRole('button'));
        expect(onClick).not.toHaveBeenCalled();
    });
});
