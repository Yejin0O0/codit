import type { ReactNode, Ref } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PanelShellProps {
    title: string;
    step?: string;
    /** 주어지면 헤더 최우측에 접기 컨트롤(아이콘 버튼)을 렌더한다. */
    onCollapse?: () => void;
    /** collapsed→expanded 전환 직후 접기 컨트롤로 포커스를 되돌리기 위한 ref (App 이 소유) */
    collapseControlRef?: Ref<HTMLButtonElement>;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
}

/**
 * 모든 화면의 공통 프레임 (EXTEND ← Card).
 * 헤더(제목 + 스텝 인디케이터 + 선택적 접기 컨트롤) / 본문 / 선택적 푸터 슬롯을
 * 고정 레이아웃으로 제공한다.
 */
export function PanelShell({
    title,
    step,
    onCollapse,
    collapseControlRef,
    children,
    footer,
    className,
}: PanelShellProps) {
    return (
        <Card className={cn('gap-0 overflow-hidden py-0', className)}>
            <div className="flex items-center justify-between border-b px-4 py-3">
                <span className="text-sm font-semibold">{title}</span>
                <span className="flex items-center gap-2">
                    {step ? (
                        <span className="text-muted-foreground text-xs font-medium tabular-nums">
                            {step}
                        </span>
                    ) : null}
                    {onCollapse ? (
                        <Button
                            ref={collapseControlRef}
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="-mr-1 size-6"
                            aria-label="Codit 타이머 접기"
                            onClick={onCollapse}
                        >
                            <svg
                                viewBox="0 0 16 16"
                                aria-hidden="true"
                                fill="none"
                                className="size-4"
                            >
                                <path
                                    d="M4 6l4 4 4-4"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </Button>
                    ) : null}
                </span>
            </div>

            <div className="px-4 py-4">{children}</div>

            {footer ? <div className="flex gap-2 border-t px-4 py-3">{footer}</div> : null}
        </Card>
    );
}
