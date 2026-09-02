import { useAuth } from '../hooks/useAuth';
import LoginPage from './LoginPage';
import MainPage from './MainPage';

export default function PopupApp() {
    const { authState } = useAuth();
    return null;
}
