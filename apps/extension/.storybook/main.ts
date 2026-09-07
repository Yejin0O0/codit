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
