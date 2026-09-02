import type { Provider } from '@codit/shared-types';

interface SocialLoginButtonProps {
    provider: Provider;
    onClick: () => void;
    isLoading: boolean;
}

export default function SocialLoginButton({ provider, onClick }: SocialLoginButtonProps) {
    return (
        <button onClick={onClick}>
            {provider}로 계속하기
        </button>
    );
}
