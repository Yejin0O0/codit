import { render } from '@testing-library/react';

import { Skeleton } from './skeleton';

describe('Skeleton', () => {
    it('data-slot="skeleton" 요소를 표시하고 className을 병합한다', () => {
        const { container } = render(<Skeleton className="custom-sk" />);

        const el = container.querySelector('[data-slot="skeleton"]');

        expect(el).not.toBeNull();
        expect(el).toHaveClass('custom-sk');
    });
});
