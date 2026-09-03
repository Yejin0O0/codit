import type { PointerEvent as ReactPointerEvent } from 'react';

/** 위젯의 화면 내 위치. 뷰포트 좌상단 기준 px. 전역 1개. (prd ADR-1) */
export interface WidgetPosition {
    top: number;
    left: number;
}

export interface Size {
    width: number;
    height: number;
}

/**
 * 위젯 전체가 뷰포트 안에 남도록 위치를 경계 안으로 보정한다. (prd ADR-4 Clamp)
 * 위젯이 뷰포트보다 크면 해당 축의 top/left 를 0 으로 고정한다.
 */
export function clampPosition(_pos: WidgetPosition, _widget: Size, _viewport: Size): WidgetPosition {
    // TDD Red 스텁 — Green 단계에서 구현
    return { top: -1, left: -1 };
}

/** PanelShell 헤더 등 드래그 핸들에 스프레드하는 pointer 핸들러 묶음. */
export interface WidgetDragHandlers {
    onPointerDown: (event: ReactPointerEvent) => void;
}

export interface UseWidgetPositionResult {
    dragHandlers: WidgetDragHandlers;
}

/**
 * `#codit-root`(Shadow DOM 밖의 position:fixed 컨테이너)의 위치를 소유하는 훅. (prd ADR-2)
 * storage 연동은 없다 — 새로고침 시 Default position 으로 복귀한다 (영속은 Issue #21).
 */
export function useWidgetPosition(
    _containerEl: HTMLElement | null | undefined,
): UseWidgetPositionResult {
    // TDD Red 스텁 — Green 단계에서 구현
    return { dragHandlers: { onPointerDown: () => {} } };
}
