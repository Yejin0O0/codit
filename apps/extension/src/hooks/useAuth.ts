import { useState, useEffect } from 'react';

import type { AuthState } from './useAuth.types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8080';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

export function useAuth(): {
    authState: AuthState;
    loginWithGoogle: () => Promise<void>;
} {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        accessToken: null,
        expiresAt: null,
        status: 'idle',
        error: null,
    });

    useEffect(() => {
        chrome.storage.local.get(['accessToken', 'expiresAt']).then((stored: Record<string, unknown>) => {
            if (stored.accessToken) {
                setAuthState((prev) => ({
                    ...prev,
                    status: 'authenticated',
                    accessToken: stored.accessToken as string,
                    expiresAt: (stored.expiresAt as number) ?? null,
                }));
            }
        });
    }, []);

    const loginWithGoogle = async (): Promise<void> => {
        setAuthState((prev) => ({ ...prev, status: 'loading' }));
        await Promise.resolve();
        try {
            const redirectUri = chrome.identity.getRedirectURL();
            const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
            authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
            authUrl.searchParams.set('redirect_uri', redirectUri);
            authUrl.searchParams.set('response_type', 'code');
            authUrl.searchParams.set('scope', 'openid email profile');
            authUrl.searchParams.set('access_type', 'offline');

            const redirectUrl = await chrome.identity.launchWebAuthFlow({
                url: authUrl.toString(),
                interactive: true,
            });

            if (!redirectUrl) {
                setAuthState((prev) => ({ ...prev, status: 'idle', error: null }));
                return;
            }

            const url = new URL(redirectUrl);
            const code = url.searchParams.get('code');

            if (!code) {
                setAuthState((prev) => ({ ...prev, status: 'idle', error: null }));
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/auth/login/GOOGLE`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, redirectUri }),
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            await chrome.storage.local.set({
                accessToken: data.accessToken,
                expiresAt: data.expiresAt,
            });

            setAuthState({
                user: data.user,
                accessToken: data.accessToken,
                expiresAt: data.expiresAt,
                status: 'authenticated',
                error: null,
            });
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            const isCancelled =
                message.includes('user') ||
                message.includes('cancel') ||
                message.includes('did not approve');

            if (isCancelled) {
                setAuthState((prev) => ({ ...prev, status: 'idle', error: null }));
            } else {
                setAuthState((prev) => ({ ...prev, status: 'error', error: message }));
            }
        }
    };

    return { authState, loginWithGoogle };
}
