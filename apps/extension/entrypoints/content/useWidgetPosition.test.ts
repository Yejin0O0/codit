import { act, fireEvent, renderHook } from '@testing-library/react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { storage } from 'wxt/utils/storage';

import { clampPosition, useWidgetPosition } from './useWidgetPosition';
import { WIDGET_POSITION_KEY } from './widget-position-storage';

function rect(width: number, height: number): DOMRect {
    return {
        x: 0,
        y: 0,
        width,
        height,
        top: 0,
        left: 0,
        right: width,
        bottom: height,
        toJSON: () => ({}),
    } as DOMRect;
}

function setViewport(width: number, height: number): void {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
}

function makeContainer(width = 320, height = 400): HTMLElement {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.top = '20px';
    el.style.right = '20px';
    document.body.appendChild(el);
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect(width, height));
    return el;
}

afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    setViewport(1024, 768);
});

describe('clampPosition', () => {
    const widget = { width: 320, height: 400 };
    const viewport = { width: 1000, height: 800 };

    it('[정상] 위젯이 뷰포트 안에 완전히 들어오면 위치를 그대로 반환한다', () => {
        expect(clampPosition({ top: 100, left: 200 }, widget, viewport)).toEqual({
            top: 100,
            left: 200,
        });
    });

    it('[경계] 오른쪽으로 넘치면 위젯 오른쪽 끝이 뷰포트 오른쪽 끝에 맞도록 left 를 보정한다', () => {
        expect(clampPosition({ top: 100, left: 900 }, widget, viewport)).toEqual({
            top: 100,
            left: 680, // 1000 - 320
        });
    });

    it('[경계] 아래로 넘치면 위젯 아래 끝이 뷰포트 아래 끝에 맞도록 top 을 보정한다', () => {
        expect(clampPosition({ top: 700, left: 200 }, widget, viewport)).toEqual({
            top: 400, // 800 - 400
            left: 200,
        });
    });

    it('[경계] 좌·상단으로 음수가 되면 top/left 를 0 으로 보정한다', () => {
        expect(clampPosition({ top: -50, left: -30 }, widget, viewport)).toEqual({
            top: 0,
            left: 0,
        });
    });

    it('[예외] 위젯이 뷰포트보다 크면 해당 축의 top/left 를 0 으로 고정한다', () => {
        expect(
            clampPosition({ top: 100, left: 100 }, { width: 1200, height: 900 }, viewport),
        ).toEqual({ top: 0, left: 0 });
    });
});

describe('useWidgetPosition', () => {
    it('[정상] mount 시 containerEl 을 top/left 기반 Default position(top-right)으로 전환한다', () => {
        setViewport(1000, 800);
        const el = makeContainer(320, 400);

        renderHook(() => useWidgetPosition(el));

        expect(el.style.top).toBe('20px');
        expect(el.style.left).toBe('660px'); // 1000 - 320 - 20
        expect(el.style.right).toBe('');
    });

    it('[정상] dragHandlers.onPointerDown 을 담은 객체를 반환한다', () => {
        const el = makeContainer();
        const { result } = renderHook(() => useWidgetPosition(el));

        expect(typeof result.current.dragHandlers.onPointerDown).toBe('function');
    });

    it('[예외] containerEl 이 null/undefined 면 throw 없이 DOM 부수효과를 건너뛴다', () => {
        expect(() => renderHook(() => useWidgetPosition(null))).not.toThrow();

        const { result } = renderHook(() => useWidgetPosition(undefined));
        expect(() => result.current.dragHandlers.onPointerDown({} as never)).not.toThrow();
    });
});

type HookResult = { current: ReturnType<typeof useWidgetPosition> };

function startDrag(el: HTMLElement, result: HookResult, clientX: number, clientY: number): void {
    act(() => {
        result.current.dragHandlers.onPointerDown({
            clientX,
            clientY,
            pointerId: 1,
            target: el,
            currentTarget: el,
        } as unknown as ReactPointerEvent);
    });
}

function drag(
    el: HTMLElement,
    result: HookResult,
    from: [number, number],
    to: [number, number],
): void {
    startDrag(el, result, from[0], from[1]);
    fireEvent.pointerMove(window, { clientX: to[0], clientY: to[1] });
    fireEvent.pointerUp(window, { clientX: to[0], clientY: to[1] });
}

describe('useWidgetPosition — storage 연동 (#21)', () => {
    it('[경계] 저장값 읽기 완료 전 #codit-root 의 visibility 가 hidden 이다', () => {
        setViewport(1000, 800);
        const el = makeContainer(320, 400);

        renderHook(() => useWidgetPosition(el));

        expect(el.style.visibility).toBe('hidden');
    });

    it('[정상] 저장된 위치가 있으면 그 위치(clamp 후)로 배치하고 visibility 를 해제한다', async () => {
        setViewport(1000, 800);
        await storage.setItem(WIDGET_POSITION_KEY, { top: 100, left: 300 });
        const el = makeContainer(320, 400);

        const view = renderHook(() => useWidgetPosition(el));
        await act(async () => {});

        expect(el.style.left).toBe('300px');
        expect(el.style.top).toBe('100px');
        expect(el.style.visibility).toBe('');
        view.unmount();
    });

    it('[정상] 저장값이 없으면 Default position + visibility 해제', async () => {
        setViewport(1000, 800);
        const el = makeContainer(320, 400);

        renderHook(() => useWidgetPosition(el));
        await act(async () => {});

        expect(el.style.left).toBe('660px'); // 1000 - 320 - 20
        expect(el.style.visibility).toBe('');
    });

    it('[예외] 저장값이 손상(NaN)이면 Default position 폴백 + 표시', async () => {
        setViewport(1000, 800);
        await storage.setItem(WIDGET_POSITION_KEY, { top: NaN, left: 5 });
        const el = makeContainer(320, 400);

        renderHook(() => useWidgetPosition(el));
        await act(async () => {});

        expect(el.style.left).toBe('660px');
        expect(el.style.visibility).toBe('');
    });

    it('[정상] 드래그로 옮기고 놓으면 새 위치가 storage 에 저장된다', async () => {
        setViewport(1000, 800);
        const el = makeContainer(320, 400);
        const { result } = renderHook(() => useWidgetPosition(el));
        await act(async () => {});
        // Default left = 660, top 20

        drag(el, { current: result.current }, [500, 300], [300, 400]); // dx -200, dy +100
        await act(async () => {});

        expect(await storage.getItem(WIDGET_POSITION_KEY)).toEqual({ top: 120, left: 460 });
    });

    it('[예외] storage.set 이 throw 해도 위젯은 놓은 위치에 유지되고 console.warn 만 찍힌다', async () => {
        setViewport(1000, 800);
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(storage, 'setItem').mockRejectedValue(new Error('quota'));
        const el = makeContainer(320, 400);
        const { result } = renderHook(() => useWidgetPosition(el));
        await act(async () => {});

        drag(el, { current: result.current }, [500, 300], [300, 400]);
        await act(async () => {});

        expect(el.style.left).toBe('460px'); // 놓은 위치 유지
        expect(warn).toHaveBeenCalled();
    });

    it('[정상] 다른 탭이 위치를 바꾸면(storage.onChanged) 위젯이 그 위치로 이동한다', async () => {
        setViewport(1000, 800);
        const el = makeContainer(320, 400);
        renderHook(() => useWidgetPosition(el));
        await act(async () => {});
        // Default left = 660

        await act(async () => {
            await storage.setItem(WIDGET_POSITION_KEY, { top: 200, left: 400 });
        });

        expect(el.style.left).toBe('400px');
        expect(el.style.top).toBe('200px');
    });

    it('[예외] 드래그 중에는 다른 탭의 위치 변경을 무시한다', async () => {
        setViewport(1000, 800);
        const el = makeContainer(320, 400);
        const { result } = renderHook(() => useWidgetPosition(el));
        await act(async () => {});

        startDrag(el, { current: result.current }, 100, 100);
        fireEvent.pointerMove(window, { clientX: 150, clientY: 150 }); // dragging, left ~610

        await act(async () => {
            await storage.setItem(WIDGET_POSITION_KEY, { top: 700, left: 50 });
        });

        expect(el.style.left).not.toBe('50px');
        fireEvent.pointerUp(window, { clientX: 150, clientY: 150 });
    });

    it('[정상] resize 재clamp 는 storage 에 저장하지 않는다 (저장값 보존)', async () => {
        setViewport(1000, 800);
        const el = makeContainer(320, 400);
        const { result } = renderHook(() => useWidgetPosition(el));
        await act(async () => {});

        const setSpy = vi.spyOn(storage, 'setItem');
        drag(el, { current: result.current }, [500, 300], [300, 400]); // 1회 저장
        await act(async () => {});
        expect(setSpy).toHaveBeenCalledTimes(1);

        setViewport(500, 800);
        fireEvent(window, new Event('resize'));
        await act(async () => {});

        expect(setSpy).toHaveBeenCalledTimes(1); // resize 로 추가 저장 없음
    });
});
