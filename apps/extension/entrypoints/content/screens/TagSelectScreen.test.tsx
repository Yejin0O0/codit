import { render, screen } from '@testing-library/react';

import { CORE_TAGS, TAG_CATEGORIES } from '../mockData';
import type { ResultType } from '../screens';

import { TagSelectScreen } from './TagSelectScreen';

const noop = () => {};

function renderTagSelect(result: ResultType) {
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

/**
 * 라벨 텍스트를 담은 노드가 곧 Badge 루트(`data-slot="badge"`)인지 함께 단언한다.
 * ResultBadge 내부가 텍스트를 자식 노드로 감싸도록 바뀌면 getByText가 안쪽 노드를
 * 반환해 클래스 매칭이 false negative로 통과하는 걸 막는다.
 */
function expectBadge(label: string) {
    const badge = screen.getByText(label);
    expect(badge).toHaveAttribute('data-slot', 'badge');
    return badge;
}

describe('TagSelectScreen — R4 재설계', () => {
    it('result=CORRECT일 때 success 톤 배지로 "정답"을 렌더한다', () => {
        renderTagSelect('CORRECT');

        expect(expectBadge('정답').className).toMatch(/bg-success/);
    });

    it('result=WRONG일 때 destructive 톤 배지로 "오답"을 렌더한다', () => {
        renderTagSelect('WRONG');

        expect(expectBadge('오답').className).toMatch(/bg-destructive/);
    });

    it('result=HOLD일 때 warning 톤 배지로 "보류"를 렌더한다', () => {
        renderTagSelect('HOLD');

        expect(expectBadge('보류').className).toMatch(/bg-warning/);
    });

    it('"추가" 버튼을 primary 톤으로 렌더한다 (TagPicker 통합)', () => {
        renderTagSelect('CORRECT');

        // variant="default" → bg-primary. secondary로 되돌아가면 이 단언이 잡는다.
        expect(screen.getByRole('button', { name: '추가' })).toHaveClass('bg-primary');
    });
});
