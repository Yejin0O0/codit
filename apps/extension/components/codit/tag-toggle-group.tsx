import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';

import { toggleVariants } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

export interface TagOption {
    id: string;
    name: string;
}

interface TagToggleGroupProps {
    items: TagOption[];
    /** 전역 선택 id 목록 */
    value: string[];
    /** 병합된 전역 선택 id 목록을 돌려준다 */
    onValueChange: (next: string[]) => void;
    ariaLabel?: string;
    className?: string;
}

/**
 * 다중 선택 태그 chip 그룹 (EXTEND ← Radix ToggleGroup + Foundation toggleVariants).
 *
 * 여러 그룹(핵심/카테고리별/직접입력)이 같은 선택 집합을 공유하므로,
 * 내부에서는 자신이 렌더하는 item 만 반영하고 나머지 선택은 그대로 유지한다.
 */
export function TagToggleGroup({
    items,
    value,
    onValueChange,
    ariaLabel,
    className,
}: TagToggleGroupProps) {
    const itemIds = new Set(items.map((item) => item.id));
    const groupValue = value.filter((id) => itemIds.has(id));

    const handleChange = (nextGroupValue: string[]) => {
        onValueChange([...value.filter((id) => !itemIds.has(id)), ...nextGroupValue]);
    };

    return (
        <ToggleGroupPrimitive.Root
            type="multiple"
            value={groupValue}
            onValueChange={handleChange}
            aria-label={ariaLabel}
            className={cn('flex flex-wrap gap-1.5', className)}
        >
            {items.map((item) => (
                <ToggleGroupPrimitive.Item
                    key={item.id}
                    value={item.id}
                    className={cn(
                        toggleVariants({ variant: 'outline', size: 'sm' }),
                        'h-7 min-w-0 rounded-full px-3 text-xs font-normal',
                        'data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
                    )}
                >
                    {item.name}
                </ToggleGroupPrimitive.Item>
            ))}
        </ToggleGroupPrimitive.Root>
    );
}
