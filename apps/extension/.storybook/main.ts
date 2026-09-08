import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const config: StorybookConfig = {
    stories: [
        '../.storybook/**/*.stories.@(ts|tsx)',
        '../components/**/*.stories.@(ts|tsx)',
        '../entrypoints/**/*.stories.@(ts|tsx)',
    ],
    addons: ['@storybook/addon-a11y'],
    // 스토리가 `/brand/*`·`/icon/*` 절대경로로 참조하는 브랜드·아이콘 에셋 서빙.
    // (Vite 빌더는 plain dev 서버와 달리 프로젝트 public/ 을 자동 서빙하지 않음)
    staticDirs: ['../public'],
    framework: {
        name: '@storybook/react-vite',
        options: {},
    },
    core: { disableTelemetry: true },
    async viteFinal(cfg) {
        cfg.plugins ??= [];
        cfg.plugins.push(tailwindcss());
        cfg.resolve ??= {};
        cfg.resolve.alias = {
            ...(cfg.resolve.alias ?? {}),
            '@': root,
            '~': root,
        };
        return cfg;
    },
};

export default config;
