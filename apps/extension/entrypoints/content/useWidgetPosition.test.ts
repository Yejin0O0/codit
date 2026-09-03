import { act, renderHook } from '@testing-library/react';

import { clampPosition, useWidgetPosition } from './useWidgetPosition';

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

describe('useWidgetPosition — reclamp (#20)', () => {
    it('[정상] 위젯 크기가 커진 뒤 reclamp() 를 호출하면 현재 위치를 새 크기 기준으로 재clamp 한다', () => {
        setViewport(1000, 800);
        const el = makeContainer(140, 40); // pill 크기
        const { result } = renderHook(() => useWidgetPosition(el));
        // mount 시 Default left = 1000 - 140 - 20 = 840

        vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect(320, 400)); // 패널 크기로 확장
        act(() => result.current.reclamp());

        expect(el.style.left).toBe('680px'); // 1000 - 320 (840 > 680 → clamp)
    });

    it('[경계] 위젯이 여전히 뷰포트 안이면 reclamp() 후 위치가 그대로다', () => {
        setViewport(1000, 800);
        const el = makeContainer(140, 40);
        const { result } = renderHook(() => useWidgetPosition(el));
        // Default left = 840

        vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect(150, 50));
        act(() => result.current.reclamp());

        expect(el.style.left).toBe('840px'); // 840 <= 1000 - 150 = 850 → 유지
    });
});
