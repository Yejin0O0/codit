function titleTextContent(el: Element): string {
    let text = '';
    for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent ?? '';
        }
    }
    return text.trim();
}

/**
 * SWEA 문제 페이지의 실제 문제 제목을 읽는다.
 *
 * `problemDetail.do`/`solvingProblem.do` 모두 `p.problem_title`을 쓴다(실측
 * 확인). 안에 난이도 배지(`<span class="badge badge-a">`)가 중첩되어 있어
 * 직계 텍스트 노드만 골라 배지 값을 제외한다.
 */
export function resolveProblemTitle(doc: Document): string | null {
    const el = doc.querySelector('p.problem_title');
    if (!el) {
        return null;
    }

    const text = titleTextContent(el);
    if (text.length === 0) {
        return null;
    }

    return text;
}
