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
                <svg
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    fill="currentColor"
                    className="text-primary size-5"
                >
                    <path d="M8 0 16 8 8 16 0 8Z" />
                </svg>
                <span className="text-base font-semibold">Codit</span>
            </span>
            {isFull ? (
                <span className="text-muted-foreground text-sm">{DESCRIPTION}</span>
            ) : null}
        </div>
    );
}
