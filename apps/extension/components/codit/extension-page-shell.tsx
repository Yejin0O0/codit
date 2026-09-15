import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface ExtensionPageShellProps {
    /** 중앙 컨테이너 최대 폭 (px). feature 별로 주입 */
    maxWidth: number;
    /** 상단 헤더 슬롯 (보통 <PageHeader />). 없으면 헤더 영역 생략 */
    header?: ReactNode;
    children: ReactNode;
    className?: string;
}

export function ExtensionPageShell({
    maxWidth,
    header,
    children,
    className,
}: ExtensionPageShellProps) {
    return (
        <div
            data-slot="extension-page-shell"
            className={cn('bg-muted min-h-screen', className)}
        >
            {header ? <div data-slot="extension-page-shell-header">{header}</div> : null}
            <div
                data-slot="extension-page-shell-container"
                className="mx-auto w-full px-4 py-6"
                style={{ maxWidth }}
            >
                {/* [UI-L2 R7] Option C — 콘텐츠를 카드로 한 번 더 감싸 SWEA 흰 페이지식이 아닌
                    "Codit 패널" 프레임을 준다 (위젯 PanelShell 과 같은 언어). */}
                <div
                    data-slot="extension-page-shell-content"
                    className="bg-background rounded-lg border p-4 shadow-sm"
                >
                    {children}
                </div>
            </div>
        </div>
    );
}
