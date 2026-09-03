import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ResultFilterToggleGroup } from './result-filter-toggle-group';

describe('ResultFilterToggleGroup', () => {
    it('"전체 / 정답 / 오답 / 보류"를 표시하고 선택한 값을 onChange로 전달한다', async () => {
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

    it('같은 탭을 다시 눌러도 현재 값을 유지한다(빈 값으로 해제되지 않는다)', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        render(<ResultFilterToggleGroup value="WRONG" onChange={onChange} />);

        const tab = screen.queryByText('오답');
        expect(tab).not.toBeNull();

        await user.click(tab!);
        expect(onChange).not.toHaveBeenCalledWith('ALL');
    });
});
