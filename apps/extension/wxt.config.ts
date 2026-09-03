import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
    modules: ['@wxt-dev/module-react'],
    manifest: {
        // 위젯 위치 영속(chrome.storage.local) — widget-drag-move #21
        permissions: ['storage'],
    },
    vite: () => ({
        plugins: [tailwindcss()],
    }),
});
