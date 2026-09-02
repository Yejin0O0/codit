import { render, screen } from '@testing-library/react';

import { ProblemSummary } from './problem-summary';
import { CATALOG_FX } from './test-fixtures';

describe('ProblemSummary', () => {
    it('should render problemId, total attempt count and union tag chips', () => {
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
