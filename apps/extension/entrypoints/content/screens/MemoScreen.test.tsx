import { render, screen } from '@testing-library/react';

import { MemoScreen } from './MemoScreen';

const noop = () => {};

function renderMemo(result: 'CORRECT' | 'WRONG' | 'HOLD') {
    return render(
        <MemoScreen
            result={result}
            step="2 / 3"
            memo=""
            onMemoChange={noop}
            memoOpen={false}
            onMemoOpenChange={noop}
            onBack={noop}
            onNext={noop}
        />,
    );
}

/**
 * 라벨 텍스트를 담은 노드가 곧 Badge 루트(`data-slot="badge"`)인지 함께 단언한다.
 * ResultBadge 내부가 텍스트를 자식 노드로 감싸도록 바뀌면 getByText가 안쪽 노드를
 * 반환해 이 단언이 깨지므로, 클래스 매칭이 false negative로 통과하는 걸 막는다.
 */
function expectBadge(label: string) {
    const badge = screen.getByText(label);
    expect(badge).toHaveAttribute('data-slot', 'badge');
    return badge;
}

describe('MemoScreen — R3 재설계', () => {
    it('result=CORRECT일 때 success 톤 배지로 "정답"을 렌더한다', () => {
        renderMemo('CORRECT');

        expect(expectBadge('정답').className).toMatch(/bg-success/);
    });

    it('result=WRONG일 때 destructive 톤 배지로 "오답"을 렌더한다', () => {
        renderMemo('WRONG');

        expect(expectBadge('오답').className).toMatch(/bg-destructive/);
    });

    it('result=HOLD일 때 warning 톤 배지로 "보류"를 렌더한다', () => {
        renderMemo('HOLD');

        expect(expectBadge('보류').className).toMatch(/bg-warning/);
    });

    // 재설계 전에는 세 결과 모두 중립 배지(bg-secondary)였으므로 세 케이스를 모두 가드한다.
    it.each([
        ['CORRECT', '정답'],
        ['WRONG', '오답'],
        ['HOLD', '보류'],
    ] as const)('result=%s일 때 더 이상 중립 배지(bg-secondary)를 렌더하지 않는다', (result, label) => {
        renderMemo(result);

        expect(expectBadge(label).className).not.toMatch(/bg-secondary/);
    });
});
