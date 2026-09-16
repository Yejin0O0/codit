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
 *
 * CORE는 처음에 새 색 없이 --accent(파스텔 iris)를 재사용했는데, 실제로 렌더해 보니
 * --accent-foreground(hue ≈ 280°)가 violet 패밀리(hue ≈ 258°, #4A3AA7)와 육안으로
 * 거의 구분이 안 됐다(스크린샷으로 확인). violet 자체는 CVD 검증기를 통과한 값이라
 * 건드리지 않고, 대신 CORE를 파스텔이 아니라 filled(--primary)로 바꿔 톤 자체를
 * 다르게 만들었다 — hue가 얼마나 가깝든 파스텔 4색 중 어느 것과도 안 헷갈린다.
 * TagToggleGroup의 선택 상태도 이미 bg-primary/text-primary-foreground라 톤이 낯설지 않다.
 *
 * 값 자체는 `styles/tokens.css`의 `--tag-*`/`--tag-*-foreground` 토큰 + `@theme inline`
 * 매핑으로 정식 등록돼 있다 (docs/ui/design-system.md ## 기초 색 토큰 참조) — 여기서는
 * 임의 hex(`bg-[#...]`)가 아니라 그 토큰이 만드는 `bg-tag-*`/`text-tag-*-foreground`
 * Tailwind 클래스만 조합한다.
 */
export type TagColorFamily = 'core' | 'custom' | 'blue' | 'orange' | 'violet' | 'magenta';

const FAMILY_CLASS: Record<TagColorFamily, string> = {
    core: 'bg-primary text-primary-foreground',
    custom: 'bg-secondary text-secondary-foreground',
    blue: 'bg-tag-blue text-tag-blue-foreground',
    orange: 'bg-tag-orange text-tag-orange-foreground',
    violet: 'bg-tag-violet text-tag-violet-foreground',
    magenta: 'bg-tag-magenta text-tag-magenta-foreground',
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
