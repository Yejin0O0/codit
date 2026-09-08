import type { PointerEvent as ReactPointerEvent, ReactNode, Ref } from 'react';

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
    /**
     * 주어지면 헤더가 드래그 핸들이 된다 (hover 시 cursor: grab).
     * 접기 버튼 위에서 시작한 pointerdown 은 드래그로 처리하지 않는다.
     */
    dragHandlers?: { onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void };
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
}

/** `"n / N"` → `{ n, total }`. 형식 불일치 또는 `n` 이 `[1, N]` 밖이면 null. */
function parseStep(step: string): { n: number; total: number } | null {
    const match = /^\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(step);
    if (!match) {
        return null;
    }
    const n = Number(match[1]);
    const total = Number(match[2]);
    if (n < 1 || n > total) {
        return null;
    }
    return { n, total };
}

/**
 * step 진행 인디케이터. `"n / N"` 을 파싱해 도트 N개를 렌더하고 앞 n개를 채운다.
 * 파싱 실패 시 원문 문자열을 텍스트로 렌더한다.
 */
function StepDots({ step }: { step: string }) {
    const parsed = parseStep(step);

    if (parsed === null) {
        return (
            <span className="text-muted-foreground text-xs font-medium tabular-nums">{step}</span>
        );
    }

    const { n, total } = parsed;
    return (
        <span className="flex items-center gap-1" aria-label={`${n} / ${total} 단계`}>
            {Array.from({ length: total }, (_, i) => {
                const filled = i < n;
                return (
                    <span
                        key={i}
                        data-filled={filled ? 'true' : 'false'}
                        className={cn(
                            'size-1.5 rounded-full',
                            filled ? 'bg-primary' : 'bg-input',
                        )}
                    />
                );
            })}
        </span>
    );
}

/**
 * 모든 화면의 공통 프레임 (EXTEND ← Card).
 * 헤더(제목 + 스텝 도트 + 선택적 접기 컨트롤) / 본문 / 선택적 푸터 슬롯을
 * 고정 레이아웃으로 제공한다.
 */
export function PanelShell({
    title,
    step,
    onCollapse,
    collapseControlRef,
    dragHandlers,
    children,
    footer,
    className,
}: PanelShellProps) {
    function handleHeaderPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
        if (!dragHandlers?.onPointerDown) {
            return;
        }
        // 접기 버튼 위에서 시작한 pointerdown 은 드래그로 처리하지 않는다.
        if ((event.target as HTMLElement).closest('[data-codit-no-drag]')) {
            return;
        }
        dragHandlers.onPointerDown(event);
    }

    return (
        // shadow-lg = primary 틴트 = 위젯 프레임을 SWEA 흰 페이지에서 분리 + "Codit 패널" 각인 (prd.md ADR-5)
        <Card className={cn('gap-0 overflow-hidden py-0 shadow-lg', className)}>
            <div
                className={cn(
                    'flex items-center justify-between border-b px-4 py-3.5',
                    dragHandlers && 'cursor-grab',
                )}
                onPointerDown={handleHeaderPointerDown}
            >
                <h2 className="text-sm font-semibold">{title}</h2>
                <span className="flex items-center gap-2">
                    {step ? <StepDots step={step} /> : null}
                    {onCollapse ? (
                        <Button
                            ref={collapseControlRef}
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="-mr-1 size-6"
                            aria-label="Codit 타이머 접기"
                            onClick={onCollapse}
                            data-codit-no-drag
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

            <div className="px-4 py-5">{children}</div>

            {footer ? <div className="flex gap-2 border-t px-4 py-3.5">{footer}</div> : null}
        </Card>
    );
}
