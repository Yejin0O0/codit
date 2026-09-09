import { formatDuration } from './format-duration';

describe('formatDuration', () => {
    it('0초 → 00:00', () => {
        expect(formatDuration(0)).toBe('00:00');
    });

    it('1시간 미만은 mm:ss (분은 2자리 패딩)', () => {
        expect(formatDuration(75)).toBe('01:15');
        expect(formatDuration(692)).toBe('11:32');
        expect(formatDuration(3599)).toBe('59:59');
    });

    it('1시간 이상은 h:mm:ss 로 롤오버한다', () => {
        expect(formatDuration(3600)).toBe('1:00:00');
        expect(formatDuration(7505)).toBe('2:05:05');
        expect(formatDuration(35_999)).toBe('9:59:59');
    });

    it('시는 패딩하지 않는다 (10시간 이상도 그대로)', () => {
        expect(formatDuration(36_000)).toBe('10:00:00');
    });

    it('음수·소수는 0 하한 + 내림 처리한다', () => {
        expect(formatDuration(-5)).toBe('00:00');
        expect(formatDuration(90.9)).toBe('01:30');
    });
});
