import { renderHook, act } from '@testing-library/react';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { useAuth } from './useAuth';

beforeEach(() => {
    fakeBrowser.reset();
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
        const { result } = renderHook(() => useAuth());
        await act(async () => {
            await result.current.loginWithGoogle();
        });
        expect(result.current.authState.status).toBe('authenticated');
        expect(result.current.authState.accessToken).not.toBeNull();
        const stored = await fakeBrowser.storage.local.get('accessToken');
        expect(stored.accessToken).not.toBeUndefined();
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
        const { result } = renderHook(() => useAuth());
        await act(async () => {
            await result.current.loginWithGoogle();
        });
        expect(result.current.authState.status).toBe('idle');
    });

    it('마운트 시 chrome.storage.local이 비어있으면 status가 idle이어야 한다', async () => {
        const { result } = renderHook(() => useAuth());
        await act(async () => {});
        expect(result.current.authState.status).toBe('idle');
    });
});
