export type Provider = 'GOOGLE' | 'GITHUB';
export type Role = 'USER' | 'ADMIN';
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

export interface LoginRequest {
  code: string;
  redirectUri: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  expiresAt: number;
  user: UserProfile;
}

export interface UserProfile {
  id: number;
  email: string;
  nickname: string;
  role: Role;
}
