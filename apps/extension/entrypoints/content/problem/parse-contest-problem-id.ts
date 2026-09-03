/**
 * SWEA 문제 URL 에서 `contestProbId` 쿼리 파라미터를 추출한다.
 *
 * 문제 페이지(problemDetail.do / solvingClub 등)는 진입 경로가 달라도 모두
 * `?contestProbId=<id>` 를 가진다. 값(대소문자 포함)은 그대로 보존한다.
 *
 * @returns contestProbId 문자열, 없거나 파싱 불가하면 null
 */
export function parseContestProbId(href: string): string | null {
    let value: string | null;
    try {
        value = new URL(href).searchParams.get('contestProbId');
    } catch {
        return null;
    }

    return value && value.length > 0 ? value : null;
}
