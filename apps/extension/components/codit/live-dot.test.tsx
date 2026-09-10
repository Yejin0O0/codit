import { render } from '@testing-library/react';

import { LiveDot } from './live-dot';

describe('LiveDot', () => {
    it('aria-hidden 래퍼 span을 렌더한다', () => {
        const { container } = render(<LiveDot />);

        expect(container.querySelector('span[aria-hidden="true"]')).not.toBeNull();
    });

    it('bg-success 도트를 렌더한다', () => {
        const { container } = render(<LiveDot />);

        expect(container.querySelectorAll('.bg-success').length).toBeGreaterThanOrEqual(1);
    });

    it('animate-ping 후광 span을 렌더한다', () => {
        const { container } = render(<LiveDot />);

        expect(container.querySelector('.animate-ping')).not.toBeNull();
    });

    it('전달된 className을 래퍼에 병합한다 (기존 클래스 유지)', () => {
        const { container } = render(<LiveDot className="custom-x" />);

        const wrapper = container.querySelector('span[aria-hidden="true"]');
        expect(wrapper?.className).toMatch(/custom-x/);
        expect(wrapper?.className).toMatch(/size-1\.5/);
    });
});
