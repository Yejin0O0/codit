import { storage } from 'wxt/utils/storage';

import {
    isValidPosition,
    readWidgetPosition,
    watchWidgetPosition,
    WIDGET_POSITION_KEY,
    writeWidgetPosition,
} from './widget-position-storage';

describe('isValidPosition', () => {
    it('[정상] {top, left} 이 유한 숫자면 true', () => {
        expect(isValidPosition({ top: 100, left: 200 })).toBe(true);
    });

    it('[경계] {top: 0, left: 0} 은 true', () => {
        expect(isValidPosition({ top: 0, left: 0 })).toBe(true);
    });

    it('[예외] NaN / 필드 누락 / 비객체 / null 이면 false', () => {
        expect(isValidPosition({ top: NaN, left: 0 })).toBe(false);
        expect(isValidPosition({ top: 10 })).toBe(false);
        expect(isValidPosition('x')).toBe(false);
        expect(isValidPosition(null)).toBe(false);
    });
});

describe('readWidgetPosition', () => {
    it('[정상] 저장된 유효 위치를 반환한다', async () => {
        await storage.setItem(WIDGET_POSITION_KEY, { top: 120, left: 340 });

        expect(await readWidgetPosition()).toEqual({ top: 120, left: 340 });
    });

    it('[정상] 저장값이 없으면 null 을 반환한다', async () => {
        expect(await readWidgetPosition()).toBeNull();
    });

    it('[예외] 저장값이 손상(NaN)이면 null 을 반환한다', async () => {
        await storage.setItem(WIDGET_POSITION_KEY, { top: NaN, left: 5 });

        expect(await readWidgetPosition()).toBeNull();
    });

    it('[예외] storage 읽기가 throw 하면 null 을 반환한다', async () => {
        vi.spyOn(storage, 'getItem').mockRejectedValueOnce(new Error('read fail'));

        expect(await readWidgetPosition()).toBeNull();
    });
});

describe('writeWidgetPosition', () => {
    it('[정상] 위치를 storage 에 저장한다', async () => {
        await writeWidgetPosition({ top: 50, left: 60 });

        expect(await storage.getItem(WIDGET_POSITION_KEY)).toEqual({ top: 50, left: 60 });
    });

    it('[예외] storage 저장이 throw 하면 console.warn 을 찍고 throw 하지 않는다', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(storage, 'setItem').mockRejectedValueOnce(new Error('quota'));

        await expect(writeWidgetPosition({ top: 1, left: 2 })).resolves.toBeUndefined();
        expect(warn).toHaveBeenCalled();
    });
});

describe('watchWidgetPosition', () => {
    it('[정상] 다른 탭이 위치를 바꾸면 콜백에 새 위치를 전달한다', async () => {
        const cb = vi.fn();
        const unwatch = watchWidgetPosition(cb);

        await storage.setItem(WIDGET_POSITION_KEY, { top: 400, left: 500 });
        await Promise.resolve();

        expect(cb).toHaveBeenCalledWith({ top: 400, left: 500 });
        unwatch();
    });

    it('[예외] 변경값이 손상이면 콜백을 호출하지 않는다', async () => {
        const cb = vi.fn();
        const unwatch = watchWidgetPosition(cb);

        await storage.setItem(WIDGET_POSITION_KEY, { top: NaN, left: 1 });
        await Promise.resolve();

        expect(cb).not.toHaveBeenCalled();
        unwatch();
    });
});
