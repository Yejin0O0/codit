import { act, render, screen } from '@testing-library/react';

import { ProblemDetailView } from './problem-detail-view';
import { CATALOG_FX, DETAIL_1859 } from './test-fixtures';

describe('ProblemDetailView', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('should render ProblemSummary + AttemptTimeline once the detail resolves', () => {
        const { container } = render(
            <ProblemDetailView
                problemId="1859"
                tagCatalog={CATALOG_FX}
                resolveDetail={() => DETAIL_1859}
                loadDelayMs={10}
                onBack={vi.fn()}
            />,
        );

        expect(container.firstChild).not.toBeNull(); // 최소한 무언가 렌더 (RED: stub null)

        act(() => {
            vi.advanceTimersByTime(50);
        });

        expect(screen.queryByText(/1859/)).not.toBeNull();
        expect(screen.queryByText(/3회차/)).not.toBeNull();
    });

    it('should render the detail skeleton while loading', () => {
        const { container } = render(
            <ProblemDetailView
                problemId="1859"
                tagCatalog={CATALOG_FX}
                resolveDetail={() => DETAIL_1859}
                loadDelayMs={1000}
                onBack={vi.fn()}
            />,
        );

        expect(container.querySelector('[data-slot="skeleton"]')).not.toBeNull();
    });

    it('should render the not-found state when the detail resolves to null', () => {
        render(
            <ProblemDetailView
                problemId="ghost"
                tagCatalog={CATALOG_FX}
                resolveDetail={() => null}
                loadDelayMs={10}
                onBack={vi.fn()}
            />,
        );

        act(() => {
            vi.advanceTimersByTime(50);
        });

        expect(screen.queryByText(/찾을 수 없어요/)).not.toBeNull();
    });
});
