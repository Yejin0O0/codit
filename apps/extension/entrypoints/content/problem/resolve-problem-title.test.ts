import { resolveProblemTitle } from './resolve-problem-title';

function makeDoc(bodyHtml: string): Document {
    const doc = document.implementation.createHTMLDocument('test');
    doc.body.innerHTML = bodyHtml;
    return doc;
}

describe('resolveProblemTitle', () => {
    it('[정상] p.problem_title의 텍스트만 반환한다(중첩된 배지 span 값은 제외)', () => {
        const doc = makeDoc(
            '<p class="problem_title">26837. DNA 수열 <span class="badge badge-a">D3</span></p>',
        );

        expect(resolveProblemTitle(doc)).toBe('26837. DNA 수열');
    });

    it('[정상] 앞뒤 공백을 trim해서 반환한다', () => {
        const doc = makeDoc(
            '<p class="problem_title">  [S/W 문제해결 기본] 9일차 - 사칙연산  <span class="badge badge-a">D4</span></p>',
        );

        expect(resolveProblemTitle(doc)).toBe('[S/W 문제해결 기본] 9일차 - 사칙연산');
    });

    it('[예외] p.problem_title이 없으면 null', () => {
        const doc = makeDoc('<div>다른 내용</div>');

        expect(resolveProblemTitle(doc)).toBeNull();
    });

    it('[예외] 텍스트가 공백뿐이면 null', () => {
        const doc = makeDoc(
            '<p class="problem_title">   <span class="badge badge-a">D3</span></p>',
        );

        expect(resolveProblemTitle(doc)).toBeNull();
    });
});
