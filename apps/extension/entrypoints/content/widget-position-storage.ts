import type { WidgetPosition } from './useWidgetPosition';

export const WIDGET_POSITION_KEY = 'local:widgetPosition' as const;

/** NaN · 형식 오류 · 누락 값을 걸러낸다. */
export function isValidPosition(_value: unknown): _value is WidgetPosition {
    // TDD Red 스텁 — Green 단계에서 구현
    return false;
}

/** 저장된 위치를 읽는다. 없거나 손상 · 읽기 실패면 null. */
export async function readWidgetPosition(): Promise<WidgetPosition | null> {
    // TDD Red 스텁 — Green 단계에서 구현
    return { top: -1, left: -1 };
}

/** 위치를 저장한다. 실패 시 console.warn 1줄, throw 하지 않는다. */
export async function writeWidgetPosition(_pos: WidgetPosition): Promise<void> {
    // TDD Red 스텁 — Green 단계에서 구현
}

/** 다른 탭의 위치 변경을 구독한다. 손상값은 콜백에 전달하지 않는다. 해지 함수 반환. */
export function watchWidgetPosition(_onChange: (pos: WidgetPosition) => void): () => void {
    // TDD Red 스텁 — Green 단계에서 구현
    return () => {};
}
