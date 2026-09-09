import { render, screen } from '@testing-library/react';

import { CORE_TAGS, TAG_CATEGORIES } from '../mockData';

import { TagSelectScreen } from './TagSelectScreen';

const noop = () => {};

function renderTagSelect(result: 'CORRECT' | 'WRONG' | 'HOLD') {
    return render(
        <TagSelectScreen
            result={result}
            step="3 / 3"
            coreTags={CORE_TAGS}
            categories={TAG_CATEGORIES}
            customTags={[]}
            selectedTagIds={[]}
            onSelectedTagIdsChange={noop}
            onAddCustomTag={noop}
            onBack={noop}
            onSave={noop}
        />,
    );
}

describe('TagSelectScreen — R4 재설계', () => {
    it('result=CORRECT일 때 success 톤 배지로 "정답"을 렌더한다', () => {
        renderTagSelect('CORRECT');

        const badge = screen.getByText('정답');
        expect(badge.className).toMatch(/bg-success/);
    });

    it('result=WRONG일 때 destructive 톤 배지로 "오답"을 렌더한다', () => {
        renderTagSelect('WRONG');

        const badge = screen.getByText('오답');
        expect(badge.className).toMatch(/bg-destructive/);
    });

    it('result=HOLD일 때 warning 톤 배지로 "보류"를 렌더한다', () => {
        renderTagSelect('HOLD');

        const badge = screen.getByText('보류');
        expect(badge.className).toMatch(/bg-warning/);
    });

    it('"추가" 버튼을 렌더한다 (TagPicker 통합)', () => {
        renderTagSelect('CORRECT');

        expect(screen.getByRole('button', { name: '추가' })).toBeInTheDocument();
    });
});
