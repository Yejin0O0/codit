import { render, screen } from '@testing-library/react';

import { AttemptItem } from './attempt-item';
import { ATTEMPT_1, ATTEMPT_3, CATALOG_FX } from './test-fixtures';

describe('AttemptItem', () => {
    it('should render seq label, duration, date, tag chips and memo when present', () => {
        render(<AttemptItem attempt={ATTEMPT_3} tagCatalog={CATALOG_FX} />);

        expect(screen.queryByText(/3회차/)).not.toBeNull();
        expect(screen.queryByText('11:32')).not.toBeNull(); // 692s
        expect(screen.queryByText(/2026-08-30/)).not.toBeNull();
        expect(screen.queryByText('DP')).not.toBeNull();
        expect(screen.queryByText(/점화식 다시 세워 통과/)).not.toBeNull();
    });

    it('should omit the memo line when memo is undefined', () => {
        render(<AttemptItem attempt={ATTEMPT_1} tagCatalog={CATALOG_FX} />);

        expect(screen.queryByText(/1회차/)).not.toBeNull();
        expect(screen.queryByText(/메모/)).toBeNull();
    });

    it('should omit the right-side date when recordedAt is undefined', () => {
        render(<AttemptItem attempt={ATTEMPT_1} tagCatalog={CATALOG_FX} />);

        expect(screen.queryByText(/1회차/)).not.toBeNull();
        expect(screen.queryByText(/2026-/)).toBeNull();
    });

    it('should omit the tag chip row when the attempts tagIds is empty', () => {
        render(<AttemptItem attempt={{ ...ATTEMPT_1, tagIds: [] }} tagCatalog={CATALOG_FX} />);

        expect(screen.queryByText(/1회차/)).not.toBeNull();
        expect(screen.queryByText('구현')).toBeNull();
    });
});
