import SocialLoginButton from './SocialLoginButton';

interface LoginPageProps {
    onLoginWithGoogle: () => void;
    isLoading: boolean;
    error?: string | null;
}

export default function LoginPage({ onLoginWithGoogle, isLoading, error }: LoginPageProps) {
    return (
        <div data-testid="login-page">
            <SocialLoginButton provider="GOOGLE" onClick={onLoginWithGoogle} isLoading={isLoading} />
            {error && <p role="alert">{error}</p>}
        </div>
    );
}
