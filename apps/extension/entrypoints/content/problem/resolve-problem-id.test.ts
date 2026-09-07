import { resolveProblemId } from './resolve-problem-id';

function makeDoc(bodyHtml: string): Document {
    const doc = document.implementation.createHTMLDocument('test');
    doc.body.innerHTML = bodyHtml;
    return doc;
}

const SOLVING_PROBLEM_URL = 'https://swexpertacademy.com/main/solvingProblem/solvingProblem.do';

describe('resolveProblemId', () => {
    it('[정상] URL에 contestProbId가 있으면 DOM은 보지 않고 그 값을 반환한다', () => {
        const doc = makeDoc('<input type="hidden" id="contestProbId" value="DOM-VALUE">');
        const href =
            'https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=URL-VALUE';

        expect(resolveProblemId(doc, href)).toBe('URL-VALUE');
    });

    it('[정상] URL에 없고 #contestProbId가 있으면 그 값을 반환한다', () => {
        const doc = makeDoc('<input type="hidden" id="contestProbId" value="DOM-VALUE">');

        expect(resolveProblemId(doc, SOLVING_PROBLEM_URL)).toBe('DOM-VALUE');
    });

    it('[정상] URL·#contestProbId 둘 다 없고 input[name="contestProbId"]가 있으면 그 값을 반환한다', () => {
        const doc = makeDoc('<input type="hidden" name="contestProbId" value="NAME-VALUE">');

        expect(resolveProblemId(doc, SOLVING_PROBLEM_URL)).toBe('NAME-VALUE');
    });

    it('[경계] #contestProbId 값이 빈 문자열이면 input[name="contestProbId"]로 넘어간다', () => {
        const doc = makeDoc(
            '<input type="hidden" id="contestProbId" value="">' +
                '<input type="hidden" name="contestProbId" value="NAME-VALUE">',
        );

        expect(resolveProblemId(doc, SOLVING_PROBLEM_URL)).toBe('NAME-VALUE');
    });

    it('[예외] URL·DOM 전부 없으면 null을 반환한다', () => {
        const doc = makeDoc('');

        expect(resolveProblemId(doc, 'https://swexpertacademy.com/main/main.do')).toBeNull();
    });

    it('[예외] #contestProbId가 input이 아니면 무시하고 input[name="contestProbId"]로 넘어간다', () => {
        const doc = makeDoc(
            '<div id="contestProbId">아이디 아님</div>' +
                '<input type="hidden" name="contestProbId" value="NAME-VALUE">',
        );

        expect(resolveProblemId(doc, SOLVING_PROBLEM_URL)).toBe('NAME-VALUE');
    });
});
