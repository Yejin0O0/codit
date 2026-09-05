import type { AuthStatus } from '@codit/shared-types';
import { render, screen } from '@testing-library/react';

import * as useAuthModule from '../hooks/useAuth';

import PopupApp from './PopupApp';

vi.mock('../hooks/useAuth');

const mockAuthState = (status: AuthStatus, extra: object = {}) =>
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
        authState: {
            user: null,
            accessToken: null,
            expiresAt: null,
            error: null,
            status,
            ...extra,
        },
        loginWithGoogle: vi.fn(),
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
});
