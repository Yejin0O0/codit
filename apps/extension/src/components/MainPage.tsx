import { Button } from '@/components/ui/button';

interface MainPageProps {
    onLogout: () => Promise<void>;
}

export default function MainPage({ onLogout }: MainPageProps) {
    return (
        <div data-testid="main-page">
            <Button type="button" variant="secondary" onClick={onLogout}>
                로그아웃
            </Button>
        </div>
    );
}
