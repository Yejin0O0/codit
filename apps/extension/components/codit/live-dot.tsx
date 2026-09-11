import { cn } from '@/lib/utils';

interface LiveDotProps {
    /** 위치 조정용 (예: 'absolute -top-0.5 -right-0.5'). 크기·색은 고정. */
    className?: string;
}

/**
 * "측정 중" 민트 펄스 도트 — `animate-ping` 후광 + 중심점 (CUSTOM, 대응 primitive 없음).
 * `aria-hidden` — 진행 상태는 인접 텍스트가 전한다. `prefers-reduced-motion` 시 후광은
 * tokens.css 전역 `@media`가 정지시킨다 (정적 도트로 남음).
 * TimerDisplay(캡션 앞) · CollapsedTimer(시간 뒤) 공유.
 */
export function LiveDot({ className }: LiveDotProps) {
    return (
        <span className={cn('relative flex size-1.5', className)} aria-hidden="true">
            <span className="bg-success absolute inline-flex size-full animate-ping rounded-full opacity-60" />
            <span className="bg-success relative inline-flex size-1.5 rounded-full" />
        </span>
    );
}
