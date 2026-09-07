import { fakeBrowser } from 'wxt/testing/fake-browser';

import { authenticatedFetch } from './authenticatedFetch';

const API_BASE_URL = 'http://localhost:8080';

beforeEach(() => {
    fakeBrowser.reset();
    vi.restoreAllMocks();
});

describe('authenticatedFetch', () => {
    it('유효하고 만료 여유가 있는 토큰이면 Bearer 토큰을 담아 요청을 그대로 전송한다', async () => {
        const token = 'valid-token';
        await fakeBrowser.storage.local.set({
            accessToken: token,
            expiresAt: Date.now() + 30 * 60 * 1000,
        });

        const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValue(
            new Response('ok', { status: 200 }),
        );

        await authenticatedFetch(`${API_BASE_URL}/api/test`);

        expect(mockFetch).toHaveBeenCalledOnce();
        expect(mockFetch).toHaveBeenCalledWith(
            `${API_BASE_URL}/api/test`,
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: `Bearer ${token}`,
                }),
            }),
        );
    });

    it('만료까지 5분 이내인 토큰이면 refresh를 먼저 호출한 뒤 원래 요청을 전송한다', async () => {
        await fakeBrowser.storage.local.set({
            accessToken: 'near-expiry-token',
            expiresAt: Date.now() + 3 * 60 * 1000,
        });

        const mockFetch = vi.spyOn(global, 'fetch')
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({ accessToken: 'new-token', expiresAt: Date.now() + 60 * 60 * 1000 }),
                    { status: 200 },
                ),
            )
            .mockResolvedValueOnce(new Response('ok', { status: 200 }));

        await authenticatedFetch(`${API_BASE_URL}/api/test`);

        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(mockFetch.mock.calls[0]![0] as string).toContain('/api/auth/refresh');
        expect(mockFetch.mock.calls[1]![0] as string).toBe(`${API_BASE_URL}/api/test`);
    });

    it('401 fallback refresh 성공 시 원래 요청을 재전송한다', async () => {
        await fakeBrowser.storage.local.set({
            accessToken: 'token',
            expiresAt: Date.now() + 30 * 60 * 1000,
        });

        const mockFetch = vi.spyOn(global, 'fetch')
            .mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }))
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({ accessToken: 'new-token', expiresAt: Date.now() + 60 * 60 * 1000 }),
                    { status: 200 },
                ),
            )
            .mockResolvedValueOnce(new Response('ok', { status: 200 }));

        const response = await authenticatedFetch(`${API_BASE_URL}/api/test`);

        expect(response.status).toBe(200);
        expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('만료까지 정확히 5분이면 선제 refresh를 트리거한다', async () => {
        vi.useFakeTimers();
        const now = Date.now();
        await fakeBrowser.storage.local.set({
            accessToken: 'token',
            expiresAt: now + 5 * 60 * 1000,
        });

        const mockFetch = vi.spyOn(global, 'fetch')
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({ accessToken: 'new-token', expiresAt: now + 60 * 60 * 1000 }),
                    { status: 200 },
                ),
            )
            .mockResolvedValueOnce(new Response('ok', { status: 200 }));

        await authenticatedFetch(`${API_BASE_URL}/api/test`);

        vi.useRealTimers();
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(mockFetch.mock.calls[0]![0] as string).toContain('/api/auth/refresh');
    });

    it('만료까지 5분을 초과하면 선제 refresh를 하지 않는다', async () => {
        const token = 'valid-token';
        await fakeBrowser.storage.local.set({
            accessToken: token,
            expiresAt: Date.now() + 6 * 60 * 1000,
        });

        const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValue(
            new Response('ok', { status: 200 }),
        );

        await authenticatedFetch(`${API_BASE_URL}/api/test`);

        expect(mockFetch).toHaveBeenCalledOnce();
        expect(mockFetch).toHaveBeenCalledWith(
            `${API_BASE_URL}/api/test`,
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: `Bearer ${token}`,
                }),
            }),
        );
    });

    it('refresh 토큰도 만료된 경우 storage에 sessionExpiredMessage를 세팅하고 토큰을 삭제한다', async () => {
        await fakeBrowser.storage.local.set({
            accessToken: 'token',
            expiresAt: Date.now() + 30 * 60 * 1000,
        });

        vi.spyOn(global, 'fetch')
            .mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }))
            .mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }));

        await authenticatedFetch(`${API_BASE_URL}/api/test`);

        const stored = await fakeBrowser.storage.local.get([
            'accessToken',
            'expiresAt',
            'sessionExpiredMessage',
        ]);
        expect(stored.sessionExpiredMessage).toBe('세션이 만료되었습니다');
        expect(stored.accessToken).toBeUndefined();
    });

    it('401 발생 시 refresh 재시도를 1회 초과하지 않는다', async () => {
        await fakeBrowser.storage.local.set({
            accessToken: 'token',
            expiresAt: Date.now() + 30 * 60 * 1000,
        });

        const mockFetch = vi
            .spyOn(global, 'fetch')
            .mockResolvedValue(new Response('Unauthorized', { status: 401 }));

        await authenticatedFetch(`${API_BASE_URL}/api/test`);

        expect(mockFetch.mock.calls.length).toBeLessThanOrEqual(3);
        const refreshCalled = mockFetch.mock.calls.some(
            (call) => typeof call[0] === 'string' && call[0].includes('/api/auth/refresh'),
        );
        expect(refreshCalled).toBe(true);
    });

    it('선제 refresh가 실패하면 sessionExpiredMessage를 세팅하고 토큰을 삭제한다', async () => {
        await fakeBrowser.storage.local.set({
            accessToken: 'token',
            expiresAt: Date.now() + 3 * 60 * 1000,
        });

        vi.spyOn(global, 'fetch').mockResolvedValueOnce(
            new Response('Unauthorized', { status: 401 }),
        );

        const response = await authenticatedFetch(`${API_BASE_URL}/api/test`);

        const stored = await fakeBrowser.storage.local.get([
            'accessToken',
            'expiresAt',
            'sessionExpiredMessage',
        ]);
        expect(stored.sessionExpiredMessage).toBe('세션이 만료되었습니다');
        expect(stored.accessToken).toBeUndefined();
        expect(response.status).toBe(401);
    });

    it('expiresAt이 없으면 선제 refresh를 하지 않고 Bearer 토큰으로 요청을 전송한다', async () => {
        await fakeBrowser.storage.local.set({ accessToken: 'token' });

        const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValue(
            new Response('ok', { status: 200 }),
        );

        await authenticatedFetch(`${API_BASE_URL}/api/test`);

        expect(mockFetch).toHaveBeenCalledOnce();
        expect(mockFetch).toHaveBeenCalledWith(
            `${API_BASE_URL}/api/test`,
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: 'Bearer token',
                }),
            }),
        );
    });

    it('재시도 요청이 401이면 sessionExpiredMessage를 세팅하지 않고 401을 반환한다', async () => {
        await fakeBrowser.storage.local.set({
            accessToken: 'token',
            expiresAt: Date.now() + 30 * 60 * 1000,
        });

        vi.spyOn(global, 'fetch')
            .mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }))
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({ accessToken: 'new-token', expiresAt: Date.now() + 60 * 60 * 1000 }),
                    { status: 200 },
                ),
            )
            .mockResolvedValueOnce(new Response('Forbidden', { status: 401 }));

        const response = await authenticatedFetch(`${API_BASE_URL}/api/test`);

        expect(response.status).toBe(401);
        const stored = await fakeBrowser.storage.local.get('sessionExpiredMessage');
        expect(stored.sessionExpiredMessage).toBeUndefined();
    });
});
