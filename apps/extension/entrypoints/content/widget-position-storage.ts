import { storage } from 'wxt/utils/storage';

import type { WidgetPosition } from './useWidgetPosition';

export const WIDGET_POSITION_KEY = 'local:widgetPosition' as const;

/** NaN · 형식 오류 · 누락 값을 걸러낸다. */
export function isValidPosition(value: unknown): value is WidgetPosition {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const pos = value as Record<string, unknown>;
    return (
        typeof pos.top === 'number' &&
        Number.isFinite(pos.top) &&
        typeof pos.left === 'number' &&
        Number.isFinite(pos.left)
    );
}

/** 저장된 위치를 읽는다. 없거나 손상 · 읽기 실패면 null. */
export async function readWidgetPosition(): Promise<WidgetPosition | null> {
    try {
        const raw = await storage.getItem(WIDGET_POSITION_KEY);
        if (isValidPosition(raw)) {
            return raw;
        }
        return null;
    } catch {
        return null;
    }
}

/** 위치를 저장한다. 실패 시 console.warn 1줄, throw 하지 않는다. */
export async function writeWidgetPosition(pos: WidgetPosition): Promise<void> {
    try {
        await storage.setItem(WIDGET_POSITION_KEY, pos);
    } catch {
        console.warn('[codit] 위젯 위치 저장에 실패했습니다 — 인메모리로 유지됩니다');
    }
}

/** 다른 탭의 위치 변경을 구독한다. 손상값은 콜백에 전달하지 않는다. 해지 함수 반환. */
export function watchWidgetPosition(onChange: (pos: WidgetPosition) => void): () => void {
    return storage.watch<WidgetPosition>(WIDGET_POSITION_KEY, (raw) => {
        if (isValidPosition(raw)) {
            onChange(raw);
        }
    });
}
