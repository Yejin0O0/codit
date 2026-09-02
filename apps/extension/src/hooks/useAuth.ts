import type { AuthState } from './useAuth.types';

export function useAuth(): {
    authState: AuthState;
    loginWithGoogle: () => Promise<void>;
} {
    return {
        authState: {
            user: null,
            accessToken: null,
            expiresAt: null,
            status: 'idle',
            error: null,
        },
        loginWithGoogle: async () => {},
    };
}
