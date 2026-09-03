import { parseContestProbId } from './parse-contest-problem-id';

describe('parseContestProbId', () => {
    it('problemDetail.do URL에서 contestProbId를 추출한다', () => {
        expect(
            parseContestProbId(
                'https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=AZ8R8haaeYnHBITH',
            ),
        ).toBe('AZ8R8haaeYnHBITH');
    });

    it('solvingClub problemView.do URL에서 contestProbId를 추출한다', () => {
        expect(
            parseContestProbId(
                'https://swexpertacademy.com/main/solvingClub/problem/problemView.do?contestProbId=AZ5itNFKh2XHBITl&clubId=1234',
            ),
        ).toBe('AZ5itNFKh2XHBITl');
    });

    it('다른 query parameter가 많아도 contestProbId만 추출한다', () => {
        expect(
            parseContestProbId(
                'https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=AWTtj7GqeAgDFAVT&categoryId=1&pageIndex=3&problemTitle=abc',
            ),
        ).toBe('AWTtj7GqeAgDFAVT');
    });

    it('URL에 contestProbId가 없으면 null을 반환한다', () => {
        expect(parseContestProbId('https://swexpertacademy.com/main/main.do')).toBeNull();
        expect(
            parseContestProbId('https://swexpertacademy.com/main/code/problem/problemDetail.do'),
        ).toBeNull();
    });

    it('contestProbId가 있지만 값이 비어 있으면 null을 반환한다', () => {
        expect(
            parseContestProbId(
                'https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=',
            ),
        ).toBeNull();
    });

    it('URL이 아닌 문자열이면 null을 반환한다', () => {
        expect(parseContestProbId('not a url')).toBeNull();
        expect(parseContestProbId('')).toBeNull();
    });

    it('contestProbId의 대소문자를 그대로 보존한다', () => {
        expect(
            parseContestProbId(
                'https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=AZ3XsaWKSB3HBIPV',
            ),
        ).toBe('AZ3XsaWKSB3HBIPV');
    });
});
