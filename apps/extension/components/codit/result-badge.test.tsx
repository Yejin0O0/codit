import { render, screen } from '@testing-library/react';

import { ResultBadge } from './result-badge';

describe('ResultBadge', () => {
    it.each([
        ['CORRECT', '정답'],
        ['WRONG', '오답'],
        ['HOLD', '보류'],
    ] as const)('"%s"를 라벨 "%s"로 표시한다', (result, label) => {
        render(<ResultBadge result={result} />);

        expect(screen.queryByText(label)).not.toBeNull();
    });

    it('className을 badge에 병합한다', () => {
        const { container } = render(<ResultBadge result="CORRECT" className="custom-rb" />);

        expect(container.querySelector('.custom-rb')).not.toBeNull();
    });
});
