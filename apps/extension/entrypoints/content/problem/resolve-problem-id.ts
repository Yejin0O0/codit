import { parseContestProbId } from './parse-contest-problem-id';

function readInputValue(el: Element | null): string | null {
    if (!el) {
        return null;
    }
    const value = (el as HTMLInputElement).value;
    if (typeof value !== 'string') {
        return null;
    }
    if (value.length === 0) {
        return null;
    }
    return value;
}

/**
 * SWEA 문제 페이지의 contestProbId 를 식별한다.
 *
 * URL 쿼리 스트링(`parseContestProbId`) 우선 → 없으면 DOM 의 `#contestProbId` →
 * 없으면 `input[name="contestProbId"]` → 전부 없으면 `null`.
 * `solvingProblem.do` 처럼 URL 에는 없고 hidden input 에만 있는 페이지를 지원한다
 * (timer-persistence prd ADR-1).
 */
export function resolveProblemId(doc: Document, href: string): string | null {
    const fromUrl = parseContestProbId(href);
    if (fromUrl) {
        return fromUrl;
    }

    const byId = readInputValue(doc.querySelector('#contestProbId'));
    if (byId) {
        return byId;
    }

    const byName = readInputValue(doc.querySelector('input[name="contestProbId"]'));
    if (byName) {
        return byName;
    }

    return null;
}
