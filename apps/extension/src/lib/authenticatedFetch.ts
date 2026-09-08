import type { TokenRefreshResponse } from '@codit/shared-types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8080';
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

// 'expired' — 백엔드가 REFRESH_TOKEN_NOT_FOUND/EXPIRED(401)로 명시적으로 거부한 경우에만 세션을 파기한다.
// 'network' — 오프라인·DNS 실패·백엔드 일시 장애(5xx 등) — 리프레시 토큰 자체는 멀쩡할 수 있으므로
// 세션을 파기하지 않고, 아직 만료되지 않은 기존 access token으로 원래 요청을 계속 시도한다.
type RefreshResult = { ok: true; accessToken: string } | { ok: false; reason: 'expired' | 'network' };

let inFlightRefresh: Promise<RefreshResult> | null = null;

async function doRefresh(currentToken: string): Promise<RefreshResult> {
    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${currentToken}` },
        });
    } catch {
        return { ok: false, reason: 'network' };
    }
    if (!response.ok) {
        return { ok: false, reason: response.status === 401 ? 'expired' : 'network' };
    }
    const data = (await response.json()) as TokenRefreshResponse;
    await chrome.storage.local.set({
        accessToken: data.accessToken,
        expiresAt: data.expiresAt,
    });
    await chrome.storage.local.remove('sessionExpiredMessage');
    return { ok: true, accessToken: data.accessToken };
}

function refreshOnce(currentToken: string): Promise<RefreshResult> {
    if (!inFlightRefresh) {
        inFlightRefresh = doRefresh(currentToken).finally(() => {
            inFlightRefresh = null;
        });
    }
    return inFlightRefresh;
}

function toHeaderRecord(headers?: HeadersInit): Record<string, string> {
    return Object.fromEntries(new Headers(headers).entries());
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
        const result = await refreshOnce(token);
        if (result.ok) {
            token = result.accessToken;
        } else if (result.reason === 'expired') {
            await clearSessionAndNotify();
            return new Response('Session expired', { status: 401 });
        }
        // reason === 'network': refresh token 상태는 알 수 없고 access token은 아직 유효하므로
        // 세션을 유지한 채 기존 token으로 원래 요청을 계속 시도한다.
    }

    const baseHeaders = toHeaderRecord(init?.headers);
    const headers = { ...baseHeaders, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    const response = await fetch(url, { ...init, headers });

    if (response.status === 401 && token) {
        const result = await refreshOnce(token);
        if (result.ok) {
            const retryHeaders = { ...baseHeaders, Authorization: `Bearer ${result.accessToken}` };
            return fetch(url, { ...init, headers: retryHeaders });
        }
        if (result.reason === 'expired') {
            await clearSessionAndNotify();
        }
        // reason === 'network': 재시도할 새 token이 없으므로 원래 401을 그대로 반환하되,
        // 세션(저장된 token)은 파기하지 않아 이후 요청이 다시 refresh를 시도할 수 있게 둔다.
        return response;
    }

    return response;
}
