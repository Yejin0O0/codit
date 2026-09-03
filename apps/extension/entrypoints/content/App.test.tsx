import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from './App';

const PROBLEM_ID = 'AZ8R8haaeYnHBITH';

function renderApp() {
    return render(<App problemId={PROBLEM_ID} />);
}

/** Timer 화면에서 결과 선택 화면까지 진행한다. */
async function goToResult(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: '완료' }));
}

/** 결과를 고르고 "다음" 을 눌러 다음 화면으로 진행한다. */
async function pickResultAndNext(user: ReturnType<typeof userEvent.setup>, label: string) {
    await goToResult(user);
    await user.click(screen.getByText(label));
    await user.click(screen.getByRole('button', { name: '다음' }));
}

describe('App timer flow', () => {
    it('주입받은 problemId를 타이머 화면에 표시한다', () => {
        renderApp();

        expect(screen.getByText(`문제 #${PROBLEM_ID}`)).toBeInTheDocument();
    });

    it('"완료"를 클릭하면 타이머 화면에서 결과 선택 화면으로 이동한다', async () => {
        const user = userEvent.setup();
        renderApp();

        await goToResult(user);

        expect(screen.getByText('결과 선택')).toBeInTheDocument();
    });

    it('오답을 선택하면 태그 선택 전에 메모 화면을 거친다', async () => {
        const user = userEvent.setup();
        renderApp();

        await pickResultAndNext(user, '오답');
        // 메모 화면 (step 2 / 3), 아직 태그 화면 아님
        expect(screen.getByText('2 / 3')).toBeInTheDocument();
        expect(screen.queryByText('태그 선택')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: '다음' }));
        expect(screen.getByText('태그 선택')).toBeInTheDocument();
    });

    it('보류를 선택하면 메모 화면을 건너뛰고 태그 화면으로 이동한다', async () => {
        const user = userEvent.setup();
        renderApp();

        await pickResultAndNext(user, '보류');

        // 메모 화면(step 2 / 3)을 건너뛰고 바로 태그 화면(step 2 / 2)
        expect(screen.getByText('태그 선택')).toBeInTheDocument();
        expect(screen.getByText('2 / 2')).toBeInTheDocument();
        expect(screen.queryByText('2 / 3')).not.toBeInTheDocument();
    });

    it('태그를 하나 이상 선택하기 전에는 "저장" 버튼을 비활성화한다', async () => {
        const user = userEvent.setup();
        renderApp();

        await pickResultAndNext(user, '보류');

        const saveButton = screen.getByRole('button', { name: '저장' });
        expect(saveButton).toBeDisabled();

        await user.click(screen.getByRole('button', { name: 'DFS' }));
        expect(saveButton).toBeEnabled();
    });
});

describe('App custom tag input', () => {
    it('기존 predefined tag와 같은 이름을 직접 입력하면 기존 tag를 선택한다', async () => {
        const user = userEvent.setup();
        renderApp();

        await pickResultAndNext(user, '보류');

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
