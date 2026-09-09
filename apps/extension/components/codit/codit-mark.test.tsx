import { render } from '@testing-library/react';

import { CoditMark } from './codit-mark';

describe('CoditMark', () => {
    it('인라인 <svg> 로 렌더하고 <img> 는 쓰지 않는다', () => {
        const { container } = render(<CoditMark />);

        expect(container.querySelector('svg')).not.toBeNull();
        expect(container.querySelector('img')).toBeNull();
    });

    it('장식용이므로 aria-hidden 이다', () => {
        const { container } = render(<CoditMark />);

        expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    it('기본(withCheck 미지정)은 C 획 path 하나만 렌더한다', () => {
        const { container } = render(<CoditMark />);

        expect(container.querySelectorAll('path')).toHaveLength(1);
        expect(container.querySelector('.stroke-success')).toBeNull();
    });

    it('withCheck 이면 C 획 + 민트 체크(stroke-success) path 두 개를 렌더한다', () => {
        const { container } = render(<CoditMark withCheck />);

        expect(container.querySelectorAll('path')).toHaveLength(2);
        expect(container.querySelector('path.stroke-success')).not.toBeNull();
    });

    it('className 을 svg 에 병합한다', () => {
        const { container } = render(<CoditMark className="text-primary size-6" />);

        const svg = container.querySelector('svg');
        expect(svg?.getAttribute('class')).toContain('text-primary');
        expect(svg?.getAttribute('class')).toContain('size-6');
    });
});
