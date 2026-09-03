import '@testing-library/jest-dom';

// jsdom(26)은 PointerEvent / setPointerCapture 를 구현하지 않는다.
// 위젯 드래그(useWidgetPosition)는 pointer 이벤트 기반이므로 최소 폴리필을 둔다.
if (typeof window.PointerEvent === 'undefined') {
    class PointerEventPolyfill extends MouseEvent {
        readonly pointerId: number;
        readonly pointerType: string;

        constructor(type: string, params: PointerEventInit = {}) {
            super(type, params);
            this.pointerId = params.pointerId ?? 1;
            this.pointerType = params.pointerType ?? 'mouse';
        }
    }

    window.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
}

if (typeof Element.prototype.setPointerCapture === 'undefined') {
    Element.prototype.setPointerCapture = () => {};
    Element.prototype.releasePointerCapture = () => {};
    Element.prototype.hasPointerCapture = () => false;
}
