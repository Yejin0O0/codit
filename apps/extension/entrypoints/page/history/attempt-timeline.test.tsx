import { render, screen } from '@testing-library/react';

import { AttemptTimeline } from './attempt-timeline';
import { ATTEMPT_1, ATTEMPT_2, ATTEMPT_3, CATALOG_FX } from './test-fixtures';

describe('AttemptTimeline', () => {
    it('AttemptItem을 seq 내림차순으로 표시한다', () => {
        render(
            <AttemptTimeline
                attempts={[ATTEMPT_1, ATTEMPT_2, ATTEMPT_3]}
                tagCatalog={CATALOG_FX}
            />,
        );

        const labels = screen.queryAllByText(/회차/).map((n) => n.textContent ?? '');
        expect(labels.length).toBe(3);
        expect(labels[0]).toMatch(/3회차/);
        expect(labels[2]).toMatch(/1회차/);
    });

    it('attempts 길이가 1이면 AttemptItem 하나만 표시한다', () => {
        render(<AttemptTimeline attempts={[ATTEMPT_2]} tagCatalog={CATALOG_FX} />);

        expect(screen.queryAllByText(/회차/).length).toBe(1);
        expect(screen.queryByText(/2회차/)).not.toBeNull();
    });

    it('정렬 시 입력 attempts 배열을 변경하지 않는다', () => {
        const input = [ATTEMPT_1, ATTEMPT_2, ATTEMPT_3];
        const snapshot = [...input];

        render(<AttemptTimeline attempts={input} tagCatalog={CATALOG_FX} />);

        expect(screen.queryByText(/3회차/)).not.toBeNull();
        expect(input).toEqual(snapshot);
        expect(input[0]).toBe(ATTEMPT_1);
    });
});
