import { render, screen } from '@testing-library/react';

import { ExtensionPageShell } from './extension-page-shell';

describe('ExtensionPageShell', () => {
    it('children을 가운데 정렬된 컨테이너 안에 표시한다', () => {
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

    it('header가 주어지면 header 슬롯을 콘텐츠 위에 표시한다', () => {
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

    it('maxWidth(number)를 컨테이너 max-width 인라인 스타일에 px 단위로 적용한다', () => {
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

    it('바깥 프레임에 muted 페이지 배경을 적용한다', () => {
        const { container } = render(
            <ExtensionPageShell maxWidth={400}>
                <div>child-content</div>
            </ExtensionPageShell>,
        );

        const root = container.querySelector('[data-slot="extension-page-shell"]');

        expect(root).not.toBeNull();
        expect(root).toHaveClass('bg-muted');
    });

    it('className을 바깥 프레임에 병합한다', () => {
        const { container } = render(
            <ExtensionPageShell maxWidth={400} className="custom-shell">
                <div>child-content</div>
            </ExtensionPageShell>,
        );

        const root = container.querySelector('[data-slot="extension-page-shell"]');

        expect(root).not.toBeNull();
        expect(root).toHaveClass('custom-shell');
    });

    it('400px, 720px 값을 넘기면 max-width를 정확히 그 값으로 적용한다', () => {
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

    it('header가 없으면 header 영역을 생략하고 children은 그대로 표시한다', () => {
        const { container } = render(
            <ExtensionPageShell maxWidth={400}>
                <div>child-content</div>
            </ExtensionPageShell>,
        );

        expect(screen.queryByText('child-content')).not.toBeNull();
        expect(container.querySelector('[data-slot="extension-page-shell-header"]')).toBeNull();
    });
});
