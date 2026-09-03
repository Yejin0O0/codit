import { render, screen } from '@testing-library/react';

import ExtensionPageApp from './App';

const LOGIN_PLACEHOLDER = '로그인 화면 자리';
/** #9: authenticated branch 는 placeholder 대신 HistoryView(aria-label="내 문제풀이") 를 렌더한다 */
const HISTORY_VIEW_LABEL = '내 문제풀이';
const MOCK_USER = 'you@example.com';

describe('ExtensionPageApp', () => {
    it('initialAuthed가 false이면 로그인 화면 placeholder를 표시한다', () => {
        render(<ExtensionPageApp initialAuthed={false} />);

        expect(screen.queryByLabelText(LOGIN_PLACEHOLDER)).not.toBeNull();
        expect(screen.queryByLabelText(HISTORY_VIEW_LABEL)).toBeNull();
    });

    it('인증된 분기에서는 HistoryView(aria-label "내 문제풀이")를 표시한다', () => {
        render(<ExtensionPageApp initialAuthed />);

        expect(screen.queryByLabelText(HISTORY_VIEW_LABEL)).not.toBeNull();
        expect(screen.queryByLabelText(LOGIN_PLACEHOLDER)).toBeNull();
    });

    it('initialAuthed를 생략하면 기본값으로 로그인 화면 placeholder를 표시한다', () => {
        render(<ExtensionPageApp />);

        expect(screen.queryByLabelText(LOGIN_PLACEHOLDER)).not.toBeNull();
    });

    it('비인증 분기에서는 max-width 400 shell과 userName 없는 PageHeader를 mount한다', () => {
        const { container } = render(<ExtensionPageApp initialAuthed={false} />);

        const shellContainer = container.querySelector(
            '[data-slot="extension-page-shell-container"]',
        );

        expect(shellContainer).not.toBeNull();
        expect(shellContainer).toHaveStyle({ maxWidth: '400px' });
        expect(screen.queryByText(MOCK_USER)).toBeNull();
        expect(container.querySelector('[data-slot="page-header-user"]')).toBeNull();
    });

    it('인증된 분기에서는 max-width 720 shell과 mock userName을 가진 PageHeader를 mount한다', () => {
        const { container } = render(<ExtensionPageApp initialAuthed />);

        const shellContainer = container.querySelector(
            '[data-slot="extension-page-shell-container"]',
        );

        expect(shellContainer).not.toBeNull();
        expect(shellContainer).toHaveStyle({ maxWidth: '720px' });
        expect(screen.queryByText(MOCK_USER)).not.toBeNull();
    });

    it('두 인증 분기를 같은 document URL에서 표시한다(router / navigation 없음)', () => {
        const urlBefore = window.location.href;

        const { unmount } = render(<ExtensionPageApp initialAuthed={false} />);
        expect(screen.queryByLabelText(LOGIN_PLACEHOLDER)).not.toBeNull();
        unmount();

        render(<ExtensionPageApp initialAuthed />);
        expect(screen.queryByLabelText(HISTORY_VIEW_LABEL)).not.toBeNull();

        expect(window.location.href).toBe(urlBefore);
    });
});
