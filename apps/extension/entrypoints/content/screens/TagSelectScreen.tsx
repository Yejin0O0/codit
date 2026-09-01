import { PanelShell } from '@/components/codit/panel-shell';
import { Button } from '@/components/ui/button';

import { TagPicker } from '../components/TagPicker';
import type { Tag, TagCategory } from '../mockData';

interface TagSelectScreenProps {
    step: string;
    coreTags: Tag[];
    categories: TagCategory[];
    customTags: Tag[];
    selectedTagIds: string[];
    onSelectedTagIdsChange: (ids: string[]) => void;
    onAddCustomTag: (name: string) => void;
    onBack: () => void;
    onSave: () => void;
}

export function TagSelectScreen({
    step,
    coreTags,
    categories,
    customTags,
    selectedTagIds,
    onSelectedTagIdsChange,
    onAddCustomTag,
    onBack,
    onSave,
}: TagSelectScreenProps) {
    const canSave = selectedTagIds.length >= 1;

    return (
        <PanelShell
            title="태그 선택"
            step={step}
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
            <TagPicker
                coreTags={coreTags}
                categories={categories}
                customTags={customTags}
                selectedIds={selectedTagIds}
                onSelectedChange={onSelectedTagIdsChange}
                onAddCustomTag={onAddCustomTag}
            />
        </PanelShell>
    );
}
