/**
 * 초 → 경과 시간 문자열.
 * - 1시간 미만: `mm:ss` (예: `05:30`)
 * - 1시간 이상: `h:mm:ss` (예: `2:05:30`) — 위젯은 320px 고정폭이고 Card 가
 *   `overflow-hidden` 이라, 분을 무제한으로 늘리면(`125:30`) `text-7xl` 타이머가
 *   조용히 잘린다. 시 단위로 롤오버해 자릿수 폭증을 막고 가독성도 높인다.
 */
export function formatDuration(totalSeconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const seconds = safeSeconds % 60;
    const minutes = Math.floor(safeSeconds / 60) % 60;
    const hours = Math.floor(safeSeconds / 3600);

    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');

    if (hours === 0) {
        return `${mm}:${ss}`;
    }
    return `${hours}:${mm}:${ss}`;
}
