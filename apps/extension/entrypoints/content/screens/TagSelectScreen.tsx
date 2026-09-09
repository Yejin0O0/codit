import type { Ref } from 'react';

import { PanelShell } from '@/components/codit/panel-shell';
import { ResultBadge } from '@/components/codit/result-badge';
import { Button } from '@/components/ui/button';

import { TagPicker } from '../components/TagPicker';
import type { Tag, TagCategory } from '../mockData';
import type { ResultType } from '../screens';
import type { WidgetDragHandlers } from '../useWidgetPosition';

interface TagSelectScreenProps {
    result: ResultType;
    step: string;
    coreTags: Tag[];
    categories: TagCategory[];
    customTags: Tag[];
    selectedTagIds: string[];
    onSelectedTagIdsChange: (ids: string[]) => void;
    onAddCustomTag: (name: string) => void;
    onBack: () => void;
    onSave: () => void;
    onCollapse?: () => void;
    collapseControlRef?: Ref<HTMLButtonElement>;
    dragHandlers?: WidgetDragHandlers;
}

export function TagSelectScreen({
    result,
    step,
    coreTags,
    categories,
    customTags,
    selectedTagIds,
    onSelectedTagIdsChange,
    onAddCustomTag,
    onBack,
    onSave,
    onCollapse,
    collapseControlRef,
    dragHandlers,
}: TagSelectScreenProps) {
    const canSave = selectedTagIds.length >= 1;

    return (
        <PanelShell
            title="태그 선택"
            step={step}
            onCollapse={onCollapse}
            collapseControlRef={collapseControlRef}
            dragHandlers={dragHandlers}
            footer={
                <>
                    <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
                        뒤로
                    </Button>
                    <Button type="button" className="flex-1" disabled={!canSave} onClick={onSave}>
                        저장
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-4">
                <ResultBadge result={result} className="w-fit" />
                <TagPicker
                    coreTags={coreTags}
                    categories={categories}
                    customTags={customTags}
                    selectedIds={selectedTagIds}
                    onSelectedChange={onSelectedTagIdsChange}
                    onAddCustomTag={onAddCustomTag}
                />
            </div>
        </PanelShell>
    );
}
