import { cn } from '@/lib/utils';

interface CoditMarkProps {
    /**
     * true: 원호형 C + 민트 체크 (풀 로고 — BrandHeader).
     * false: C 단색만 (pill — CollapsedTimer, ~16px 판독 우선).
     */
    withCheck?: boolean;
    className?: string;
}

/**
 * Codit 'C' 브랜드 마크 (인라인 SVG). C 획은 `currentColor`,
 * 체크는 `--success`. 색은 부모의 text 색으로 제어한다 (예: `text-primary`).
 * path 좌표·stroke 굵기의 Source of Truth — 여기 한 곳에만 둔다.
 * (docs/ui/brand/README.md, prd.md Q3=A)
 */
export function CoditMark({ withCheck = false, className }: CoditMarkProps) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" className={cn('size-5', className)}>
            <path
                d="M16.8 6.2A7.5 7.5 0 1 0 16.8 17.8"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
            />
            {withCheck ? (
                <path
                    className="stroke-success"
                    d="M12.2 11.8 15 14.6 20.6 8.2"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            ) : null}
        </svg>
    );
}
