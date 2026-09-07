import type { Ref } from 'react';

import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/format-duration';
import { cn } from '@/lib/utils';

import type { WidgetDragHandlers } from './useWidgetPosition';

interface CollapsedTimerProps {
    seconds: number;
    status: 'running' | 'stopped';
    onExpand: () => void;
    /** collapsed 진입 직후 이 pill 로 포커스를 옮기기 위한 ref (App 이 소유) */
    ref?: Ref<HTMLButtonElement>;
    /** 주어지면 pill 전체가 드래그 핸들이 된다. 클릭(펼치기)과 드래그(이동)는 5px 임계값으로 구분. */
    dragHandlers?: WidgetDragHandlers;
}

/**
 * 접힌 상태의 위젯 — top-right pill.
 * Codit 마크 + 경과시간 mm:ss + 펼치기 chevron (stopped 는 완료 아이콘 추가).
 * pill 전체가 하나의 펼치기 버튼이며 accessible name 은 name-from-contents 로 만든다.
 */
export function CollapsedTimer({
    seconds,
    status,
    onExpand,
    ref,
    dragHandlers,
}: CollapsedTimerProps) {
    const srLabel =
        status === 'stopped'
            ? 'Codit 타이머 펼치기, 완료됨, 풀이 시간 '
            : 'Codit 타이머 펼치기, 경과 시간 ';

    // 드래그(≥5px)로 끝난 pointer 제스처면 펼치기를 억제한다. (Issue #20)
    function handleClick() {
        if (dragHandlers?.consumeDragEnd()) {
            return;
        }
        onExpand();
    }

    return (
        <Button
            ref={ref}
            type="button"
            variant="outline"
            // pill = 완전 원형 (prd.md ADR-4) · shadow-lg = SWEA 흰 페이지 위 분리 (ADR-5)
            className={cn('h-10 gap-2 rounded-full px-3.5 shadow-lg', dragHandlers && 'cursor-grab')}
            onPointerDown={dragHandlers?.onPointerDown}
            onClick={handleClick}
        >
            <svg
                viewBox="0 0 16 16"
                aria-hidden="true"
                fill="currentColor"
                className="text-primary size-5"
            >
                <path d="M8 0 16 8 8 16 0 8Z" />
            </svg>
            <span className="sr-only">{srLabel}</span>
            <span className="text-base font-medium tabular-nums">{formatDuration(seconds)}</span>
            {status === 'stopped' ? (
                <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    className="text-success size-5"
                    aria-hidden="true"
                >
                    <path
                        d="M5 10.5l3.2 3.2L15 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ) : null}
            <svg
                viewBox="0 0 16 16"
                fill="none"
                className="text-muted-foreground size-4"
                aria-hidden="true"
            >
                <path
                    d="M4 10l4-4 4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </Button>
    );
}
