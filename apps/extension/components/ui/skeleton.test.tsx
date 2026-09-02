import { render } from '@testing-library/react';

import { Skeleton } from './skeleton';

describe('Skeleton', () => {
    it('should render an element with data-slot="skeleton" and merge className', () => {
        const { container } = render(<Skeleton className="custom-sk" />);

        const el = container.querySelector('[data-slot="skeleton"]');

        expect(el).not.toBeNull();
        expect(el).toHaveClass('custom-sk');
    });
});
