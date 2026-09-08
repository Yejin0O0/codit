import type { Provider } from '@codit/shared-types';

import { Button } from '@/components/ui/button';

interface SocialLoginButtonProps {
    provider: Provider;
    onClick: () => void;
    isLoading: boolean;
}

export default function SocialLoginButton({ provider, onClick, isLoading }: SocialLoginButtonProps) {
    return (
        <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={onClick}
            disabled={isLoading}
        >
            {isLoading && (
                <span
                    data-testid="spinner"
                    aria-hidden="true"
                    className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                />
            )}
            {provider}로 계속하기
        </Button>
    );
}
