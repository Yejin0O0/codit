import { formatDuration } from '@/lib/format-duration';
import { cn } from '@/lib/utils';

interface TimerDisplayProps {
    seconds: number;
    caption?: string;
    /** true + caption → 캡션 앞에 펄스 도트 (측정 중 표시). */
    running?: boolean;
    className?: string;
}

/**
 * 경과 시간을 mm:ss 로 크게 표시한다 (CUSTOM — 대응 primitive 없음).
 * `running` 이면 캡션 앞에 민트 펄스 도트로 "돌고 있음"을 나타낸다.
 */
export function TimerDisplay({ seconds, caption, running, className }: TimerDisplayProps) {
    return (
        <div className={cn('text-center', className)}>
            <div className="text-foreground text-7xl font-semibold tracking-tight tabular-nums">
                {formatDuration(seconds)}
            </div>
            {caption ? (
                <p className="text-muted-foreground mt-1 flex items-center justify-center gap-1.5 text-xs">
                    {running ? (
                        <span className="relative flex size-1.5" aria-hidden="true">
                            <span className="bg-success absolute inline-flex size-full animate-ping rounded-full opacity-60" />
                            <span className="bg-success relative inline-flex size-1.5 rounded-full" />
                        </span>
                    ) : null}
                    <span>{caption}</span>
                </p>
            ) : null}
        </div>
    );
}
