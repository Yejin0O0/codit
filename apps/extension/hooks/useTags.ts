import { useCallback, useEffect, useState } from 'react';

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

interface ApiTag {
    id: number;
    name: string;
    category: string;
}

function toTagOption(apiTag: ApiTag): TagOption {
    return { id: String(apiTag.id), name: apiTag.name };
}

function groupByCategory(tags: ApiTag[]): TagCategory[] {
    const map = new Map<string, TagOption[]>();
    for (const tag of tags) {
        if (tag.category === 'CORE' || tag.category === 'CUSTOM') continue;
        const label = CATEGORY_LABELS[tag.category] ?? tag.category;
        if (!map.has(label)) map.set(label, []);
        map.get(label)!.push(toTagOption(tag));
    }
    return CATEGORY_ORDER.filter((key) => map.has(CATEGORY_LABELS[key] ?? key)).map((key) => {
        const label = CATEGORY_LABELS[key] ?? key;
        return { title: label, tags: map.get(label)! };
    });
}

export function useTags() {
    const [coreTags, setCoreTags] = useState<TagOption[]>([]);
    const [categories, setCategories] = useState<TagCategory[]>([]);
    const [customTags, setCustomTags] = useState<TagOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchTags = useCallback(async (cancelled?: { current: boolean }) => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/tags`);
            if (cancelled?.current) return;
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const tags = (await response.json()) as ApiTag[];
            if (cancelled?.current) return;
            setCoreTags(tags.filter((t) => t.category === 'CORE').map(toTagOption));
            setCategories(groupByCategory(tags));
            setCustomTags(tags.filter((t) => t.category === 'CUSTOM').map(toTagOption));
        } catch (e) {
            if (cancelled?.current) return;
            setError(e instanceof Error ? e : new Error('태그를 불러오지 못했습니다'));
        } finally {
            if (!cancelled?.current) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const cancelled = { current: false };
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void fetchTags(cancelled);
        return () => {
            cancelled.current = true;
        };
    }, [fetchTags]);

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
            if (tag.category === 'CUSTOM') {
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
