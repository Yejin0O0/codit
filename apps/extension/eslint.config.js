import js from '@eslint/js';
import tseslint from 'typescript-eslint';

import importPlugin from 'eslint-plugin-import';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
    {
        ignores: ['.wxt/**', 'node_modules/**', '.output/**', 'dist/**'],
    },

    js.configs.recommended,

    ...tseslint.configs.recommended,

    {
        files: ['**/*.{ts,tsx}'],

        plugins: {
            import: importPlugin,
            react,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
            'unused-imports': unusedImports,
        },

        settings: {
            react: {
                version: 'detect',
            },

            'import/resolver': {
                typescript: {
                    project: './tsconfig.json',
                },
            },
        },

        rules: {
            /*
             * React Hooks 검사
             */
            ...reactHooks.configs.recommended.rules,

            /*
             * React Refresh 검사
             */
            'react-refresh/only-export-components': [
                'warn',
                {
                    allowConstantExport: true,
                },
            ],

            /*
             * React JSX 검사
             */
            'react/jsx-uses-react': 'off',

            'react/jsx-uses-vars': 'error',

            /*
             * Import 정렬
             */
            'import/order': [
                'warn',
                {
                    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],

                    'newlines-between': 'always',

                    alphabetize: {
                        order: 'asc',
                        caseInsensitive: true,
                    },
                },
            ],

            /*
             * 사용하지 않는 import 제거
             */
            'unused-imports/no-unused-imports': 'error',

            /*
             * 사용하지 않는 변수 검사
             */
            'unused-imports/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    varsIgnorePattern: '^_',
                    args: 'after-used',
                    argsIgnorePattern: '^_',
                },
            ],

            /*
             * TypeScript 중복 검사 제거
             */
            '@typescript-eslint/no-unused-vars': 'off',
        },
    },

    /*
     * Prettier와 ESLint 스타일 충돌 제거
     */
    prettierConfig,
);
