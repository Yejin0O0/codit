import { useAuth } from '../hooks/useAuth';

import LoginPage from './LoginPage';
import MainPage from './MainPage';

export default function PopupApp() {
    const { authState, loginWithGoogle } = useAuth();
    if (authState.status === 'authenticated') {
        return <MainPage />;
    }
    return <LoginPage onLoginWithGoogle={loginWithGoogle} isLoading={authState.status === 'loading'} />;
}
