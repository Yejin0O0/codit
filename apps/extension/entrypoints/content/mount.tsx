import { flushSync } from 'react-dom';
import ReactDOM from 'react-dom/client';

import App from './App';
import { readProblemTitle, writeProblemTitle } from './problem/problem-title-store';
import { resolveProblemId } from './problem/resolve-problem-id';
import { resolveProblemTitle } from './problem/resolve-problem-title';
import css from './style.css?inline';
import { deriveInitialState } from './timer-session/session';
import { readTimerSession, writeTimerSession } from './timer-session/store';

const ROOT_ID = 'codit-root';

/** contestProbId 가 확정된 뒤 실제 위젯을 mount 한다(container/Shadow DOM/Timer Session/React). */
function performMount(problemId: string): void {
    // 1. Codit Root
    const container = document.createElement('div');
    container.id = ROOT_ID;
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '999999';
    document.body.appendChild(container);

    // 2. Shadow DOM
    const shadowRoot = container.attachShadow({ mode: 'open' });

    // 3. Tailwind CSS — 컴파일된 :root 규칙을 Shadow Root 스코프(:host)로 재배치
    const style = document.createElement('style');
    style.textContent = css.replaceAll(':root', ':host');
    shadowRoot.appendChild(style);

    // 4. React mount 영역
    const app = document.createElement('div');
    shadowRoot.appendChild(app);

    // 5. React 실행
    //    #codit-root(container)를 주입해 App 이 위치·드래그를 제어한다.
    //    top:20/right:20 초기 스타일은 useWidgetPosition 이 top/left 로 전환한다.
    //    Timer Session 은 읽기(복원 시도) 뒤에만 App 을 mount 한다 (timer-persistence
    //    prd ADR-3) — 저장된 세션이 없었을 때만 새로 만들어 저장한다.
    void (async () => {
        const stored = await readTimerSession(problemId);
        const session = deriveInitialState(problemId, stored, Date.now());
        if (!stored) {
            await writeTimerSession(problemId, session);
        }

        // 문제 제목은 같은 problemId 인 동안 고정한다 — problemDetail.do 와
        // solvingProblem.do 에서 표시 텍스트가 다를 수 있어(#37), 페이지를
        // 옮길 때마다 새로 읽으면 제목이 바뀌어 보인다. 캐시가 있으면 재사용,
        // 없으면(=다른 문제로 바뀐 경우 포함) DOM 에서 읽어 한 번만 저장한다.
        let problemTitle = await readProblemTitle(problemId);
        if (!problemTitle) {
            const resolved = resolveProblemTitle(document);
            if (resolved) {
                problemTitle = resolved;
                await writeProblemTitle(problemId, resolved);
            }
        }

        flushSync(() => {
            ReactDOM.createRoot(app).render(
                <App
                    problemId={problemId}
                    problemTitle={problemTitle}
                    containerEl={container}
                    initialSession={session}
                />,
            );
        });
    })();
}

/**
 * 현재 페이지가 SWEA 문제 페이지(`contestProbId` 보유)일 때만 Codit 위젯을 mount 한다.
 *
 * contestProbId 를 URL 에서 즉시 못 얻으면(`solvingProblem.do` 등 hidden input 만
 * 가진 페이지), hidden input 이 나타날 때까지 DOM 을 관찰하다가 식별되는 순간
 * mount 한다(timer-persistence prd ADR-1). 고정 timeout 없음 — 끝내 식별 안 되면
 * 계속 관찰만 하고 SWEA 화면은 건드리지 않는다.
 *
 * @param href 판별에 쓸 URL (기본값: 현재 페이지)
 * @returns 이 호출에서 즉시 mount 했으면 true (관찰이 시작됐을 뿐이면 false)
 */
export function mountCoditWidget(href: string = window.location.href): boolean {
    // 중복 mount 방지
    if (document.querySelector(`#${ROOT_ID}`)) {
        return false;
    }

    const problemId = resolveProblemId(document, href);
    if (problemId) {
        performMount(problemId);
        return true;
    }

    const observer = new MutationObserver(() => {
        if (document.querySelector(`#${ROOT_ID}`)) {
            observer.disconnect();
            return;
        }
        const resolved = resolveProblemId(document, window.location.href);
        if (resolved) {
            observer.disconnect();
            performMount(resolved);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('pagehide', () => observer.disconnect(), { once: true });

    return false;
}
