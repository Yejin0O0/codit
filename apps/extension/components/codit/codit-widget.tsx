import type { ReactNode } from 'react';

interface CoditWidgetProps {
    children: ReactNode;
}

/**
 * Codit 위젯 프레임(표현 전용).
 * Shadow Root 는 entrypoints/content/index.tsx 가 생성한다 —
 * 이 컴포넌트는 Shadow Root 를 만들지 않는다.
 */
export function CoditWidget({ children }: CoditWidgetProps) {
    return (
        <div data-slot="codit-widget" className="text-foreground w-full">
            {children}
        </div>
    );
}
