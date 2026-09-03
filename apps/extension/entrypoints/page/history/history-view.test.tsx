import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { HistoryView } from './history-view';
import { DETAIL_1859, PROBLEMS_FX } from './test-fixtures';

describe('HistoryView', () => {
    it('클릭한 problem의 상세 화면으로 전환하고 다시 목록으로 돌아온다', async () => {
        const user = userEvent.setup();
        const { container } = render(
            <HistoryView
                problems={PROBLEMS_FX}
                resolveDetail={() => DETAIL_1859}
                loadDelayMs={0}
            />,
        );

        // 최소한 History 영역이 렌더된다 (RED: stub null → 즉시 실패)
        expect(container.querySelector('[aria-label="내 문제풀이"]')).not.toBeNull();

        await user.click(await screen.findByText(/2178/));
        expect(await screen.findByRole('button', { name: /목록으로/ })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /목록으로/ }));
        expect(await screen.findByText(/2178/)).toBeInTheDocument();
    });

    it('상세에서 목록으로 돌아와도 resultFilter와 selectedTagIds를 유지한다', async () => {
        const user = userEvent.setup();
        const { container } = render(
            <HistoryView
                problems={PROBLEMS_FX}
                resolveDetail={() => DETAIL_1859}
                loadDelayMs={0}
            />,
        );

        expect(container.querySelector('[aria-label="내 문제풀이"]')).not.toBeNull();

        // 결과 필터 '오답'
        await user.click(await screen.findByText('오답'));
        // 상세 진입 후 복귀
        await user.click(await screen.findByText(/2178/));
        await user.click(await screen.findByRole('button', { name: /목록으로/ }));

        // WRONG 필터 유지 → CORRECT 문제(#1859)는 리스트에 없어야 한다
        expect(await screen.findByText(/2178/)).toBeInTheDocument();
        expect(screen.queryByText(/1859/)).toBeNull();
    });

    it('"필터 해제"로 result 탭과 tag 선택을 초기화하고 전체 목록을 복원한다', async () => {
        const user = userEvent.setup();
        const { container } = render(<HistoryView problems={PROBLEMS_FX} loadDelayMs={0} />);

        await screen.findByText('#1859');
        const resultTabs = container.querySelector('[data-slot="toggle-group"]') as HTMLElement;

        // 결과 탭 → 오답 (WRONG): CORRECT 문제(#1859)가 사라진다
        await user.click(within(resultTabs).getByText('오답'));
        expect(screen.queryByText('#1859')).toBeNull();

        // 태그 필터 펼치고 #2178 이 가진 태그(BFS) 선택 → WRONG ∧ bfs → #2178 만 남는다
        await user.click(screen.getByText('태그 필터'));
        await user.click(await screen.findByRole('button', { name: 'BFS' }));
        expect(screen.getByText('#2178')).toBeInTheDocument();
        expect(screen.queryByText('#1012')).toBeNull();

        // 필터 활성 상태 → 필터 해제 버튼 노출 → 클릭
        await user.click(screen.getByRole('button', { name: '필터 해제' }));

        // resultFilter → ALL, selectedTagIds → [], 전체 목록 복귀
        expect(await screen.findByText('#1859')).toBeInTheDocument();
        expect(screen.getByText('#1012')).toBeInTheDocument();
        expect(screen.getByText('#2178')).toBeInTheDocument();
        expect(container.querySelectorAll('[data-slot="card"]')).toHaveLength(3);
        expect(screen.queryByRole('button', { name: '필터 해제' })).toBeNull();
        expect(screen.getByRole('button', { name: 'BFS' })).toHaveAttribute('data-state', 'off');
    });
});
