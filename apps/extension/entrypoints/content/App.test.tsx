import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from './App';
import * as sessionStore from './timer-session/store';
import { TIMER_SESSION_VERSION, type TimerSession } from './timer-session/types';

const COLLAPSE = 'Codit 타이머 접기';
const collapseBtn = () => screen.queryByRole('button', { name: COLLAPSE });
const expandBtn = () => screen.queryByRole('button', { name: /펼치기/ });

const PROBLEM_ID = 'AZ8R8haaeYnHBITH';

function renderApp() {
    return render(<App problemId={PROBLEM_ID} />);
}

function makeSession(overrides: Partial<TimerSession> = {}): TimerSession {
    return {
        version: TIMER_SESSION_VERSION,
        problemId: PROBLEM_ID,
        startedAt: 1_000,
        status: 'running',
        stoppedAt: null,
        ...overrides,
    };
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

describe('App pill drag (#20)', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        setViewport(1024, 768);
        document.body.innerHTML = '';
    });

    const pill = () => screen.getByRole('button', { name: /펼치기/ });
    const doneBtn = () => screen.queryByRole('button', { name: '완료' });

    async function collapse(user: ReturnType<typeof userEvent.setup>) {
        await user.click(screen.getByRole('button', { name: COLLAPSE }));
    }

    it('[정상] pill 을 5px 이상 드래그하면 위젯이 이동하고 펼쳐지지 않는다 (시나리오 A)', async () => {
        const user = userEvent.setup();
        setViewport(1000, 800);
        const { containerEl } = mountAppWithContainer({ width: 140, height: 40 });
        await collapse(user);
        // collapsed 기본 위치: left = 1000 - 140 - 20 = 840, top 20

        fireEvent.pointerDown(pill(), { clientX: 500, clientY: 400 });
        fireEvent.pointerMove(window, { clientX: 300, clientY: 500 });
        fireEvent.pointerUp(window, { clientX: 300, clientY: 500 });
        fireEvent.click(pill()); // 브라우저가 뒤이어 발생시키는 click

        expect(doneBtn()).toBeNull(); // 여전히 collapsed
        expect(containerEl.style.left).toBe('640px'); // 840 - 200
        expect(containerEl.style.top).toBe('120px'); // 20 + 100
    });

    it('[예외] pill 을 5px 이상 드래그하면 뒤따르는 click 이 억제되어 펼쳐지지 않는다', async () => {
        const user = userEvent.setup();
        mountAppWithContainer({ width: 140, height: 40 });
        await collapse(user);

        fireEvent.pointerDown(pill(), { clientX: 100, clientY: 100 });
        fireEvent.pointerMove(window, { clientX: 200, clientY: 200 });
        fireEvent.pointerUp(window, { clientX: 200, clientY: 200 });
        fireEvent.click(pill());

        expect(doneBtn()).toBeNull();
        expect(screen.queryByRole('button', { name: /펼치기/ })).not.toBeNull();
    });

    it('[정상] pill 을 5px 미만 이동 후 떼면 펼쳐진다 (시나리오 B)', async () => {
        const user = userEvent.setup();
        mountAppWithContainer({ width: 140, height: 40 });
        await collapse(user);

        fireEvent.pointerDown(pill(), { clientX: 100, clientY: 100 });
        fireEvent.pointerMove(window, { clientX: 103, clientY: 102 });
        fireEvent.pointerUp(window, { clientX: 103, clientY: 102 });
        fireEvent.click(pill());

        expect(doneBtn()).not.toBeNull();
    });

    it('[경계] pill 을 4px 이동 후 떼면 펼쳐진다 (임계값 경계)', async () => {
        const user = userEvent.setup();
        mountAppWithContainer({ width: 140, height: 40 });
        await collapse(user);

        fireEvent.pointerDown(pill(), { clientX: 100, clientY: 100 });
        fireEvent.pointerMove(window, { clientX: 104, clientY: 100 });
        fireEvent.pointerUp(window, { clientX: 104, clientY: 100 });
        fireEvent.click(pill());

        expect(doneBtn()).not.toBeNull();
    });

    it('[정상] pill 을 드래그해 옮긴 뒤 클릭해 펼치면 expanded 패널이 옮긴 위치에 나타난다 (시나리오 C)', async () => {
        const user = userEvent.setup();
        setViewport(2000, 1200);
        const { containerEl } = mountAppWithContainer({ width: 140, height: 40 });
        await collapse(user);
        // default left = 2000 - 140 - 20 = 1840

        fireEvent.pointerDown(pill(), { clientX: 900, clientY: 400 });
        fireEvent.pointerMove(window, { clientX: 300, clientY: 700 });
        fireEvent.pointerUp(window, { clientX: 300, clientY: 700 });
        fireEvent.click(pill()); // 억제됨 → 아직 collapsed
        fireEvent.click(pill()); // 새 클릭 → 펼침

        expect(doneBtn()).not.toBeNull();
        expect(containerEl.style.left).toBe('1240px'); // 1840 - 600
        expect(containerEl.style.top).toBe('320px'); // 20 + 300
    });

    it('[정상] expanded 에서 헤더로 옮긴 뒤 접으면 pill 이 그 위치에 나타난다', async () => {
        const user = userEvent.setup();
        setViewport(1000, 800);
        const { containerEl } = mountAppWithContainer({ width: 320, height: 400 });
        // expanded default left = 1000 - 320 - 20 = 660

        fireEvent.pointerDown(timerHeader(), { clientX: 400, clientY: 300 });
        fireEvent.pointerMove(window, { clientX: 200, clientY: 450 });
        fireEvent.pointerUp(window, { clientX: 200, clientY: 450 });
        // 660 - 200 = 460, 20 + 150 = 170

        await collapse(user);

        expect(screen.queryByRole('button', { name: /펼치기/ })).not.toBeNull();
        expect(containerEl.style.left).toBe('460px');
        expect(containerEl.style.top).toBe('170px');
    });

    it('[정상] pill 드래그 중 body 커서가 grabbing 이 되고 종료 시 되돌아온다', async () => {
        const user = userEvent.setup();
        mountAppWithContainer({ width: 140, height: 40 });
        await collapse(user);

        fireEvent.pointerDown(pill(), { clientX: 100, clientY: 100 });
        fireEvent.pointerMove(window, { clientX: 140, clientY: 140 });

        expect(document.body.style.cursor).toBe('grabbing');

        fireEvent.pointerUp(window, { clientX: 140, clientY: 140 });

        expect(document.body.style.cursor).toBe('');
    });

    it('[정상] pill 을 우측 가장자리로 옮긴 뒤 펼치면 넓은 패널이 뷰포트 안으로 재배치된다', async () => {
        const user = userEvent.setup();
        setViewport(1000, 800);
        const { containerEl } = mountAppWithContainer({ width: 140, height: 40 });
        await collapse(user);
        // pill default left = 840

        // pill 을 우측 끝으로 드래그 (140 폭 → maxLeft = 860)
        fireEvent.pointerDown(pill(), { clientX: 100, clientY: 100 });
        fireEvent.pointerMove(window, { clientX: 300, clientY: 100 });
        fireEvent.pointerUp(window, { clientX: 300, clientY: 100 });
        // 840 + 200 = 1040 → clamp 860
        expect(containerEl.style.left).toBe('860px');

        // 펼치면 패널 폭 320 → maxLeft = 680 이므로 재clamp 되어야 함
        vi.spyOn(containerEl, 'getBoundingClientRect').mockReturnValue(domRect(320, 400));
        fireEvent.click(pill()); // 억제됨
        fireEvent.click(pill()); // 펼침

        expect(doneBtn()).not.toBeNull();
        expect(containerEl.style.left).toBe('680px'); // 1000 - 320
    });

    it('[예외] pill 드래그 중 pointercancel 이 오면 collapsed 로 유지되고 종료된다', async () => {
        const user = userEvent.setup();
        setViewport(1000, 800);
        const { containerEl } = mountAppWithContainer({ width: 140, height: 40 });
        await collapse(user);

        fireEvent.pointerDown(pill(), { clientX: 100, clientY: 100 });
        fireEvent.pointerMove(window, { clientX: 60, clientY: 300 });
        fireEvent.pointerCancel(window, { clientX: 60, clientY: 300 });

        expect(screen.queryByRole('button', { name: /펼치기/ })).not.toBeNull();
        expect(containerEl.hasAttribute('data-dragging')).toBe(false);
        expect(containerEl.style.left).toBe('800px'); // 840 - 40
    });
});

describe('App timer-session', () => {
    it('[정상] 진행 중 세션을 넘기면 0초가 아니라 실제 경과 시간부터 이어진 타이머 화면으로 시작한다', () => {
        const session = makeSession({ startedAt: Date.now() - 5_000 });
        render(<App problemId={PROBLEM_ID} initialSession={session} />);

        expect(screen.getByText('문제 #' + PROBLEM_ID)).toBeInTheDocument();
        expect(screen.getByText(/00:0[4-6]/)).toBeInTheDocument(); // 약 5초 경과
    });

    it('[정상] 완료된 세션을 넘기면 결과 선택 화면으로 바로 진입하고 경과 시간이 고정 표시된다', () => {
        const session = makeSession({
            status: 'stopped',
            startedAt: 1_000,
            stoppedAt: 1_000 + 450_000, // 7분 30초
        });
        render(<App problemId={PROBLEM_ID} initialSession={session} />);

        expect(screen.getByText('결과 선택')).toBeInTheDocument();
        expect(screen.getByText('07:30')).toBeInTheDocument();
    });

    it('[정상] "완료" 클릭 시 writeTimerSession 이 markCompleted 결과로 호출된다', async () => {
        const writeSpy = vi.spyOn(sessionStore, 'writeTimerSession').mockResolvedValue(undefined);
        const session = makeSession({ startedAt: 1_000 });
        const user = userEvent.setup();
        render(<App problemId={PROBLEM_ID} initialSession={session} />);

        await user.click(screen.getByRole('button', { name: '완료' }));

        expect(writeSpy).toHaveBeenCalledWith(
            PROBLEM_ID,
            expect.objectContaining({ problemId: PROBLEM_ID, startedAt: 1_000, status: 'stopped' }),
        );
    });

    it('[정상] success 화면 진입 시 removeTimerSession 이 호출된다', async () => {
        const removeSpy = vi.spyOn(sessionStore, 'removeTimerSession').mockResolvedValue(undefined);
        const session = makeSession();
        const user = userEvent.setup();
        render(<App problemId={PROBLEM_ID} initialSession={session} />);

        await user.click(screen.getByRole('button', { name: '완료' }));
        await user.click(screen.getByText('보류'));
        await user.click(screen.getByRole('button', { name: '다음' }));
        await user.click(screen.getByRole('button', { name: 'DFS' }));
        await user.click(screen.getByRole('button', { name: '저장' }));

        expect(screen.getByText('저장되었어요')).toBeInTheDocument();
        expect(removeSpy).toHaveBeenCalledWith(PROBLEM_ID);
    });

    it('[정상] 세션 복원 후에도 안내 문구·배지가 없다', () => {
        const session = makeSession({ startedAt: Date.now() - 5_000 });
        render(<App problemId={PROBLEM_ID} initialSession={session} />);

        expect(screen.queryByText(/이어서|복원/)).not.toBeInTheDocument();
    });

    it('[예외] writeTimerSession 이 실패해도 화면 흐름은 정상 진행된다', async () => {
        vi.spyOn(sessionStore, 'writeTimerSession').mockRejectedValue(new Error('quota'));
        const session = makeSession({ startedAt: 1_000 });
        const user = userEvent.setup();
        render(<App problemId={PROBLEM_ID} initialSession={session} />);

        await user.click(screen.getByRole('button', { name: '완료' }));

        expect(screen.getByText('결과 선택')).toBeInTheDocument();
    });

    it('[예외] removeTimerSession 이 실패해도 success 화면은 정상 표시된다', async () => {
        vi.spyOn(sessionStore, 'removeTimerSession').mockRejectedValue(new Error('quota'));
        const session = makeSession();
        const user = userEvent.setup();
        render(<App problemId={PROBLEM_ID} initialSession={session} />);

        await user.click(screen.getByRole('button', { name: '완료' }));
        await user.click(screen.getByText('보류'));
        await user.click(screen.getByRole('button', { name: '다음' }));
        await user.click(screen.getByRole('button', { name: 'DFS' }));
        await user.click(screen.getByRole('button', { name: '저장' }));

        expect(screen.getByText('저장되었어요')).toBeInTheDocument();
    });
});

describe('App problem title (#37)', () => {
    it('[정상] problemTitle이 있으면 제목만 표시하고 "문제 #{ID}" 텍스트는 없다', () => {
        render(<App problemId={PROBLEM_ID} problemTitle="26837. DNA 수열" />);

        expect(screen.getByText('26837. DNA 수열')).toBeInTheDocument();
        expect(screen.queryByText(`문제 #${PROBLEM_ID}`)).not.toBeInTheDocument();
    });
});
