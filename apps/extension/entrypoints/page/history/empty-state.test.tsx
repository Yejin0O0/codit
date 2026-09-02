import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EmptyState } from './empty-state';

describe('EmptyState', () => {
    it('should render guidance text for the "empty" variant', () => {
        render(<EmptyState variant="empty" />);

        expect(screen.queryByText(/아직 기록된 문제풀이가 없어요/)).not.toBeNull();
    });

    it('should render the action button and call action.onClick for "filtered-empty"', async () => {
        const onClick = vi.fn();
        const user = userEvent.setup();
        render(<EmptyState variant="filtered-empty" action={{ label: '필터 해제', onClick }} />);

        const button = screen.queryByRole('button', { name: '필터 해제' });
        expect(button).not.toBeNull();

        await user.click(button!);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should render the action button for "not-found"', () => {
        render(<EmptyState variant="not-found" action={{ label: '목록으로', onClick: vi.fn() }} />);

        expect(screen.queryByRole('button', { name: '목록으로' })).not.toBeNull();
    });
});
