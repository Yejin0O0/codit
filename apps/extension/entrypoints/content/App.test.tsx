import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from './App';

const COLLAPSE = 'Codit 타이머 접기';
const collapseBtn = () => screen.queryByRole('button', { name: COLLAPSE });
const expandBtn = () => screen.queryByRole('button', { name: /펼치기/ });

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

describe('App collapse', () => {
    it('초기 viewState 는 expanded — 타이머 화면을 렌더하고 펼치기 버튼은 없다', () => {
        renderApp();

        expect(screen.getByRole('button', { name: '완료' })).toBeInTheDocument();
        expect(expandBtn()).toBeNull();
    });

    it('타이머 화면에서 접으면 CollapsedTimer(running)를 표시하고 타이머 화면은 표시하지 않는다', async () => {
        const user = userEvent.setup();
        renderApp();

        expect(collapseBtn()).not.toBeNull();
        await user.click(collapseBtn()!);

        expect(expandBtn()).not.toBeNull();
        expect(screen.queryByRole('button', { name: '완료' })).toBeNull();
    });

    it('collapsed 에서 펼치면 타이머 화면으로 복귀한다', async () => {
        const user = userEvent.setup();
        renderApp();

        expect(collapseBtn()).not.toBeNull();
        await user.click(collapseBtn()!);
        await user.click(expandBtn()!);

        expect(screen.getByRole('button', { name: '완료' })).toBeInTheDocument();
    });

    it('"완료" 후 결과 선택 화면에서 접으면 CollapsedTimer 가 stopped(완료됨)로 표시된다', async () => {
        const user = userEvent.setup();
        renderApp();

        await goToResult(user);
        expect(collapseBtn()).not.toBeNull();
        await user.click(collapseBtn()!);

        expect(screen.queryByRole('button', { name: /완료됨/ })).not.toBeNull();
    });

    it('"완료" 후 collapsed 에서 펼치면 결과 선택 화면으로 복귀한다', async () => {
        const user = userEvent.setup();
        renderApp();

        await goToResult(user);
        expect(collapseBtn()).not.toBeNull();
        await user.click(collapseBtn()!);
        await user.click(expandBtn()!);

        expect(screen.getByText('결과 선택')).toBeInTheDocument();
    });

    it('결과("오답")를 고른 뒤 접었다 펴면 그 결과 선택 상태가 유지된다', async () => {
        const user = userEvent.setup();
        renderApp();

        await goToResult(user);
        await user.click(screen.getByText('오답'));
        expect(collapseBtn()).not.toBeNull();
        await user.click(collapseBtn()!);
        await user.click(expandBtn()!);

        // 결과가 선택돼 있어야 "다음" 이 활성
        expect(screen.getByRole('button', { name: '다음' })).toBeEnabled();
    });

    it('collapsed + running 에서 시간이 흐르면 CollapsedTimer 의 mm:ss 가 증가한다', async () => {
        let now = 0;
        // setInterval 만 fake — setTimeout 은 실타이머라 userEvent 가 hang 하지 않는다.
        vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
        vi.spyOn(Date, 'now').mockImplementation(() => now);
        try {
            const user = userEvent.setup();
            renderApp();
            expect(collapseBtn()).not.toBeNull();
            await user.click(collapseBtn()!);

            const before = expandBtn()!.textContent;
            act(() => {
                now = 3000;
                vi.advanceTimersByTime(500);
            });
            expect(expandBtn()!.textContent).not.toBe(before);
        } finally {
            vi.restoreAllMocks();
            vi.useRealTimers();
        }
    });

    it('"완료" 전에는 접힌 뷰가 running, "완료" 후에는 stopped 이다', async () => {
        const user = userEvent.setup();
        renderApp();

        expect(collapseBtn()).not.toBeNull();
        await user.click(collapseBtn()!);
        expect(screen.queryByRole('button', { name: /완료됨/ })).toBeNull();

        await user.click(expandBtn()!);
        await user.click(screen.getByRole('button', { name: '완료' }));
        await user.click(collapseBtn()!);
        expect(screen.queryByRole('button', { name: /완료됨/ })).not.toBeNull();
    });

    it('memo / tags 화면에서도 접기 컨트롤이 존재한다', async () => {
        const user = userEvent.setup();
        renderApp();

        await pickResultAndNext(user, '오답'); // → memo
        expect(collapseBtn()).not.toBeNull();

        await user.click(screen.getByRole('button', { name: '다음' })); // → tags
        expect(collapseBtn()).not.toBeNull();
    });

    it('접기 → 펼치기 후 screen 이 바뀌지 않는다 (memo 화면에서 접었다 펴면 memo 화면)', async () => {
        const user = userEvent.setup();
        renderApp();

        await pickResultAndNext(user, '오답'); // memo (step 2 / 3)
        expect(collapseBtn()).not.toBeNull();
        await user.click(collapseBtn()!);
        await user.click(expandBtn()!);

        expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    it('접기 → 펼치기가 타이머를 초기화하지 않는다', async () => {
        let now = 0;
        vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
        vi.spyOn(Date, 'now').mockImplementation(() => now);
        try {
            const user = userEvent.setup();
            renderApp();
            act(() => {
                now = 5000;
                vi.advanceTimersByTime(500);
            });
            expect(collapseBtn()).not.toBeNull();
            await user.click(collapseBtn()!);
            await user.click(expandBtn()!);

            expect(screen.queryByText('00:00')).toBeNull();
        } finally {
            vi.restoreAllMocks();
            vi.useRealTimers();
        }
    });

    it('새 <App> mount 는 항상 expanded 이다', async () => {
        const user = userEvent.setup();
        const { unmount } = renderApp();

        expect(collapseBtn()).not.toBeNull();
        await user.click(collapseBtn()!);
        unmount();

        renderApp();
        expect(screen.getByRole('button', { name: '완료' })).toBeInTheDocument();
        expect(expandBtn()).toBeNull();
    });

    it('"완료" 후 collapsed 에서 시간이 더 흘러도 CollapsedTimer 의 mm:ss 가 고정된다', async () => {
        let now = 0;
        vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
        vi.spyOn(Date, 'now').mockImplementation(() => now);
        try {
            const user = userEvent.setup();
            renderApp();

            act(() => {
                now = 4000;
                vi.advanceTimersByTime(500);
            });
            await user.click(screen.getByRole('button', { name: '완료' })); // stop() → 04 고정
            await user.click(collapseBtn()!);

            const frozen = expandBtn()!.textContent;
            expect(frozen).toMatch(/완료됨/);

            act(() => {
                now = 30000;
                vi.advanceTimersByTime(3000);
            });
            expect(expandBtn()!.textContent).toBe(frozen);
        } finally {
            vi.restoreAllMocks();
            vi.useRealTimers();
        }
    });

    it('태그를 선택한 뒤 접었다 펴면 선택 상태가 유지된다', async () => {
        const user = userEvent.setup();
        renderApp();

        await pickResultAndNext(user, '보류'); // → 태그 화면
        await user.click(screen.getByRole('button', { name: 'DFS' }));
        expect(screen.getByText('1개 선택됨')).toBeInTheDocument();

        await user.click(collapseBtn()!);
        await user.click(expandBtn()!);

        expect(screen.getByText('1개 선택됨')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'DFS' })).toHaveAttribute('data-state', 'on');
    });

    it('메모를 입력한 뒤 접었다 펴면 메모 내용이 유지된다', async () => {
        const user = userEvent.setup();
        renderApp();

        await pickResultAndNext(user, '오답'); // → 메모 화면 (WRONG: textarea 자동 노출)
        await user.type(screen.getByRole('textbox'), '이분탐색 경계 실수');
        expect(screen.getByRole('textbox')).toHaveValue('이분탐색 경계 실수');

        await user.click(collapseBtn()!);
        await user.click(expandBtn()!);

        expect(screen.getByRole('textbox')).toHaveValue('이분탐색 경계 실수');
    });

    it('타이머 화면에서 접으면 CollapsedTimer pill 로 포커스가 이동한다', async () => {
        const user = userEvent.setup();
        renderApp();

        await user.click(collapseBtn()!);

        expect(expandBtn()).toHaveFocus();
    });

    it('collapsed 에서 펼치면 그 화면 헤더의 접기 컨트롤로 포커스가 이동한다', async () => {
        const user = userEvent.setup();
        renderApp();

        await user.click(collapseBtn()!);
        await user.click(expandBtn()!);

        expect(collapseBtn()).toHaveFocus();
    });

    it('memo 화면에서 접었다 펴면 memo 화면의 접기 컨트롤로 포커스가 돌아온다', async () => {
        const user = userEvent.setup();
        renderApp();

        await pickResultAndNext(user, '오답'); // → memo
        await user.click(collapseBtn()!);
        await user.click(expandBtn()!);

        expect(screen.getByText('2 / 3')).toBeInTheDocument(); // memo 화면 복귀 확인
        expect(collapseBtn()).toHaveFocus();
    });

    it('초기 mount(expanded) 시에는 접기 컨트롤로 포커스가 자동 이동하지 않는다', () => {
        renderApp();

        expect(collapseBtn()).not.toHaveFocus();
    });

    /** 보류 결과로 태그 화면까지 간 뒤 태그 하나 골라 저장해 success 화면으로 진입한다. */
    async function goToSuccess(user: ReturnType<typeof userEvent.setup>) {
        await pickResultAndNext(user, '보류'); // → 태그 화면
        await user.click(screen.getByRole('button', { name: 'DFS' }));
        await user.click(screen.getByRole('button', { name: '저장' })); // → success 화면
    }

    it('success(저장 완료) 화면에서도 접기 컨트롤이 존재한다', async () => {
        const user = userEvent.setup();
        renderApp();

        await goToSuccess(user);
        expect(screen.getByText('저장되었어요')).toBeInTheDocument();

        expect(collapseBtn()).not.toBeNull();
    });

    it('success 화면에서 접었다 펴면 success 화면으로 복귀한다', async () => {
        const user = userEvent.setup();
        renderApp();

        await goToSuccess(user);
        await user.click(collapseBtn()!);
        await user.click(expandBtn()!);

        expect(screen.getByText('저장되었어요')).toBeInTheDocument();
    });
});
