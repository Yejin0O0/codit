import { act, fireEvent, render, screen } from '@testing-library/react';
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

function domRect(width: number, height: number): DOMRect {
    return {
        x: 0,
        y: 0,
        width,
        height,
        top: 0,
        left: 0,
        right: width,
        bottom: height,
        toJSON: () => ({}),
    } as DOMRect;
}

function setViewport(width: number, height: number): void {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
}

/** containerEl(#codit-root 대역)을 주입해 App 을 렌더한다. */
function mountAppWithContainer(size?: { width?: number; height?: number }) {
    const containerEl = document.createElement('div');
    containerEl.style.position = 'fixed';
    containerEl.style.top = '20px';
    containerEl.style.right = '20px';
    document.body.appendChild(containerEl);
    vi.spyOn(containerEl, 'getBoundingClientRect').mockReturnValue(
        domRect(size?.width ?? 320, size?.height ?? 400),
    );
    const view = render(<App problemId={PROBLEM_ID} containerEl={containerEl} />);
    return { containerEl, ...view };
}

/** expanded 타이머 화면의 PanelShell 헤더 div. */
const timerHeader = () => screen.getByText('풀이 타이머').closest('div') as HTMLElement;

describe('App widget drag (#19)', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        setViewport(1024, 768);
    });

    it('[정상] 헤더를 드래그하면 #codit-root 의 left/top 이 이동량만큼 바뀐다 (시나리오 A)', () => {
        setViewport(2000, 1000);
        const { containerEl } = mountAppWithContainer();
        // Default position: left = 2000 - 320 - 20 = 1660, top = 20

        fireEvent.pointerDown(timerHeader(), { clientX: 500, clientY: 300 });
        fireEvent.pointerMove(window, { clientX: 300, clientY: 450 });
        fireEvent.pointerUp(window, { clientX: 300, clientY: 450 });

        expect(containerEl.style.left).toBe('1460px'); // 1660 - 200
        expect(containerEl.style.top).toBe('170px'); // 20 + 150
    });

    it('[경계] 헤더를 화면 밖까지 오른쪽으로 끌면 오른쪽 끝에서 멈춘다 (시나리오 B)', () => {
        setViewport(1000, 800);
        const { containerEl } = mountAppWithContainer();
        // Default left = 1000 - 320 - 20 = 660

        fireEvent.pointerDown(timerHeader(), { clientX: 100, clientY: 100 });
        fireEvent.pointerMove(window, { clientX: 900, clientY: 100 });
        fireEvent.pointerUp(window, { clientX: 900, clientY: 100 });

        expect(containerEl.style.left).toBe('680px'); // 1000 - 320
    });

    it('[정상] 어떤 드래그 후에도 위젯 전체가 뷰포트 안에 남는다', () => {
        setViewport(800, 600);
        const { containerEl } = mountAppWithContainer({ width: 320, height: 400 });

        fireEvent.pointerDown(timerHeader(), { clientX: 100, clientY: 100 });
        fireEvent.pointerMove(window, { clientX: 5000, clientY: 5000 });
        fireEvent.pointerUp(window, { clientX: 5000, clientY: 5000 });

        expect(containerEl.style.left).toBe('480px'); // 800 - 320
        expect(containerEl.style.top).toBe('200px'); // 600 - 400
    });

    it('[경계] 헤더에서 5px 미만 이동 후 놓으면 위치를 변경하지 않는다', () => {
        setViewport(1000, 800);
        const { containerEl } = mountAppWithContainer();

        fireEvent.pointerDown(timerHeader(), { clientX: 100, clientY: 100 });
        fireEvent.pointerMove(window, { clientX: 103, clientY: 102 });
        fireEvent.pointerUp(window, { clientX: 103, clientY: 102 });

        expect(containerEl.style.left).toBe('660px');
        expect(containerEl.style.top).toBe('20px');
    });

    it('[정상] 드래그 중 document 에 user-select:none, #codit-root 에 data-dragging 을 적용하고 pointerup 시 되돌린다', () => {
        const { containerEl } = mountAppWithContainer();

        fireEvent.pointerDown(timerHeader(), { clientX: 100, clientY: 100 });
        fireEvent.pointerMove(window, { clientX: 140, clientY: 140 });

        expect(containerEl.getAttribute('data-dragging')).toBe('true');
        expect(document.body.style.userSelect).toBe('none');

        fireEvent.pointerUp(window, { clientX: 140, clientY: 140 });

        expect(containerEl.hasAttribute('data-dragging')).toBe(false);
        expect(document.body.style.userSelect).toBe('');
    });

    it('[정상] 드래그 중 body 커서가 grabbing 이 되고 pointerup 시 되돌아온다', () => {
        mountAppWithContainer();

        fireEvent.pointerDown(timerHeader(), { clientX: 100, clientY: 100 });
        fireEvent.pointerMove(window, { clientX: 140, clientY: 140 });

        expect(document.body.style.cursor).toBe('grabbing');

        fireEvent.pointerUp(window, { clientX: 140, clientY: 140 });

        expect(document.body.style.cursor).toBe('');
    });

    it('[예외] 드래그 중 pointercancel 이 오면 현재 위치에서 종료하고 정리한다', () => {
        setViewport(1000, 800);
        const { containerEl } = mountAppWithContainer();

        fireEvent.pointerDown(timerHeader(), { clientX: 100, clientY: 100 });
        fireEvent.pointerMove(window, { clientX: 60, clientY: 300 });
        fireEvent.pointerCancel(window, { clientX: 60, clientY: 300 });

        expect(containerEl.hasAttribute('data-dragging')).toBe(false);
        expect(document.body.style.userSelect).toBe('');
        expect(containerEl.style.left).toBe('620px'); // 660 - 40
        expect(containerEl.style.top).toBe('220px'); // 20 + 200
    });

    it('[정상] resize 시 위젯이 새 뷰포트 밖이면 경계 안으로 재배치된다 (시나리오 D)', () => {
        setViewport(1000, 800);
        const { containerEl } = mountAppWithContainer();
        // left 660

        setViewport(500, 800);
        window.dispatchEvent(new Event('resize'));

        expect(containerEl.style.left).toBe('180px'); // 500 - 320
    });

    it('[경계] resize 시 위젯이 여전히 뷰포트 안이면 위치가 그대로다', () => {
        setViewport(1000, 800);
        const { containerEl } = mountAppWithContainer();
        // left 660

        setViewport(990, 790);
        window.dispatchEvent(new Event('resize'));

        expect(containerEl.style.left).toBe('660px'); // 660 <= 990 - 320
    });

    it('[예외] 헤더의 접기 버튼을 클릭하면 접힌다 (드래그로 오인하지 않는다) (시나리오 C)', async () => {
        const user = userEvent.setup();
        mountAppWithContainer();

        await user.click(screen.getByRole('button', { name: COLLAPSE }));

        expect(expandBtn()).not.toBeNull();
        expect(screen.queryByRole('button', { name: '완료' })).toBeNull();
    });

    it('[정상] 새로 mount 하면 Default position(top-right)으로 돌아온다 (영속 없음)', () => {
        setViewport(1000, 800);
        const first = mountAppWithContainer();
        fireEvent.pointerDown(timerHeader(), { clientX: 400, clientY: 300 });
        fireEvent.pointerMove(window, { clientX: 200, clientY: 400 });
        fireEvent.pointerUp(window, { clientX: 200, clientY: 400 });
        first.unmount();

        const second = mountAppWithContainer();

        expect(second.containerEl.style.left).toBe('660px'); // 1000 - 320 - 20
        expect(second.containerEl.style.top).toBe('20px');
    });
});
