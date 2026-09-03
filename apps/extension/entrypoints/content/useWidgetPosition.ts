import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
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

const DEFAULT_MARGIN = 20;
const DRAG_THRESHOLD_PX = 5;

/**
 * 위젯 전체가 뷰포트 안에 남도록 위치를 경계 안으로 보정한다. (prd ADR-4 Clamp)
 * 위젯이 뷰포트보다 크면 해당 축의 top/left 를 0 으로 고정한다.
 */
export function clampPosition(pos: WidgetPosition, widget: Size, viewport: Size): WidgetPosition {
    const maxLeft = Math.max(0, viewport.width - widget.width);
    const maxTop = Math.max(0, viewport.height - widget.height);

    return {
        left: Math.min(Math.max(0, pos.left), maxLeft),
        top: Math.min(Math.max(0, pos.top), maxTop),
    };
}

/** PanelShell 헤더 · collapsed pill 등 드래그 핸들에 연결하는 pointer 핸들러 묶음. */
export interface WidgetDragHandlers {
    onPointerDown: (event: ReactPointerEvent) => void;
    /** 직전 pointer 제스처가 드래그(≥5px)였으면 true 를 1회 반환하고 플래그를 소비한다. (Issue #20) */
    consumeDragEnd: () => boolean;
}

export interface UseWidgetPositionResult {
    dragHandlers: WidgetDragHandlers;
    /** 위젯 크기가 바뀐 뒤(collapsed↔expanded 등) 현재 위치를 재clamp 한다. (Issue #20) */
    reclamp: () => void;
}

// --- #codit-root(React 트리 밖) 를 조작하는 명령형 헬퍼 (prd ADR-2) ---

function viewportSize(): Size {
    return { width: window.innerWidth, height: window.innerHeight };
}

function elementSize(el: HTMLElement): Size {
    const rect = el.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
}

/** pos 를 el 의 현재 크기·뷰포트 기준으로 clamp 한다. */
function clampWithin(el: HTMLElement, pos: WidgetPosition): WidgetPosition {
    return clampPosition(pos, elementSize(el), viewportSize());
}

/** 최종 위치를 `top/left` 로 확정하고 `right` 앵커를 제거한다. */
function writePosition(el: HTMLElement, pos: WidgetPosition): void {
    el.style.top = `${pos.top}px`;
    el.style.left = `${pos.left}px`;
    el.style.right = '';
}

/** 드래그 중 임시 이동 — 컴포지터 전용 transform. */
function writeDragTransform(el: HTMLElement, dx: number, dy: number): void {
    el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
}

function beginDragVisual(el: HTMLElement): void {
    el.setAttribute('data-dragging', 'true');
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
}

function endDragVisual(el: HTMLElement): void {
    el.style.transform = '';
    el.removeAttribute('data-dragging');
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
}

/**
 * `#codit-root`(Shadow DOM 밖의 position:fixed 컨테이너)의 위치를 소유하는 훅. (prd ADR-2)
 *
 * - mount 시 containerEl 크기를 측정해 Default position(top-right, margin 20)으로 초기화하고
 *   `right` 앵커를 제거한 뒤 `top/left` 로 전환한다.
 * - 헤더 드래그: pointermove 중 `transform: translate3d`(rAF throttle), pointerup 시
 *   최종 위치를 clamp 해 `top/left` 로 확정한다. 이동 거리가 5px 미만이면 클릭으로 보고 커밋하지 않는다.
 * - 드래그 중 containerEl 에 `data-dragging`, document.body 에 `user-select: none` +
 *   `cursor: grabbing` 을 적용하고 종료 시 되돌린다.
 * - `resize` 시 현재 위치를 새 뷰포트에 맞춰 재clamp 한다.
 * - storage 연동은 없다 — 새로고침 시 Default position 으로 복귀한다 (영속은 Issue #21).
 */
export function useWidgetPosition(
    containerEl: HTMLElement | null | undefined,
): UseWidgetPositionResult {
    const positionRef = useRef<WidgetPosition>({ top: DEFAULT_MARGIN, left: DEFAULT_MARGIN });
    // 직전 pointer 제스처가 드래그(≥5px)였는지. pill 의 클릭(펼치기) 억제용. (Issue #20)
    const draggedRef = useRef(false);

    const commitPosition = useCallback(
        (pos: WidgetPosition) => {
            positionRef.current = pos;
            if (containerEl) {
                writePosition(containerEl, pos);
            }
        },
        [containerEl],
    );

    // mount: Default position(top-right)으로 초기화하고 top/left 로 전환한다.
    useLayoutEffect(() => {
        if (!containerEl) {
            return;
        }
        const defaultLeft = viewportSize().width - elementSize(containerEl).width - DEFAULT_MARGIN;
        commitPosition(clampWithin(containerEl, { top: DEFAULT_MARGIN, left: defaultLeft }));
    }, [containerEl, commitPosition]);

    // resize: 현재 위치를 새 뷰포트에 맞춰 재clamp 한다.
    useEffect(() => {
        if (!containerEl) {
            return;
        }
        const onResize = () => {
            commitPosition(clampWithin(containerEl, positionRef.current));
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [containerEl, commitPosition]);

    const onPointerDown = useCallback(
        (event: ReactPointerEvent) => {
            if (!containerEl) {
                return;
            }
            if ((event.target as HTMLElement).closest('[data-codit-no-drag]')) {
                return;
            }

            draggedRef.current = false;
            const el = containerEl;
            const startX = event.clientX;
            const startY = event.clientY;
            const startPos = positionRef.current;
            const state = { latestX: startX, latestY: startY, rafId: null as number | null };

            (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
            beginDragVisual(el);

            function paintTransform() {
                state.rafId = null;
                writeDragTransform(el, state.latestX - startX, state.latestY - startY);
            }

            function onMove(moveEvent: PointerEvent) {
                state.latestX = moveEvent.clientX;
                state.latestY = moveEvent.clientY;
                if (state.rafId === null) {
                    state.rafId = requestAnimationFrame(paintTransform);
                }
            }

            function endDrag() {
                if (state.rafId !== null) {
                    cancelAnimationFrame(state.rafId);
                    state.rafId = null;
                }
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', endDrag);
                window.removeEventListener('pointercancel', endDrag);
                endDragVisual(el);

                const dx = state.latestX - startX;
                const dy = state.latestY - startY;
                if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) {
                    return;
                }
                // 드래그였음을 표시 — 뒤따르는 click(펼치기 등)을 소비처가 억제한다.
                draggedRef.current = true;
                setTimeout(() => {
                    draggedRef.current = false;
                }, 0);
                commitPosition(
                    clampWithin(el, { top: startPos.top + dy, left: startPos.left + dx }),
                );
            }

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', endDrag);
            window.addEventListener('pointercancel', endDrag);
        },
        [containerEl, commitPosition],
    );

    // 위젯 크기 변화(collapsed↔expanded 등) 후 현재 위치를 새 크기·뷰포트 기준으로 재clamp.
    const reclamp = useCallback(() => {
        if (!containerEl) {
            return;
        }
        commitPosition(clampWithin(containerEl, positionRef.current));
    }, [containerEl, commitPosition]);

    // 직전 제스처가 드래그였으면 true 를 반환하고 플래그를 소비한다.
    const consumeDragEnd = useCallback(() => {
        const dragged = draggedRef.current;
        draggedRef.current = false;
        return dragged;
    }, []);

    return { dragHandlers: { onPointerDown, consumeDragEnd }, reclamp };
}
