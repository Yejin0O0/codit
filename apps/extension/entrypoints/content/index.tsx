import ReactDOM from 'react-dom/client';

import App from './App';
import css from './style.css?inline';

export default defineContentScript({
    matches: ['*://*.google.com/*'],

    main() {
        console.log('Codit content loaded');

        // 중복 생성 방지
        if (document.querySelector('#codit-root')) {
            return;
        }

        // 1. Codit Root 생성
        const container = document.createElement('div');

        container.id = 'codit-root';

        // Extension UI 위치 설정
        container.style.position = 'fixed';

        container.style.top = '20px';

        container.style.right = '20px';

        container.style.zIndex = '999999';

        document.body.appendChild(container);

        // 2. Shadow DOM 생성
        const shadowRoot = container.attachShadow({
            mode: 'open',
        });

        // 3. Tailwind CSS 주입
        // 컴파일된 CSS 의 :root 규칙(디자인 토큰 + Tailwind 테마 변수)을
        // Shadow Root 스코프로 재배치한다. (ui-architecture 원칙 1)
        const style = document.createElement('style');

        style.textContent = css.replaceAll(':root', ':host');

        shadowRoot.appendChild(style);

        // 4. React Mount 영역 생성
        const app = document.createElement('div');

        shadowRoot.appendChild(app);

        // 5. React 실행
        console.log('before react render');

        ReactDOM.createRoot(app).render(<App />);

        console.log('after react render');
    },
});
