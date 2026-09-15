import { CORE_TAGS, TAG_CATEGORIES } from './tag-catalog';

/**
 * 문제유형 태그 색상 — 카테고리별 hue 패밀리 (UI-L2 R9, 이슈 #100).
 *
 * 앱이 이미 결과 상태색(success=정답/destructive=오답/warning=보류)을 쓰고 있어서,
 * dataviz 팔레트 8색 중 그 세 색과 가까운 aqua/yellow/green/red 는 뺐다. 남은
 * blue/orange/violet/magenta 4색만 CVD·명도 검증기를 통과했다
 * (`node scripts/validate_palette.js "#2a78d6,#eb6834,#4a3aa7,#e87ba4" --mode light`).
 * 7개 백엔드 카테고리를 억지로 7색으로 나누면 검증을 통과하지 못해 이 4개 패밀리로 묶었다
 * — 칩에는 항상 태그 이름 텍스트가 함께 보이므로(색만으로 식별하지 않음) 한 패밀리 안
 * 카테고리끼리는 색만으론 구분되지 않는 절충을 받아들인다.
 */
export type TagColorFamily = 'core' | 'custom' | 'blue' | 'orange' | 'violet' | 'magenta';

const FAMILY_CLASS: Record<TagColorFamily, string> = {
    core: 'bg-accent text-accent-foreground',
    custom: 'bg-secondary text-secondary-foreground',
    blue: 'bg-[#E6EEFC] text-[#2A5FB0]',
    orange: 'bg-[#FCE8DE] text-[#B8501C]',
    violet: 'bg-[#EEEAFA] text-[#4A3AA7]',
    magenta: 'bg-[#FBE8F0] text-[#A8356F]',
};

const CATEGORY_FAMILY: Record<string, TagColorFamily> = {
    자료구조: 'blue',
    '탐색·완전탐색': 'orange',
    그래프: 'orange',
    '알고리즘 설계 기법': 'violet',
    수학: 'violet',
    '문자열 알고리즘': 'magenta',
    고급: 'magenta',
};

const CORE_IDS = new Set(CORE_TAGS.map((tag) => tag.id));
const ID_TO_CATEGORY_TITLE = new Map<string, string>();
for (const category of TAG_CATEGORIES) {
    for (const tag of category.tags) {
        ID_TO_CATEGORY_TITLE.set(tag.id, category.title);
    }
}

export function tagColorFamily(tagId: string): TagColorFamily {
    if (CORE_IDS.has(tagId)) return 'core';
    const title = ID_TO_CATEGORY_TITLE.get(tagId);
    return (title && CATEGORY_FAMILY[title]) || 'custom';
}

export function tagColorClass(tagId: string): string {
    return FAMILY_CLASS[tagColorFamily(tagId)];
}
