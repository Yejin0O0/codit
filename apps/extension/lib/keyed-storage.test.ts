import { storage } from 'wxt/utils/storage';

import { createKeyedStore } from './keyed-storage';

interface Sample {
    value: string;
}

describe('createKeyedStore', () => {
    const store = createKeyedStore<Sample>('sample', '샘플');

    it('[정상] write 후 read 하면 저장한 값을 그대로 돌려준다', async () => {
        await store.write('P1', { value: 'a' });

        expect(await store.read('P1')).toEqual({ value: 'a' });
    });

    it('[정상] 서로 다른 problemId 는 독립된 키로 저장·조회된다', async () => {
        await store.write('A', { value: 'a' });
        await store.write('B', { value: 'b' });

        expect(await store.read('A')).toEqual({ value: 'a' });
        expect(await store.read('B')).toEqual({ value: 'b' });
    });

    it('[정상] remove 후 read 하면 null 이다', async () => {
        await store.write('P2', { value: 'x' });
        await store.remove('P2');

        expect(await store.read('P2')).toBeNull();
    });

    it('[정상] 저장된 게 없으면 read 는 null 을 돌려준다', async () => {
        expect(await store.read('NO-SUCH-ID')).toBeNull();
    });

    it('[정상] key 는 session:{namespace}:{problemId} 형식이다', () => {
        expect(store.key('P3')).toBe('session:sample:P3');
    });

    it('[예외] storage.getItem 이 throw 하면 read 는 null 을 돌려주고 warn 을 남긴다', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(storage, 'getItem').mockRejectedValueOnce(new Error('boom'));

        expect(await store.read('P1')).toBeNull();
        expect(warn).toHaveBeenCalled();

        vi.restoreAllMocks();
    });

    it('[예외] storage.setItem 이 throw 해도 write 는 throw 하지 않고 warn 을 남긴다', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(storage, 'setItem').mockRejectedValueOnce(new Error('quota'));

        await expect(store.write('P1', { value: 'a' })).resolves.toBeUndefined();
        expect(warn).toHaveBeenCalled();

        vi.restoreAllMocks();
    });

    it('[예외] storage.removeItem 이 throw 해도 remove 는 throw 하지 않고 warn 을 남긴다', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(storage, 'removeItem').mockRejectedValueOnce(new Error('boom'));

        await expect(store.remove('P1')).resolves.toBeUndefined();
        expect(warn).toHaveBeenCalled();

        vi.restoreAllMocks();
    });
});
