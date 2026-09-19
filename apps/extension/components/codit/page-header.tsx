import { cn } from '@/lib/utils';

import { BrandHeader } from './brand-header';

interface PageHeaderProps {
    /** 현재 로그인 사용자 표시 (mock). 없으면 우측 사용자 영역 생략 */
    userName?: string;
    className?: string;
}

export function PageHeader({ userName, className }: PageHeaderProps) {
    return (
        <header
            data-slot="page-header"
            // [UI-L2 R7] Option C — 스크롤에 고정 + 반투명 블러. 히스토리 목록이 길어져도
            // 브랜드/사용자 영역이 항상 보인다. border-b 는 유지(카드 프레임과 겹치지 않게).
            className={cn(
                'bg-background/95 sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3.5 backdrop-blur-sm',
                className,
            )}
        >
            <BrandHeader variant="compact" />
            <div className="flex items-center gap-2">
                {userName ? (
                    <span
                        data-slot="page-header-user"
                        className="text-muted-foreground text-sm"
                    >
                        {userName}
                    </span>
                ) : null}
                <div data-slot="page-header-logout" hidden />
            </div>
        </header>
    );
}
