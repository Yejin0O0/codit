import { render, screen } from '@testing-library/react';

import ExtensionPageApp from './App';

const LOGIN_PLACEHOLDER = '로그인 화면 자리';
const HISTORY_PLACEHOLDER = '문제풀이 기록 화면 자리';
const MOCK_USER = 'you@example.com';

describe('ExtensionPageApp', () => {
    it('should render the login-screen placeholder when initialAuthed is false', () => {
        render(<ExtensionPageApp initialAuthed={false} />);

        expect(screen.queryByLabelText(LOGIN_PLACEHOLDER)).not.toBeNull();
        expect(screen.queryByLabelText(HISTORY_PLACEHOLDER)).toBeNull();
    });

    it('should render the problem-history placeholder when initialAuthed is true', () => {
        render(<ExtensionPageApp initialAuthed />);

        expect(screen.queryByLabelText(HISTORY_PLACEHOLDER)).not.toBeNull();
        expect(screen.queryByLabelText(LOGIN_PLACEHOLDER)).toBeNull();
    });

    it('should default to the login-screen placeholder when initialAuthed is omitted', () => {
        render(<ExtensionPageApp />);

        expect(screen.queryByLabelText(LOGIN_PLACEHOLDER)).not.toBeNull();
    });

    it('should mount the shell with max-width 400 and a PageHeader without userName in the unauthenticated branch', () => {
        const { container } = render(<ExtensionPageApp initialAuthed={false} />);

        const shellContainer = container.querySelector(
            '[data-slot="extension-page-shell-container"]',
        );

        expect(shellContainer).not.toBeNull();
        expect(shellContainer).toHaveStyle({ maxWidth: '400px' });
        expect(screen.queryByText(MOCK_USER)).toBeNull();
        expect(container.querySelector('[data-slot="page-header-user"]')).toBeNull();
    });

    it('should mount the shell with max-width 720 and a PageHeader with the mock userName in the authenticated branch', () => {
        const { container } = render(<ExtensionPageApp initialAuthed />);

        const shellContainer = container.querySelector(
            '[data-slot="extension-page-shell-container"]',
        );

        expect(shellContainer).not.toBeNull();
        expect(shellContainer).toHaveStyle({ maxWidth: '720px' });
        expect(screen.queryByText(MOCK_USER)).not.toBeNull();
    });

    it('should render both auth branches at the same document URL (no router / no navigation)', () => {
        const urlBefore = window.location.href;

        const { unmount } = render(<ExtensionPageApp initialAuthed={false} />);
        expect(screen.queryByLabelText(LOGIN_PLACEHOLDER)).not.toBeNull();
        unmount();

        render(<ExtensionPageApp initialAuthed />);
        expect(screen.queryByLabelText(HISTORY_PLACEHOLDER)).not.toBeNull();

        expect(window.location.href).toBe(urlBefore);
    });
});
