import { useState } from 'react';

import { Button } from '@/components/ui/button';

interface MainPageProps {
    onLogout: () => Promise<void>;
}

export default function MainPage({ onLogout }: MainPageProps) {
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await onLogout();
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <div data-testid="main-page">
            <Button type="button" variant="secondary" onClick={handleLogout} disabled={isLoggingOut}>
                로그아웃
            </Button>
        </div>
    );
}
