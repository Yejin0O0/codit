import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PopupApp from './PopupApp';

// useAuth를 모킹하지 않고 실제 훅을 그대로 사용한다. PopupApp.test.tsx의
// useAuth 모킹 테스트는 "클릭 시 logout() 호출"과 "idle이면 LoginPage 렌더링"을
// 각각 따로 검증할 뿐, logout()이 실제로 idle 전이를 유발하는지는 보장하지 않는다.
// 이 테스트는 그 인과관계(AC-1: 로그아웃 후 MainPage→LoginPage 전환)를 실제 흐름으로 확인한다.
describe('PopupApp 로그아웃 실제 흐름', () => {
    it('로그인된 상태에서 로그아웃 버튼을 클릭하면 실제 logout() 실행 결과로 LoginPage가 렌더링되어야 한다', async () => {
        await chrome.storage.local.set({
            accessToken: 'test-token',
            expiresAt: Date.now() + 1000 * 60 * 60,
        });
        vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));

        const user = userEvent.setup();
        render(<PopupApp />);

        expect(await screen.findByTestId('main-page')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: '로그아웃' }));

        expect(await screen.findByTestId('login-page')).toBeInTheDocument();
        expect(screen.queryByTestId('main-page')).not.toBeInTheDocument();

        const stored = await chrome.storage.local.get(['accessToken', 'expiresAt']);
        expect(stored.accessToken).toBeUndefined();
    });
});
