import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// history/types.ts 에 의존하지 않는다 — 필요한 최소 shape만 사용.
interface TagChipOption {
    id: string;
    name: string;
}
interface TagChipListProps {
    tagIds: string[];
    catalog: TagChipOption[];
    className?: string;
}

export function TagChipList({ tagIds, catalog, className }: TagChipListProps) {
    const chips = tagIds
        .map((id) => catalog.find((tag) => tag.id === id))
        .filter((tag): tag is TagChipOption => tag !== undefined);

    if (chips.length === 0) {
        return null;
    }

    return (
        <div className={cn('flex flex-wrap gap-1', className)}>
            {chips.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                    {tag.name}
                </Badge>
            ))}
        </div>
    );
}
