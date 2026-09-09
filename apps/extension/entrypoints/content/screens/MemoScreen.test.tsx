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

describe('MemoScreen — R3 재설계', () => {
    it('result=CORRECT일 때 success 톤 배지로 "정답"을 렌더한다', () => {
        renderMemo('CORRECT');

        const badge = screen.getByText('정답');
        expect(badge.className).toMatch(/bg-success/);
    });

    it('result=WRONG일 때 destructive 톤 배지로 "오답"을 렌더한다', () => {
        renderMemo('WRONG');

        const badge = screen.getByText('오답');
        expect(badge.className).toMatch(/bg-destructive/);
    });

    it('result=HOLD일 때 warning 톤 배지로 "보류"를 렌더한다', () => {
        renderMemo('HOLD');

        const badge = screen.getByText('보류');
        expect(badge.className).toMatch(/bg-warning/);
    });

    it('더 이상 중립 배지(bg-secondary)를 렌더하지 않는다', () => {
        renderMemo('CORRECT');

        const badge = screen.getByText('정답');
        expect(badge.className).not.toMatch(/bg-secondary/);
    });
});
