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

    it('[정상] 배지 span 앞뒤로 텍스트 노드가 여러 개 있어도(줄바꿈 포함 실제 마크업 구조) 모두 합쳐 trim한다', () => {
        const doc = makeDoc(
            '<p class="problem_title" style="margin:0 240px 30px 110px; line-height:23px;">\n' +
                '  " 26837. DNA 수열 "\n' +
                '  <span class="badge badge-a">D3</span>\n' +
                '</p>',
        );

        expect(resolveProblemTitle(doc)).toBe('" 26837. DNA 수열 "');
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
