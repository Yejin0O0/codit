import SocialLoginButton from './SocialLoginButton';

interface LoginPageProps {
    onLoginWithGoogle: () => void;
    isLoading: boolean;
    error?: string | null;
    sessionExpiredMessage?: string | null;
}

export default function LoginPage({
    onLoginWithGoogle,
    isLoading,
    error,
    sessionExpiredMessage,
}: LoginPageProps) {
    return (
        <div data-testid="login-page" className="flex flex-col gap-3 p-4">
            <SocialLoginButton provider="GOOGLE" onClick={onLoginWithGoogle} isLoading={isLoading} />
            {error && (
                <p role="alert" className="text-destructive text-sm">
                    {error}
                </p>
            )}
            {sessionExpiredMessage && (
                <p role="status" className="text-muted-foreground text-sm">
                    {sessionExpiredMessage}
                </p>
            )}
        </div>
    );
}
