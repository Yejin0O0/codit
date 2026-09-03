import SocialLoginButton from './SocialLoginButton';

interface LoginPageProps {
    onLoginWithGoogle: () => void;
    isLoading: boolean;
}

export default function LoginPage({ onLoginWithGoogle, isLoading }: LoginPageProps) {
    return (
        <div data-testid="login-page">
            <SocialLoginButton provider="GOOGLE" onClick={onLoginWithGoogle} isLoading={isLoading} />
        </div>
    );
}
