const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8080';
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

async function doRefresh(currentToken: string): Promise<string | null> {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}` },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { accessToken: string; expiresAt: number };
    await chrome.storage.local.set({
        accessToken: data.accessToken,
        expiresAt: data.expiresAt,
    });
    return data.accessToken;
}

async function clearSessionAndNotify(): Promise<void> {
    await chrome.storage.local.set({ sessionExpiredMessage: '세션이 만료되었습니다' });
    await chrome.storage.local.remove(['accessToken', 'expiresAt']);
}

export async function authenticatedFetch(url: string, init?: RequestInit): Promise<Response> {
    const stored = await chrome.storage.local.get(['accessToken', 'expiresAt']);
    let token = stored.accessToken as string | undefined;
    const expiresAt = stored.expiresAt as number | undefined;

    if (token && typeof expiresAt === 'number' && expiresAt - Date.now() <= REFRESH_THRESHOLD_MS) {
        const newToken = await doRefresh(token);
        if (newToken) {
            token = newToken;
        } else {
            await clearSessionAndNotify();
            return new Response('Session expired', { status: 401 });
        }
    }

    const baseHeaders = (init?.headers ?? {}) as Record<string, string>;
    const headers = { ...baseHeaders, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    const response = await fetch(url, { ...init, headers });

    if (response.status === 401 && token) {
        const newToken = await doRefresh(token);
        if (newToken) {
            const retryHeaders = { ...baseHeaders, Authorization: `Bearer ${newToken}` };
            return fetch(url, { ...init, headers: retryHeaders });
        }
        await clearSessionAndNotify();
        return response;
    }

    return response;
}
