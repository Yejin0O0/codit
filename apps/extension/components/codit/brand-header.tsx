import { cn } from '@/lib/utils';

interface BrandHeaderProps {
    /** full: 로고 + 워드마크 + 설명 문구 / compact: 로고 + 워드마크 (설명 문구만 생략) */
    variant?: 'full' | 'compact';
    className?: string;
}

const DESCRIPTION = '문제풀이 기록을 관리하세요';

export function BrandHeader({ variant = 'full', className }: BrandHeaderProps) {
    const isFull = variant === 'full';

    return (
        <div
            data-slot="brand-header"
            className={cn('flex items-center gap-2', isFull && 'flex-col', className)}
        >
            <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" className="size-5">
                    {/* C 마크: iris C + 민트 체크 (docs/ui/brand/README.md, prd.md Q3=A) */}
                    <path
                        className="stroke-primary"
                        d="M16.8 6.2A7.5 7.5 0 1 0 16.8 17.8"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                    />
                    <path
                        className="stroke-success"
                        d="M12.2 11.8 15 14.6 20.6 8.2"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
                <span className="brand-wordmark text-base font-bold tracking-tight">Codit</span>
            </span>
            {isFull ? (
                <span className="text-muted-foreground text-sm">{DESCRIPTION}</span>
            ) : null}
        </div>
    );
}
