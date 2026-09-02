import { render, screen } from '@testing-library/react';

import { PageHeader } from './page-header';

const DESCRIPTION = '문제풀이 기록을 관리하세요';

describe('PageHeader', () => {
    it('should render the Codit brand (compact BrandHeader) on the left', () => {
        const { container } = render(<PageHeader />);

        expect(screen.queryByText('Codit')).not.toBeNull();
        expect(container.querySelector('[data-slot="brand-header"]')).not.toBeNull();
    });

    it('should not show the brand description text (compact brand)', () => {
        render(<PageHeader userName="you@example.com" />);

        expect(screen.queryByText('Codit')).not.toBeNull();
        expect(screen.queryByText(DESCRIPTION)).toBeNull();
    });

    it('should render userName on the right when userName is given', () => {
        const { container } = render(<PageHeader userName="you@example.com" />);

        expect(screen.queryByText('you@example.com')).not.toBeNull();
        expect(container.querySelector('[data-slot="page-header-user"]')).not.toBeNull();
    });

    it('should render a logout placeholder region carrying data-slot="page-header-logout"', () => {
        const { container } = render(<PageHeader userName="you@example.com" />);

        expect(container.querySelector('[data-slot="page-header-logout"]')).not.toBeNull();
    });

    it('should keep the logout placeholder present in the DOM but not visible, with no button', () => {
        const { container } = render(<PageHeader userName="you@example.com" />);

        const logout = container.querySelector('[data-slot="page-header-logout"]');

        expect(logout).not.toBeNull();
        expect(logout).not.toBeVisible();
        expect(container.querySelector('button')).toBeNull();
    });

    it('should omit the user area (no user slot) when userName is not given, while still rendering the brand', () => {
        const { container } = render(<PageHeader />);

        expect(screen.queryByText('Codit')).not.toBeNull();
        expect(container.querySelector('[data-slot="page-header-user"]')).toBeNull();
    });

    it('should keep the logout placeholder present, hidden, and buttonless even when userName is not given', () => {
        const { container } = render(<PageHeader />);

        const logout = container.querySelector('[data-slot="page-header-logout"]');

        expect(logout).not.toBeNull();
        expect(logout).not.toBeVisible();
        expect(container.querySelector('button')).toBeNull();
    });
});
