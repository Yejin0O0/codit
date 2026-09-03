import { render, screen } from '@testing-library/react';

import { BrandHeader } from './brand-header';

const DESCRIPTION = '문제풀이 기록을 관리하세요';

describe('BrandHeader', () => {
    it('variant가 "full"이면 인라인 SVG 로고 + "Codit" 워드마크 + 설명 문구를 표시한다', () => {
        const { container } = render(<BrandHeader variant="full" />);

        expect(container.querySelector('svg')).not.toBeNull();
        expect(screen.queryByText('Codit')).not.toBeNull();
        expect(screen.queryByText(DESCRIPTION)).not.toBeNull();
    });

    it('variant가 "compact"이면 인라인 SVG 로고 + "Codit" 워드마크를 표시하고 설명 문구는 생략한다', () => {
        const { container } = render(<BrandHeader variant="compact" />);

        expect(container.querySelector('svg')).not.toBeNull();
        expect(screen.queryByText('Codit')).not.toBeNull();
        expect(screen.queryByText(DESCRIPTION)).toBeNull();
    });

    it('로고를 <img>가 아닌 인라인 <svg> 요소로 표시한다', () => {
        const { container } = render(<BrandHeader variant="full" />);

        expect(container.querySelector('svg')).not.toBeNull();
        expect(container.querySelector('img')).toBeNull();
    });

    it('className을 루트 요소에 병합한다', () => {
        const { container } = render(<BrandHeader variant="full" className="custom-brand" />);

        const root = container.querySelector('[data-slot="brand-header"]');

        expect(root).not.toBeNull();
        expect(root).toHaveClass('custom-brand');
    });

    it('variant Props를 생략하면 "full" 레이아웃(설명 포함)을 표시한다', () => {
        render(<BrandHeader />);

        expect(screen.queryByText(DESCRIPTION)).not.toBeNull();
    });
});
