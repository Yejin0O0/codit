import type { Preview } from '@storybook/react-vite';

import './storybook.css';

const preview: Preview = {
    parameters: {
        layout: 'centered',
        controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
        backgrounds: {
            options: {
                page: { name: 'Extension Page', value: '#faf9fc' },
                swea: { name: 'SWEA (흰 배경)', value: '#ffffff' },
                editor: { name: 'SWEA 에디터', value: '#f6f6f6' },
            },
        },
        a11y: {
            // 대비·이름 등 자동 점검. 실패는 리포트하되 빌드는 막지 않음(test 모드에서 강제).
            test: 'todo',
        },
    },
    initialGlobals: {
        backgrounds: { value: 'page' },
    },
};

export default preview;
