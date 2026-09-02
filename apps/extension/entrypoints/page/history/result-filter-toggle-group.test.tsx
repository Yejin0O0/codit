import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ResultFilterToggleGroup } from './result-filter-toggle-group';

describe('ResultFilterToggleGroup', () => {
    it('should render 전체 / 정답 / 오답 / 보류 and call onChange with the selected value', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        render(<ResultFilterToggleGroup value="ALL" onChange={onChange} />);

        expect(screen.queryByText('전체')).not.toBeNull();
        expect(screen.queryByText('정답')).not.toBeNull();
        expect(screen.queryByText('오답')).not.toBeNull();
        expect(screen.queryByText('보류')).not.toBeNull();

        await user.click(screen.getByText('오답'));
        expect(onChange).toHaveBeenCalledWith('WRONG');
    });

    it('should keep the current value on same-tab re-select (no deselect to empty)', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        render(<ResultFilterToggleGroup value="WRONG" onChange={onChange} />);

        const tab = screen.queryByText('오답');
        expect(tab).not.toBeNull();

        await user.click(tab!);
        expect(onChange).not.toHaveBeenCalledWith('ALL');
    });
});
