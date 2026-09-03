import { render, screen } from '@testing-library/react';

import { ProblemSummary } from './problem-summary';
import { CATALOG_FX } from './test-fixtures';

describe('ProblemSummary', () => {
    it('problemId, 총 풀이 횟수, union tag chip을 표시한다', () => {
        render(
            <ProblemSummary
                detail={{
                    problemId: '1859',
                    latestResult: 'CORRECT',
                    attemptCount: 3,
                    tagIds: ['impl', 'dp'],
                }}
                tagCatalog={CATALOG_FX}
            />,
        );

        expect(screen.queryByText(/1859/)).not.toBeNull();
        expect(screen.queryByText(/3회/)).not.toBeNull();
        expect(screen.queryByText('DP')).not.toBeNull();
    });
});
