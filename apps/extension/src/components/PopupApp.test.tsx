import type { AuthStatus } from '@codit/shared-types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as useAuthModule from '../hooks/useAuth';

import PopupApp from './PopupApp';

vi.mock('../hooks/useAuth');

const mockAuthState = (
    status: AuthStatus,
    extra: object = {},
    { logout = vi.fn() }: { logout?: ReturnType<typeof vi.fn> } = {},
) =>
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
        authState: {
            user: null,
            accessToken: null,
            expiresAt: null,
            error: null,
            status,
            sessionExpiredMessage: null,
            ...extra,
        },
        loginWithGoogle: vi.fn(),
        logout,
    });

describe('PopupApp', () => {
    it('status가 idle이면 LoginPage가 렌더링되어야 한다', () => {
        mockAuthState('idle');
        render(<PopupApp />);
        expect(screen.queryByTestId('login-page')).toBeInTheDocument();
    });

    it('status가 authenticated이면 MainPage가 렌더링되어야 한다', () => {
        mockAuthState('authenticated', { accessToken: 'token' });
        render(<PopupApp />);
        expect(screen.queryByTestId('main-page')).toBeInTheDocument();
    });

    it('status가 error이면 LoginPage가 렌더링되어야 한다', () => {
        mockAuthState('error', { error: '로그인 실패' });
        render(<PopupApp />);
        expect(screen.queryByTestId('login-page')).toBeInTheDocument();
    });

    it('status가 error이면 에러 메시지가 표시되어야 한다', () => {
        mockAuthState('error', { error: '로그인 실패' });
        render(<PopupApp />);
        expect(screen.getByRole('alert')).toHaveTextContent('로그인 실패');
    });

    it('MainPage의 로그아웃 버튼 클릭 시 useAuth().logout이 호출되어야 한다', async () => {
        const logout = vi.fn().mockResolvedValue(undefined);
        mockAuthState('authenticated', { accessToken: 'token' }, { logout });
        const user = userEvent.setup();
        render(<PopupApp />);

        await user.click(screen.getByRole('button', { name: '로그아웃' }));

        expect(logout).toHaveBeenCalledTimes(1);
    });

    it('sessionExpiredMessage가 있으면 LoginPage에 안내 문구가 표시되어야 한다', () => {
        mockAuthState('idle', { sessionExpiredMessage: '세션이 만료되었습니다' });
        render(<PopupApp />);
        expect(screen.getByRole('status')).toHaveTextContent('세션이 만료되었습니다');
    });
});
