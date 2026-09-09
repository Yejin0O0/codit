import { useAuth } from '../hooks/useAuth';

import LoginPage from './LoginPage';
import MainPage from './MainPage';

export default function PopupApp() {
    const { authState, loginWithGoogle, logout } = useAuth();
    if (authState.status === 'authenticated') {
        return <MainPage onLogout={logout} />;
    }
    return (
        <LoginPage
            onLoginWithGoogle={loginWithGoogle}
            isLoading={authState.status === 'loading'}
            error={authState.error}
            sessionExpiredMessage={authState.sessionExpiredMessage}
        />
    );
}
