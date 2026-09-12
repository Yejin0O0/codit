import type { Ref } from 'react';

import { PanelShell } from '@/components/codit/panel-shell';
import { Button } from '@/components/ui/button';
import type { TagCategory, TagOption } from '@/lib/tag-catalog';

import { TagPicker } from '../components/TagPicker';
import type { WidgetDragHandlers } from '../useWidgetPosition';

interface TagSelectScreenProps {
    step: string;
    coreTags: TagOption[];
    categories: TagCategory[];
    customTags: TagOption[];
    selectedTagIds: string[];
    onSelectedTagIdsChange: (ids: string[]) => void;
    onAddCustomTag: (name: string) => Promise<boolean>;
    onBack: () => void;
    onSave: () => void;
    onCollapse?: () => void;
    collapseControlRef?: Ref<HTMLButtonElement>;
    dragHandlers?: WidgetDragHandlers;
    isLoading?: boolean;
    error?: Error | null;
    onRetry?: () => void;
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
    onCollapse,
    collapseControlRef,
    dragHandlers,
    isLoading = false,
    error = null,
    onRetry,
}: TagSelectScreenProps) {
    const canSave = selectedTagIds.length >= 1 && !isLoading && !error;

    function renderBody() {
        if (isLoading) {
            return (
                <p className="text-muted-foreground py-4 text-center text-sm">태그를 불러오는 중…</p>
            );
        }
        if (error) {
            return (
                <div className="flex flex-col items-center gap-3 py-4">
                    <p className="text-destructive text-sm">태그를 불러오지 못했습니다.</p>
                    {onRetry ? (
                        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                            다시 시도
                        </Button>
                    ) : null}
                </div>
            );
        }
        return (
            <TagPicker
                coreTags={coreTags}
                categories={categories}
                customTags={customTags}
                selectedIds={selectedTagIds}
                onSelectedChange={onSelectedTagIdsChange}
                onAddCustomTag={onAddCustomTag}
            />
        );
    }

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
            {renderBody()}
        </PanelShell>
    );
}
