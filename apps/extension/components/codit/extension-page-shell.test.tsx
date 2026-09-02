import { render, screen } from '@testing-library/react';

import { ExtensionPageShell } from './extension-page-shell';

describe('ExtensionPageShell', () => {
    it('should render children inside the centered container', () => {
        const { container } = render(
            <ExtensionPageShell maxWidth={400}>
                <div>child-content</div>
            </ExtensionPageShell>,
        );

        const containerSlot = container.querySelector(
            '[data-slot="extension-page-shell-container"]',
        );

        expect(containerSlot).not.toBeNull();
        expect(containerSlot).toHaveTextContent('child-content');
    });

    it('should render the header slot above the content when header is given', () => {
        const { container } = render(
            <ExtensionPageShell maxWidth={400} header={<div>header-content</div>}>
                <div>child-content</div>
            </ExtensionPageShell>,
        );

        const headerSlot = container.querySelector('[data-slot="extension-page-shell-header"]');
        const containerSlot = container.querySelector(
            '[data-slot="extension-page-shell-container"]',
        );

        expect(headerSlot).not.toBeNull();
        expect(containerSlot).not.toBeNull();
        expect(screen.queryByText('header-content')).not.toBeNull();
        // header 가 컨테이너보다 문서상 앞에 있어야 한다
        expect(
            headerSlot!.compareDocumentPosition(containerSlot!) &
                Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
    });

    it('should apply maxWidth (number) as the container max-width inline style in px', () => {
        const { container } = render(
            <ExtensionPageShell maxWidth={400}>
                <div>child-content</div>
            </ExtensionPageShell>,
        );

        const containerSlot = container.querySelector(
            '[data-slot="extension-page-shell-container"]',
        );

        expect(containerSlot).not.toBeNull();
        expect(containerSlot).toHaveStyle({ maxWidth: '400px' });
    });

    it('should apply the muted page background to the outer frame', () => {
        const { container } = render(
            <ExtensionPageShell maxWidth={400}>
                <div>child-content</div>
            </ExtensionPageShell>,
        );

        const root = container.querySelector('[data-slot="extension-page-shell"]');

        expect(root).not.toBeNull();
        expect(root).toHaveClass('bg-muted');
    });

    it('should merge className onto the outer frame', () => {
        const { container } = render(
            <ExtensionPageShell maxWidth={400} className="custom-shell">
                <div>child-content</div>
            </ExtensionPageShell>,
        );

        const root = container.querySelector('[data-slot="extension-page-shell"]');

        expect(root).not.toBeNull();
        expect(root).toHaveClass('custom-shell');
    });

    it('should apply max-width exactly 400px and exactly 720px when those values are passed', () => {
        const { container: authContainer } = render(
            <ExtensionPageShell maxWidth={400}>
                <div>auth</div>
            </ExtensionPageShell>,
        );
        const { container: historyContainer } = render(
            <ExtensionPageShell maxWidth={720}>
                <div>history</div>
            </ExtensionPageShell>,
        );

        const authSlot = authContainer.querySelector(
            '[data-slot="extension-page-shell-container"]',
        );
        const historySlot = historyContainer.querySelector(
            '[data-slot="extension-page-shell-container"]',
        );

        expect(authSlot).not.toBeNull();
        expect(historySlot).not.toBeNull();
        expect(authSlot).toHaveStyle({ maxWidth: '400px' });
        expect(historySlot).toHaveStyle({ maxWidth: '720px' });
    });

    it('should omit the header region and still render children when header is not given', () => {
        const { container } = render(
            <ExtensionPageShell maxWidth={400}>
                <div>child-content</div>
            </ExtensionPageShell>,
        );

        expect(screen.queryByText('child-content')).not.toBeNull();
        expect(container.querySelector('[data-slot="extension-page-shell-header"]')).toBeNull();
    });
});
