import { useState } from 'react';

import { TagToggleGroup } from '@/components/codit/tag-toggle-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import type { TagCategory, TagOption } from './types';

interface TagFilterPanelProps {
    coreTags: TagOption[];
    categories: TagCategory[];
    selectedTagIds: string[];
    onSelectedTagIdsChange: (next: string[]) => void;
}

/**
 * 결과 태그 필터. selectedTagIds 는 핵심 + 모든 카테고리 그룹의 단일 전역 SoT.
 * 각 TagToggleGroup 은 자신의 item 만 반영하고 다른 그룹 선택은 보존한다.
 */
export function TagFilterPanel({
    coreTags,
    categories,
    selectedTagIds,
    onSelectedTagIdsChange,
}: TagFilterPanelProps) {
    const [open, setOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);

    return (
        <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col gap-3">
            <CollapsibleTrigger className="text-muted-foreground hover:text-foreground w-fit text-xs font-medium">
                태그 필터
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-3">
                <TagToggleGroup
                    items={coreTags}
                    value={selectedTagIds}
                    onValueChange={onSelectedTagIdsChange}
                    ariaLabel="핵심 태그"
                />

                <Collapsible
                    open={moreOpen}
                    onOpenChange={setMoreOpen}
                    className="flex flex-col gap-3"
                >
                    <CollapsibleTrigger className="text-muted-foreground hover:text-foreground w-fit text-xs font-medium">
                        {moreOpen ? '접기' : '더보기'}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="flex flex-col gap-3">
                        {categories.map((category) => (
                            <div key={category.title} className="flex flex-col gap-1.5">
                                <p className="text-muted-foreground text-xs font-semibold">
                                    {category.title}
                                </p>
                                <TagToggleGroup
                                    items={category.tags}
                                    value={selectedTagIds}
                                    onValueChange={onSelectedTagIdsChange}
                                    ariaLabel={category.title}
                                />
                            </div>
                        ))}
                    </CollapsibleContent>
                </Collapsible>
            </CollapsibleContent>
        </Collapsible>
    );
}
