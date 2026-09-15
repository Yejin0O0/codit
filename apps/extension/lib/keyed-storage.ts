import { storage, type StorageItemKey } from 'wxt/utils/storage';

/**
 * problemId 로 스코프되는 session storage 항목의 read/write/remove.
 * timer-session·attempt-draft 두 store 가 반복하던 key-builder + try/catch + console.warn
 * 패턴을 통합한다(#73 PR 리뷰).
 */
export function createKeyedStore<T>(namespace: string, warnLabel: string) {
    function key(problemId: string): StorageItemKey {
        return `session:${namespace}:${problemId}`;
    }

    async function read(problemId: string): Promise<T | null> {
        try {
            return await storage.getItem<T>(key(problemId));
        } catch {
            console.warn(`[codit] ${warnLabel} 읽기에 실패했습니다`);
            return null;
        }
    }

    async function write(problemId: string, value: T): Promise<void> {
        try {
            await storage.setItem<T>(key(problemId), value);
        } catch {
            console.warn(`[codit] ${warnLabel} 저장에 실패했습니다`);
        }
    }

    async function remove(problemId: string): Promise<void> {
        try {
            await storage.removeItem(key(problemId));
        } catch {
            console.warn(`[codit] ${warnLabel} 삭제에 실패했습니다`);
        }
    }

    return { key, read, write, remove };
}
