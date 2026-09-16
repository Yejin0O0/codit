import { useCallback, useEffect, useRef, useState } from 'react';

import { authenticatedFetch } from '@/lib/authenticatedFetch';
import type { TagCategory, TagOption } from '@/lib/tag-catalog';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8080';

const CATEGORY_LABELS: Record<string, string> = {
    DATA_STRUCTURE: '자료구조',
    SEARCH: '탐색·완전탐색',
    GRAPH: '그래프',
    ALGORITHM_DESIGN: '알고리즘 설계 기법',
    STRING_ALGORITHM: '문자열 알고리즘',
    MATH: '수학',
    ADVANCED: '고급',
};

const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);
const FALLBACK_LABEL = '기타';

interface ApiTag {
    id: number;
    name: string;
    category: string;
}

function toTagOption(apiTag: ApiTag): TagOption {
    return { id: String(apiTag.id), name: apiTag.name };
}

/** CATEGORY_LABELS 에 없는 category 는 "기타" 버킷으로 묶어, 새 백엔드 카테고리가 화면에서 조용히 사라지지 않게 한다. */
function groupByCategory(tags: ApiTag[]): TagCategory[] {
    const map = new Map<string, TagOption[]>();
    for (const tag of tags) {
        if (tag.category === 'CORE' || tag.category === 'CUSTOM') continue;
        const label = CATEGORY_LABELS[tag.category] ?? FALLBACK_LABEL;
        if (!map.has(label)) map.set(label, []);
        map.get(label)!.push(toTagOption(tag));
    }
    const known: TagCategory[] = [];
    for (const key of CATEGORY_ORDER) {
        const label = CATEGORY_LABELS[key];
        if (label === undefined) continue;
        const tagsForLabel = map.get(label);
        if (tagsForLabel) known.push({ title: label, tags: tagsForLabel });
    }
    const fallbackTags = map.get(FALLBACK_LABEL);
    if (fallbackTags) known.push({ title: FALLBACK_LABEL, tags: fallbackTags });
    return known;
}

export function useTags() {
    const [coreTags, setCoreTags] = useState<TagOption[]>([]);
    const [categories, setCategories] = useState<TagCategory[]>([]);
    const [customTags, setCustomTags] = useState<TagOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const cancelledRef = useRef(false);

    const fetchTags = useCallback(async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/tags`);
            if (cancelledRef.current) return;
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const tags = (await response.json()) as ApiTag[];
            if (cancelledRef.current) return;
            setCoreTags(tags.filter((t) => t.category === 'CORE').map(toTagOption));
            setCategories(groupByCategory(tags));
            setCustomTags(tags.filter((t) => t.category === 'CUSTOM').map(toTagOption));
        } catch (e) {
            if (cancelledRef.current) return;
            setError(e instanceof Error ? e : new Error('태그를 불러오지 못했습니다'));
        } finally {
            if (!cancelledRef.current) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        cancelledRef.current = false;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void fetchTags();
        return () => {
            cancelledRef.current = true;
        };
    }, [fetchTags]);

    // 수동 재시도(onRetry)도 fetchTags 내부의 cancelledRef 가드를 그대로 타므로,
    // 재시도 응답이 도착하기 전에 unmount 돼도 setState 경고가 나지 않는다.
    const refetch = useCallback(() => {
        setIsLoading(true);
        setError(null);
        void fetchTags();
    }, [fetchTags]);

    const addCustomTag = useCallback(async (name: string): Promise<TagOption | null> => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const tag = (await response.json()) as ApiTag;
            const tagOption = toTagOption(tag);
            if (tag.category === 'CUSTOM' && !cancelledRef.current) {
                setCustomTags((prev) =>
                    prev.some((t) => t.id === tagOption.id) ? prev : [...prev, tagOption],
                );
            }
            return tagOption;
        } catch {
            return null;
        }
    }, []);

    return { coreTags, categories, customTags, isLoading, error, refetch, addCustomTag };
}
