import { renderHook, act } from '@testing-library/react';
import { fakeBrowser } from 'wxt/testing/fake-browser';

import { useAuth } from './useAuth';

beforeEach(() => {
    fakeBrowser.reset();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('useAuth', () => {
    it('초기 렌더링 시 status가 idle이어야 한다', () => {
        const { result } = renderHook(() => useAuth());
        expect(result.current.authState.status).toBe('idle');
    });

    it('loginWithGoogle 호출 시 status가 loading으로 변경되어야 한다', async () => {
        const { result } = renderHook(() => useAuth());
        act(() => {
            result.current.loginWithGoogle();
        });
        expect(result.current.authState.status).toBe('loading');
    });

    it('로그인 성공 후 status가 authenticated가 되고 토큰이 chrome.storage.local에 저장되어야 한다', async () => {
        vi.spyOn(chrome.identity, 'getRedirectURL').mockReturnValue('https://abc.chromiumapp.org/');
        vi.spyOn(chrome.identity, 'launchWebAuthFlow').mockImplementation(async ({ url }) => {
            const state = new URL(url as string).searchParams.get('state') ?? '';
            return `https://abc.chromiumapp.org/?code=test-code&state=${state}`;
        });
        const mockUser = { id: 1, email: 'test@gmail.com', nickname: 'Test User', role: 'USER' };
        vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ accessToken: 'test-token', expiresAt: 9999999, user: mockUser }),
        } as unknown as Response);

        const { result } = renderHook(() => useAuth());
        await act(async () => {
            await result.current.loginWithGoogle();
        });
        expect(result.current.authState.status).toBe('authenticated');
        expect(result.current.authState.accessToken).not.toBeNull();
        const stored = await fakeBrowser.storage.local.get(['accessToken', 'expiresAt']);
        expect(stored.accessToken).not.toBeUndefined();
        expect(stored.expiresAt).not.toBeUndefined();
    });

    it('로그인 성공 시 storage에 남아있던 sessionExpiredMessage를 지운다', async () => {
        await fakeBrowser.storage.local.set({ sessionExpiredMessage: '세션이 만료되었습니다' });
        vi.spyOn(chrome.identity, 'getRedirectURL').mockReturnValue('https://abc.chromiumapp.org/');
        vi.spyOn(chrome.identity, 'launchWebAuthFlow').mockImplementation(async ({ url }) => {
            const state = new URL(url as string).searchParams.get('state') ?? '';
            return `https://abc.chromiumapp.org/?code=test-code&state=${state}`;
        });
        const mockUser = { id: 1, email: 'test@gmail.com', nickname: 'Test User', role: 'USER' };
        vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ accessToken: 'test-token', expiresAt: 9999999, user: mockUser }),
        } as unknown as Response);

        const { result } = renderHook(() => useAuth());
        await act(async () => {
            await result.current.loginWithGoogle();
        });

        expect(result.current.authState.sessionExpiredMessage).toBeNull();
        const stored = await fakeBrowser.storage.local.get('sessionExpiredMessage');
        expect(stored.sessionExpiredMessage).toBeUndefined();
    });

    it('로그인 성공 시 storage 쓰기를 한 번의 set 호출로 묶어 원자적으로 처리한다', async () => {
        await fakeBrowser.storage.local.set({ sessionExpiredMessage: '세션이 만료되었습니다' });
        vi.spyOn(chrome.identity, 'getRedirectURL').mockReturnValue('https://abc.chromiumapp.org/');
        vi.spyOn(chrome.identity, 'launchWebAuthFlow').mockImplementation(async ({ url }) => {
            const state = new URL(url as string).searchParams.get('state') ?? '';
            return `https://abc.chromiumapp.org/?code=test-code&state=${state}`;
        });
        const mockUser = { id: 1, email: 'test@gmail.com', nickname: 'Test User', role: 'USER' };
        vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ accessToken: 'test-token', expiresAt: 9999999, user: mockUser }),
        } as unknown as Response);
        const removeSpy = vi.spyOn(chrome.storage.local, 'remove');

        const { result } = renderHook(() => useAuth());
        await act(async () => {
            await result.current.loginWithGoogle();
        });

        // set 하나로 묶지 않고 set(accessToken/expiresAt) + remove(sessionExpiredMessage)로
        // 나누면 그 사이 다른 컨텍스트가 "인증됨 + 세션만료" 모순 상태를 읽을 수 있다.
        expect(removeSpy).not.toHaveBeenCalled();
    });

    it('마운트 시 chrome.storage.local에 토큰이 있으면 authenticated 상태로 복원되어야 한다', async () => {
        await fakeBrowser.storage.local.set({
            accessToken: 'stored-token',
            expiresAt: Date.now() + 1000 * 60 * 60,
        });
        const { result } = renderHook(() => useAuth());
        await act(async () => {});
        expect(result.current.authState.status).toBe('authenticated');
        expect(result.current.authState.accessToken).toBe('stored-token');
    });

    it('loginWithGoogle 실패 시 status가 error가 되고 error 메시지가 세팅되어야 한다', async () => {
        const { result } = renderHook(() => useAuth());
        await act(async () => {
            await result.current.loginWithGoogle();
        });
        expect(result.current.authState.status).toBe('error');
        expect(result.current.authState.error).not.toBeNull();
    });

    it('OAuth 팝업 취소 시 status가 idle로 유지되어야 한다', async () => {
        vi.spyOn(chrome.identity, 'getRedirectURL').mockReturnValue('https://abc.chromiumapp.org/');
        vi.spyOn(chrome.identity, 'launchWebAuthFlow').mockRejectedValue(
            new Error('The user did not approve access.')
        );

        const { result } = renderHook(() => useAuth());
        await act(async () => {
            await result.current.loginWithGoogle();
        });
        expect(result.current.authState.status).toBe('idle');
    });

    it('마운트 시 저장된 토큰이 만료됐으면 idle 상태를 유지하고 저장소를 비워야 한다', async () => {
        await fakeBrowser.storage.local.set({
            accessToken: 'stale-token',
            expiresAt: Date.now() - 1000,
        });
        const { result } = renderHook(() => useAuth());
        await act(async () => {});
        expect(result.current.authState.status).toBe('idle');
        const stored = await fakeBrowser.storage.local.get(['accessToken', 'expiresAt']);
        expect(stored.accessToken).toBeUndefined();
    });

    it('백엔드 에러 메시지에 "user"가 섞여 있어도 취소로 오분류하지 않아야 한다', async () => {
        vi.spyOn(chrome.identity, 'getRedirectURL').mockReturnValue('https://abc.chromiumapp.org/');
        vi.spyOn(chrome.identity, 'launchWebAuthFlow').mockImplementation(async ({ url }) => {
            const state = new URL(url as string).searchParams.get('state') ?? '';
            return `https://abc.chromiumapp.org/?code=test-code&state=${state}`;
        });
        vi.spyOn(global, 'fetch').mockRejectedValue(new Error('user profile invalid'));

        const { result } = renderHook(() => useAuth());
        await act(async () => {
            await result.current.loginWithGoogle();
        });
        expect(result.current.authState.status).toBe('error');
        expect(result.current.authState.error).not.toBeNull();
    });

    it('마운트 시 chrome.storage.local이 비어있으면 status가 idle이어야 한다', async () => {
        const { result } = renderHook(() => useAuth());
        await act(async () => {});
        expect(result.current.authState.status).toBe('idle');
    });

    it('logout 호출 시 chrome.storage.local을 초기화하고 authState를 리셋한다', async () => {
        await fakeBrowser.storage.local.set({
            accessToken: 'test-token',
            expiresAt: Date.now() + 1000 * 60 * 60,
        });
        const { result } = renderHook(() => useAuth());
        await act(async () => {});
        expect(result.current.authState.status).toBe('authenticated');

        await act(async () => {
            await result.current.logout();
        });

        expect(result.current.authState.status).toBe('idle');
        const stored = await fakeBrowser.storage.local.get(['accessToken', 'expiresAt']);
        expect(stored.accessToken).toBeUndefined();
    });

    it('logout 호출 시 백엔드 /api/auth/logout을 Authorization 헤더와 함께 호출한다', async () => {
        await fakeBrowser.storage.local.set({
            accessToken: 'test-token',
            expiresAt: Date.now() + 1000 * 60 * 60,
        });
        const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValue(
            new Response(null, { status: 200 }),
        );
        const { result } = renderHook(() => useAuth());
        await act(async () => {});

        await act(async () => {
            await result.current.logout();
        });

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/auth/logout'),
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    Authorization: 'Bearer test-token',
                }),
            }),
        );
    });

    it('마운트 시 storage에 이미 sessionExpiredMessage가 있으면 authState에 반영한다 (팝업 재오픈 시나리오)', async () => {
        await fakeBrowser.storage.local.set({ sessionExpiredMessage: '세션이 만료되었습니다' });

        const { result } = renderHook(() => useAuth());
        await act(async () => {});

        expect(result.current.authState.sessionExpiredMessage).toBe('세션이 만료되었습니다');
        expect(result.current.authState.status).toBe('idle');
    });

    it('silent refresh로 storage의 accessToken이 갱신되면 authState.accessToken도 갱신된다', async () => {
        await fakeBrowser.storage.local.set({
            accessToken: 'old-token',
            expiresAt: Date.now() + 1000 * 60 * 60,
        });
        const { result } = renderHook(() => useAuth());
        await act(async () => {});
        expect(result.current.authState.status).toBe('authenticated');

        await act(async () => {
            await fakeBrowser.storage.local.set({
                accessToken: 'refreshed-token',
                expiresAt: Date.now() + 1000 * 60 * 120,
            });
        });

        expect(result.current.authState.accessToken).toBe('refreshed-token');
    });

    it('storage에 sessionExpiredMessage가 생기면 authState를 초기화하고 sessionExpiredMessage를 세팅한다', async () => {
        const { result } = renderHook(() => useAuth());
        await act(async () => {});

        await act(async () => {
            await fakeBrowser.storage.local.set({ sessionExpiredMessage: '세션이 만료되었습니다' });
        });

        expect(result.current.authState.sessionExpiredMessage).toBe('세션이 만료되었습니다');
        expect(result.current.authState.status).toBe('idle');
    });
});
