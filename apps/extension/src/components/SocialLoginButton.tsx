import type { Provider } from '@codit/shared-types';

interface SocialLoginButtonProps {
    provider: Provider;
    onClick: () => void;
    isLoading: boolean;
}

export default function SocialLoginButton({ provider, onClick, isLoading }: SocialLoginButtonProps) {
    return (
        <button onClick={onClick} disabled={isLoading}>
            {isLoading && <span data-testid="spinner" />}
            {provider}로 계속하기
        </button>
    );
}
