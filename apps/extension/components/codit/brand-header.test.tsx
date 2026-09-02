import { render, screen } from '@testing-library/react';

import { BrandHeader } from './brand-header';

const DESCRIPTION = '문제풀이 기록을 관리하세요';

describe('BrandHeader', () => {
    it('should render inline SVG logo + "Codit" wordmark + description text when variant is "full"', () => {
        const { container } = render(<BrandHeader variant="full" />);

        expect(container.querySelector('svg')).not.toBeNull();
        expect(screen.queryByText('Codit')).not.toBeNull();
        expect(screen.queryByText(DESCRIPTION)).not.toBeNull();
    });

    it('should render inline SVG logo + "Codit" wordmark and omit the description text when variant is "compact"', () => {
        const { container } = render(<BrandHeader variant="compact" />);

        expect(container.querySelector('svg')).not.toBeNull();
        expect(screen.queryByText('Codit')).not.toBeNull();
        expect(screen.queryByText(DESCRIPTION)).toBeNull();
    });

    it('should render the logo as an inline <svg> element (no <img>)', () => {
        const { container } = render(<BrandHeader variant="full" />);

        expect(container.querySelector('svg')).not.toBeNull();
        expect(container.querySelector('img')).toBeNull();
    });

    it('should merge className into the root element', () => {
        const { container } = render(<BrandHeader variant="full" className="custom-brand" />);

        const root = container.querySelector('[data-slot="brand-header"]');

        expect(root).not.toBeNull();
        expect(root).toHaveClass('custom-brand');
    });

    it('should render the "full" layout (description present) when variant prop is omitted', () => {
        render(<BrandHeader />);

        expect(screen.queryByText(DESCRIPTION)).not.toBeNull();
    });
});
