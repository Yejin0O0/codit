import { render, screen } from '@testing-library/react';

import { AttemptItem } from './attempt-item';
import { ATTEMPT_1, ATTEMPT_3, CATALOG_FX } from './test-fixtures';

describe('AttemptItem', () => {
    it('seq 라벨, 소요시간, 날짜, tag chip, memo가 있으면 모두 표시한다', () => {
        render(<AttemptItem attempt={ATTEMPT_3} tagCatalog={CATALOG_FX} />);

        expect(screen.queryByText(/3회차/)).not.toBeNull();
        expect(screen.queryByText('11:32')).not.toBeNull(); // 692s
        expect(screen.queryByText(/2026-08-30/)).not.toBeNull();
        expect(screen.queryByText('DP')).not.toBeNull();
        expect(screen.queryByText(/점화식 다시 세워 통과/)).not.toBeNull();
    });

    it('memo가 undefined이면 memo 줄을 생략한다', () => {
        render(<AttemptItem attempt={ATTEMPT_1} tagCatalog={CATALOG_FX} />);

        expect(screen.queryByText(/1회차/)).not.toBeNull();
        expect(screen.queryByText(/메모/)).toBeNull();
    });

    it('recordedAt이 undefined이면 오른쪽 날짜를 생략한다', () => {
        render(<AttemptItem attempt={ATTEMPT_1} tagCatalog={CATALOG_FX} />);

        expect(screen.queryByText(/1회차/)).not.toBeNull();
        expect(screen.queryByText(/2026-/)).toBeNull();
    });

    it('attempt의 tagIds가 비어 있으면 tag chip 행을 생략한다', () => {
        render(<AttemptItem attempt={{ ...ATTEMPT_1, tagIds: [] }} tagCatalog={CATALOG_FX} />);

        expect(screen.queryByText(/1회차/)).not.toBeNull();
        expect(screen.queryByText('구현')).toBeNull();
    });
});
