import SocialLoginButton from './SocialLoginButton';

interface LoginPageProps {
    onLoginWithGoogle: () => void;
    isLoading: boolean;
    error?: string | null;
}

export default function LoginPage({ onLoginWithGoogle, isLoading, error }: LoginPageProps) {
    return (
        <div data-testid="login-page" className="flex flex-col gap-3 p-4">
            <SocialLoginButton provider="GOOGLE" onClick={onLoginWithGoogle} isLoading={isLoading} />
            {error && (
                <p role="alert" className="text-destructive text-sm">
                    {error}
                </p>
            )}
        </div>
    );
}
