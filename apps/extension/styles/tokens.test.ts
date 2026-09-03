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
    it('styles/tokens.css가 모든 semantic token 값을 선언한다', () => {
        const css = readFileSync(TOKENS_CSS, 'utf-8');

        for (const token of REQUIRED_TOKENS) {
            expect(css).toMatch(new RegExp(`^\\s*\\${token}:\\s*\\S`, 'm'));
        }
    });

    it('entrypoints/content/style.css는 custom-property 값을 선언하지 않는다(var() 참조만)', () => {
        const css = readFileSync(CONTENT_STYLE_CSS, 'utf-8');

        expect(css).not.toMatch(TOKEN_VALUE_DECLARATION);
    });

    it('entrypoints/page/style.css는 존재하며 custom-property 값을 선언하지 않는다', () => {
        expect(existsSync(PAGE_STYLE_CSS)).toBe(true);

        const css = readFileSync(PAGE_STYLE_CSS, 'utf-8');

        expect(css).not.toMatch(TOKEN_VALUE_DECLARATION);
    });
});
