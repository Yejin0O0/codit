import type { AuthStatus, UserProfile } from '@codit/shared-types';

export interface AuthState {
    user: UserProfile | null;
    accessToken: string | null;
    expiresAt: number | null;
    status: AuthStatus;
    error: string | null;
}
