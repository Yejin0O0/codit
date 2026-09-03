import type { TagOption } from '@/lib/tag-catalog';

/** 사용자가 직접 입력한 태그 이름을 custom tag id 로 변환한다. */
export function toCustomTagId(name: string): string {
    return `custom:${name.trim().toLowerCase().replace(/\s+/g, '-')}`;
}

export interface ResolvedTagInput {
    tag: TagOption;
    /** 기존 태그가 없어 새로 만든 custom tag 인지 여부 */
    isNew: boolean;
}

/**
 * 직접 입력한 태그 이름을 실제로 선택할 태그로 해석한다.
 *
 * - 트림 후 빈 문자열 → null (무시)
 * - 이미 있는 태그(id 일치 또는 이름 대소문자 무시 일치) → 그 태그 그대로 (isNew: false)
 * - 그 외 → 새 custom tag 생성 (isNew: true)
 *
 * predefined 태그와 같은 이름을 입력해도 새 custom id 를 만들지 않고
 * 기존 태그 id 를 선택하게 하여 선택 상태와 태그 카탈로그가 어긋나지 않도록 한다.
 */
export function resolveCustomTagInput(
    rawName: string,
    knownTags: TagOption[],
): ResolvedTagInput | null {
    const trimmed = rawName.trim();
    if (!trimmed) {
        return null;
    }

    const id = toCustomTagId(trimmed);
    const existing = knownTags.find(
        (tag) => tag.id === id || tag.name.toLowerCase() === trimmed.toLowerCase(),
    );

    if (existing) {
        return { tag: existing, isNew: false };
    }

    return { tag: { id, name: trimmed }, isNew: true };
}
