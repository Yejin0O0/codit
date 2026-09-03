import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PanelShellProps {
    title: string;
    step?: string;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
}

/**
 * 모든 화면의 공통 프레임 (EXTEND ← Card).
 * 헤더(제목 + 스텝 인디케이터) / 본문 / 선택적 푸터 슬롯을 고정 레이아웃으로 제공한다.
 */
export function PanelShell({ title, step, children, footer, className }: PanelShellProps) {
    return (
        <Card className={cn('gap-0 overflow-hidden py-0', className)}>
            <div className="flex items-center justify-between border-b px-4 py-3">
                <span className="text-sm font-semibold">{title}</span>
                {step ? (
                    <span className="text-muted-foreground text-xs font-medium tabular-nums">
                        {step}
                    </span>
                ) : null}
            </div>

            <div className="px-4 py-4">{children}</div>

            {footer ? <div className="flex gap-2 border-t px-4 py-3">{footer}</div> : null}
        </Card>
    );
}
