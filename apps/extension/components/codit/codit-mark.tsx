import { cn } from '@/lib/utils';

interface CoditMarkProps {
    /**
     * true: 두꺼운 C + 민트 체크 (풀 로고 — BrandHeader).
     * false: 두꺼운 C 단색만 (pill — CollapsedTimer, ~16px 판독 우선).
     */
    withCheck?: boolean;
    className?: string;
}

/**
 * Codit 'C' 브랜드 마크 (인라인 SVG — `docs/ui/brand/codit-logo-icon.png` 트레이스).
 * 두꺼운 C 획 + (옵션) 굵은 민트 체크. 오른쪽으로 열린 넓은 입.
 * C 는 `currentColor`(부모 text 색으로 제어, 예: `text-primary`), 체크는 `--success`.
 * path 좌표·stroke 굵기의 Source of Truth — 여기 한 곳에만 둔다. (docs/ui/brand/README.md)
 */
export function CoditMark({ withCheck = false, className }: CoditMarkProps) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" className={cn('size-5', className)}>
            <path
                d="M17.5 5.2A8.5 8.5 0 1 0 17.5 18.8"
                stroke="currentColor"
                strokeWidth="4.6"
                strokeLinecap="round"
            />
            {withCheck ? (
                <path
                    className="stroke-success"
                    d="M10.6 12.6 14 16 20.6 8.4"
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            ) : null}
        </svg>
    );
}
