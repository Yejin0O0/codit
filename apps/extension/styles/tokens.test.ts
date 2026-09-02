import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TOKENS_CSS = resolve(import.meta.dirname, 'tokens.css');
const CONTENT_STYLE_CSS = resolve(import.meta.dirname, '../entrypoints/content/style.css');
const PAGE_STYLE_CSS = resolve(import.meta.dirname, '../entrypoints/page/style.css');

/** semantic token 값 선언(`--name: value`) 을 찾는 패턴. `var(--name)` 참조는 매치되지 않는다. */
const TOKEN_VALUE_DECLARATION = /^\s*--[\w-]+:\s*\S/m;

const REQUIRED_TOKENS = [
    '--background',
    '--foreground',
    '--card',
    '--popover',
    '--primary',
    '--secondary',
    '--muted',
    '--accent',
    '--destructive',
    '--border',
    '--input',
    '--ring',
    '--success',
    '--warning',
    '--radius',
];

describe('semantic token Source of Truth', () => {
    it('styles/tokens.css should declare every semantic token value', () => {
        const css = readFileSync(TOKENS_CSS, 'utf-8');

        for (const token of REQUIRED_TOKENS) {
            expect(css).toMatch(new RegExp(`^\\s*\\${token}:\\s*\\S`, 'm'));
        }
    });

    it('entrypoints/content/style.css should not declare any custom-property values (var() references only)', () => {
        const css = readFileSync(CONTENT_STYLE_CSS, 'utf-8');

        expect(css).not.toMatch(TOKEN_VALUE_DECLARATION);
    });

    it('entrypoints/page/style.css should exist and not declare any custom-property values', () => {
        expect(existsSync(PAGE_STYLE_CSS)).toBe(true);

        const css = readFileSync(PAGE_STYLE_CSS, 'utf-8');

        expect(css).not.toMatch(TOKEN_VALUE_DECLARATION);
    });
});
