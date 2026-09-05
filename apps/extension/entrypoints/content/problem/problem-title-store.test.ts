import { storage } from 'wxt/utils/storage';

import { readProblemTitle, writeProblemTitle } from './problem-title-store';

describe('readProblemTitle / writeProblemTitle', () => {
    it('[정상] writeProblemTitle 으로 저장하면 storage 에 값이 들어간다', async () => {
        await writeProblemTitle('PROB-1', '26837. DNA 수열');

        const raw = await storage.getItem('session:problem-title:PROB-1');
        expect(raw).toBe('26837. DNA 수열');
    });

    it('[정상] readProblemTitle — 저장된 값이 있으면 그대로 반환한다', async () => {
        await storage.setItem('session:problem-title:PROB-1', '26837. DNA 수열');

        expect(await readProblemTitle('PROB-1')).toBe('26837. DNA 수열');
    });

    it('[경계] 저장값이 없으면 null, console.warn 은 호출되지 않는다', async () => {
        await writeProblemTitle('OTHER', '다른 문제');
        expect(await readProblemTitle('OTHER')).toBe('다른 문제');

        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(await readProblemTitle('NO-TITLE-ID')).toBeNull();
        expect(warn).not.toHaveBeenCalled();
    });

    it('[예외] readProblemTitle — storage 접근이 throw 하면 console.warn 후 null', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(storage, 'getItem').mockRejectedValueOnce(new Error('access denied'));

        expect(await readProblemTitle('PROB-1')).toBeNull();
        expect(warn).toHaveBeenCalled();
    });

    it('[예외] writeProblemTitle — storage 접근이 throw 해도 throw 하지 않고 warn 만 남긴다', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(storage, 'setItem').mockRejectedValueOnce(new Error('quota'));

        await expect(writeProblemTitle('PROB-1', '제목')).resolves.not.toThrow();
        expect(warn).toHaveBeenCalled();
    });
});
