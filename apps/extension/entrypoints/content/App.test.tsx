import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from './App';

/** Timer → 결과(보류, 메모 건너뜀) → 태그 화면까지 진행한다. */
async function goToTagScreen(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: '완료' }));
    await user.click(screen.getByText('보류'));
    await user.click(screen.getByRole('button', { name: '다음' }));
}

describe('App custom tag input', () => {
    it('should select the existing predefined tag when the same tag name is entered manually', async () => {
        const user = userEvent.setup();
        render(<App />);

        await goToTagScreen(user);

        await user.type(screen.getByPlaceholderText('태그 직접 입력'), 'DFS');
        await user.click(screen.getByRole('button', { name: '추가' }));

        // 기존 predefined "DFS" chip 이 선택 상태가 된다 (중복 chip 없음)
        const dfsChips = screen.getAllByRole('button', { name: 'DFS' });
        expect(dfsChips).toHaveLength(1);
        expect(dfsChips[0]).toHaveAttribute('data-state', 'on');
        expect(screen.getByText('1개 선택됨')).toBeInTheDocument();

        // 저장 후 요약에 DFS 가 그대로 표시된다 (존재하지 않는 custom:dfs 였다면 "없음")
        await user.click(screen.getByRole('button', { name: '저장' }));
        expect(screen.getByText('저장되었어요')).toBeInTheDocument();

        const tagRow = screen.getByText('태그').closest('div')!;
        expect(tagRow).toHaveTextContent('DFS');
        expect(tagRow).not.toHaveTextContent('없음');
    });
});
