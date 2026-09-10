import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';

import { CORE_TAGS } from '../mockData';
import type { ResultType } from '../screens';

import { SaveSuccessScreen } from './SaveSuccessScreen';

type Overrides = Partial<ComponentProps<typeof SaveSuccessScreen>>;

function renderSuccess(overrides: Overrides = {}) {
    return render(
        <SaveSuccessScreen
            result="CORRECT"
            elapsedSeconds={754}
            memo="다익스트라로 풀었다"
            tags={CORE_TAGS.slice(0, 2)}
            {...overrides}
        />,
    );
}

/**
 * 라벨 텍스트를 담은 노드가 곧 Badge 루트(`data-slot="badge"`)인지 함께 단언한다.
 * ResultBadge 자리를 다시 평문 텍스트로 되돌리면(안 B-1 회귀) getByText가 `<dd>` 등
 * 배지 아닌 노드를 반환해 이 단언이 먼저 깨진다.
 */
function expectResultBadge(label: string) {
    const badge = screen.getByText(label);
    expect(badge).toHaveAttribute('data-slot', 'badge');
    return badge;
}

describe('SaveSuccessScreen — R5 재설계', () => {
    it.each([
        ['CORRECT', '정답', /bg-success/],
        ['WRONG', '오답', /bg-destructive/],
        ['HOLD', '보류', /bg-warning/],
    ] as const)('result=%s일 때 %s를 의미색 배지로 렌더한다', (result: ResultType, label, tone) => {
        renderSuccess({ result });

        expect(expectResultBadge(label).className).toMatch(tone);
    });

    it('"결과" 요약 라벨을 유지한다', () => {
        renderSuccess();

        expect(screen.getByText('결과')).toBeInTheDocument();
    });

    it('풀이 시간을 formatDuration 형식으로 렌더한다', () => {
        renderSuccess({ elapsedSeconds: 754 });

        expect(screen.getByText('12:34')).toBeInTheDocument();
    });

    it('선택한 태그 이름을 쉼표로 이어 렌더한다', () => {
        renderSuccess({ tags: CORE_TAGS.slice(0, 2) });

        expect(screen.getByText('구현, 시뮬레이션')).toBeInTheDocument();
    });

    it('입력한 메모를 렌더한다', () => {
        renderSuccess({ memo: '다익스트라로 풀었다' });

        expect(screen.getByText('다익스트라로 풀었다')).toBeInTheDocument();
    });

    it('"저장되었어요" 확인 헤더를 렌더한다', () => {
        renderSuccess();

        expect(screen.getByText('저장되었어요')).toBeInTheDocument();
    });

    it('tags가 빈 배열이면 태그 값으로 "없음"을 렌더한다', () => {
        renderSuccess({ tags: [] });

        expect(screen.getByText('없음')).toBeInTheDocument();
    });

    it('memo가 공백뿐이면 메모 값으로 "없음"을 렌더한다', () => {
        renderSuccess({ memo: '   ', tags: CORE_TAGS.slice(0, 2) });

        expect(screen.getByText('없음')).toBeInTheDocument();
    });
});
