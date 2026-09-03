import { render, screen } from '@testing-library/react';

import { PageHeader } from './page-header';

const DESCRIPTION = '문제풀이 기록을 관리하세요';

describe('PageHeader', () => {
    it('왼쪽에 Codit 브랜드(compact BrandHeader)를 표시한다', () => {
        const { container } = render(<PageHeader />);

        expect(screen.queryByText('Codit')).not.toBeNull();
        expect(container.querySelector('[data-slot="brand-header"]')).not.toBeNull();
    });

    it('브랜드 설명 문구를 표시하지 않는다(compact 브랜드)', () => {
        render(<PageHeader userName="you@example.com" />);

        expect(screen.queryByText('Codit')).not.toBeNull();
        expect(screen.queryByText(DESCRIPTION)).toBeNull();
    });

    it('userName이 주어지면 오른쪽에 userName을 표시한다', () => {
        const { container } = render(<PageHeader userName="you@example.com" />);

        expect(screen.queryByText('you@example.com')).not.toBeNull();
        expect(container.querySelector('[data-slot="page-header-user"]')).not.toBeNull();
    });

    it('data-slot="page-header-logout"을 가진 로그아웃 placeholder 영역을 표시한다', () => {
        const { container } = render(<PageHeader userName="you@example.com" />);

        expect(container.querySelector('[data-slot="page-header-logout"]')).not.toBeNull();
    });

    it('로그아웃 placeholder를 DOM에는 두되 보이지 않게 하고 버튼도 두지 않는다', () => {
        const { container } = render(<PageHeader userName="you@example.com" />);

        const logout = container.querySelector('[data-slot="page-header-logout"]');

        expect(logout).not.toBeNull();
        expect(logout).not.toBeVisible();
        expect(container.querySelector('button')).toBeNull();
    });

    it('userName이 없으면 사용자 영역을 생략하고 브랜드는 그대로 표시한다', () => {
        const { container } = render(<PageHeader />);

        expect(screen.queryByText('Codit')).not.toBeNull();
        expect(container.querySelector('[data-slot="page-header-user"]')).toBeNull();
    });

    it('userName이 없어도 로그아웃 placeholder는 두되 숨기고 버튼은 두지 않는다', () => {
        const { container } = render(<PageHeader />);

        const logout = container.querySelector('[data-slot="page-header-logout"]');

        expect(logout).not.toBeNull();
        expect(logout).not.toBeVisible();
        expect(container.querySelector('button')).toBeNull();
    });
});
