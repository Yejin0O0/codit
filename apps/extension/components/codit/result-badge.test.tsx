import { render, screen } from '@testing-library/react';

import { ResultBadge } from './result-badge';

describe('ResultBadge', () => {
    it.each([
        ['CORRECT', '정답'],
        ['WRONG', '오답'],
        ['HOLD', '보류'],
    ] as const)('should render "%s" as the label "%s"', (result, label) => {
        render(<ResultBadge result={result} />);

        expect(screen.queryByText(label)).not.toBeNull();
    });

    it('should merge className onto the badge', () => {
        const { container } = render(<ResultBadge result="CORRECT" className="custom-rb" />);

        expect(container.querySelector('.custom-rb')).not.toBeNull();
    });
});
