import { useState } from 'react';

import { TagToggleGroup } from '@/components/codit/tag-toggle-group';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import type { TagCategory, TagOption } from '@/lib/tag-catalog';

interface TagPickerProps {
    coreTags: TagOption[];
    categories: TagCategory[];
    customTags: TagOption[];
    selectedIds: string[];
    onSelectedChange: (ids: string[]) => void;
    onAddCustomTag: (name: string) => Promise<boolean>;
}

/**
 * 핵심 태그 + "더보기"(대분류 섹션) + 직접 입력.
 * 대분류는 섹션 제목일 뿐이며 별도 navigation 단계가 없다.
 */
export function TagPicker({
    coreTags,
    categories,
    customTags,
    selectedIds,
    onSelectedChange,
    onAddCustomTag,
}: TagPickerProps) {
    const [draft, setDraft] = useState('');
    const [moreOpen, setMoreOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [addError, setAddError] = useState(false);

    const submitDraft = async () => {
        const name = draft.trim();
        if (!name || isAdding) return;
        setIsAdding(true);
        setAddError(false);
        const success = await onAddCustomTag(name);
        setIsAdding(false);
        if (success) {
            setDraft('');
        } else {
            setAddError(true);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">태그</span>
                <span className="text-muted-foreground text-xs">1개 이상 선택</span>
            </div>

            <TagToggleGroup
                items={coreTags}
                value={selectedIds}
                onValueChange={onSelectedChange}
                ariaLabel="핵심 태그"
            />

            {customTags.length > 0 ? (
                <TagToggleGroup
                    items={customTags}
                    value={selectedIds}
                    onValueChange={onSelectedChange}
                    ariaLabel="직접 추가한 태그"
                />
            ) : null}

            <Collapsible open={moreOpen} onOpenChange={setMoreOpen} className="flex flex-col gap-3">
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
                                value={selectedIds}
                                onValueChange={onSelectedChange}
                                ariaLabel={category.title}
                            />
                        </div>
                    ))}
                </CollapsibleContent>
            </Collapsible>

            <div className="flex gap-2">
                <Input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            void submitDraft();
                        }
                    }}
                    placeholder="태그 직접 입력"
                    className="h-8 text-xs"
                />
                <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => void submitDraft()}
                    disabled={isAdding}
                >
                    {isAdding ? '추가 중…' : '추가'}
                </Button>
            </div>
            {addError ? (
                <p className="text-destructive text-xs">태그 추가에 실패했습니다. 다시 시도해 주세요.</p>
            ) : null}

            <p className="text-muted-foreground text-xs">{selectedIds.length}개 선택됨</p>
        </div>
    );
}
