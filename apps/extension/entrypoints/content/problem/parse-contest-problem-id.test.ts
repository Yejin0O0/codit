import { parseContestProbId } from './parse-contest-problem-id';

describe('parseContestProbId', () => {
    it('should extract contestProbId from a problemDetail.do URL', () => {
        expect(
            parseContestProbId(
                'https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=AZ8R8haaeYnHBITH',
            ),
        ).toBe('AZ8R8haaeYnHBITH');
    });

    it('should extract contestProbId from a solvingClub problemView.do URL', () => {
        expect(
            parseContestProbId(
                'https://swexpertacademy.com/main/solvingClub/problem/problemView.do?contestProbId=AZ5itNFKh2XHBITl&clubId=1234',
            ),
        ).toBe('AZ5itNFKh2XHBITl');
    });

    it('should extract only contestProbId even with many other query parameters', () => {
        expect(
            parseContestProbId(
                'https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=AWTtj7GqeAgDFAVT&categoryId=1&pageIndex=3&problemTitle=abc',
            ),
        ).toBe('AWTtj7GqeAgDFAVT');
    });

    it('should return null when the URL has no contestProbId', () => {
        expect(parseContestProbId('https://swexpertacademy.com/main/main.do')).toBeNull();
        expect(
            parseContestProbId('https://swexpertacademy.com/main/code/problem/problemDetail.do'),
        ).toBeNull();
    });

    it('should return null when contestProbId is present but empty', () => {
        expect(
            parseContestProbId(
                'https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=',
            ),
        ).toBeNull();
    });

    it('should return null for a non-URL string', () => {
        expect(parseContestProbId('not a url')).toBeNull();
        expect(parseContestProbId('')).toBeNull();
    });

    it('should preserve the exact casing of the contestProbId', () => {
        expect(
            parseContestProbId(
                'https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=AZ3XsaWKSB3HBIPV',
            ),
        ).toBe('AZ3XsaWKSB3HBIPV');
    });
});
