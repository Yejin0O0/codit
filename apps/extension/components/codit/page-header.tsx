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
            className={cn(
                'flex items-center justify-between border-b px-4 py-3',
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
