import { cn } from '@/lib/utils';

import { CoditMark } from './codit-mark';

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
                <CoditMark withCheck className="text-primary" />
                <span className="brand-wordmark text-base font-bold tracking-tight">Codit</span>
            </span>
            {isFull ? (
                <span className="text-muted-foreground text-sm">{DESCRIPTION}</span>
            ) : null}
        </div>
    );
}
