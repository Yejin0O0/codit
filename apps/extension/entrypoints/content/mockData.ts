// Timer(Floating Widget) 전용 mock.
// Tag taxonomy 는 Extension 공통 SoT(@/lib/tag-catalog)를 재노출하며, 여기서 복제하지 않는다.
// 실제 Timer Domain / 문제 연동은 이후 단계에서 교체한다.
import type { TagOption } from '@/lib/tag-catalog';

export { CORE_TAGS, TAG_CATALOG, TAG_CATEGORIES } from '@/lib/tag-catalog';
export type { TagCategory } from '@/lib/tag-catalog';

/** Timer 코드에서 쓰는 태그 shape 이름 (공통 TagOption 과 동일 구조). */
export type Tag = TagOption;

export const MOCK_PROBLEM = {
    problemId: '1859',
};
