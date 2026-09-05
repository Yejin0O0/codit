import { storage } from 'wxt/utils/storage';

function problemTitleKey(problemId: string): `session:problem-title:${string}` {
    return `session:problem-title:${problemId}`;
}

/**
 * 문제 제목을 problemId 기준으로 캐싱한다. 같은 문제는 처음 읽은 제목을 계속
 * 쓰고(`problemDetail.do`/`solvingProblem.do` 표시 텍스트가 달라도 안 바뀜),
 * 다른 문제로 바뀌면(다른 키) 자연히 캐시 미스로 새로 읽힌다.
 */
export async function readProblemTitle(problemId: string): Promise<string | null> {
    try {
        const raw = await storage.getItem<string>(problemTitleKey(problemId));
        if (typeof raw !== 'string' || raw.length === 0) {
            return null;
        }
        return raw;
    } catch {
        console.warn('[codit] 문제 제목 읽기에 실패했습니다');
        return null;
    }
}

export async function writeProblemTitle(problemId: string, title: string): Promise<void> {
    try {
        await storage.setItem(problemTitleKey(problemId), title);
    } catch {
        console.warn('[codit] 문제 제목 저장에 실패했습니다');
    }
}
